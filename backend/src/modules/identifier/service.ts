import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import axios from 'axios';
import { query } from '../../config/database.js';
import type { Customer } from '../../types/index.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const results = await query<Customer>(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );
  return results[0] || null;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const results = await query<Customer>(
    'SELECT * FROM customers WHERE email = $1',
    [email.toLowerCase()]
  );
  return results[0] || null;
}

/**
 * Get customer by Slack user ID
 */
export async function getCustomerBySlackId(slackUserId: string): Promise<Customer | null> {
  const results = await query<Customer>(
    'SELECT * FROM customers WHERE slack_user_id = $1',
    [slackUserId]
  );
  return results[0] || null;
}

/**
 * Get all customers with pagination
 */
export async function getAllCustomers(
  page: number = 1, 
  limit: number = 50,
  search?: string
): Promise<{ customers: Customer[]; total: number }> {
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  const params: any[] = [];
  
  if (search) {
    whereClause = 'WHERE email ILIKE $1 OR name ILIKE $1 OR company_name ILIKE $1';
    params.push(`%${search}%`);
  }
  
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM customers ${whereClause}`,
    params
  );
  
  const customers = await query<Customer>(
    `SELECT * FROM customers ${whereClause} 
     ORDER BY arr DESC, created_at DESC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return {
    customers,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Update customer details
 */
export async function updateCustomer(
  id: string, 
  data: Partial<Pick<Customer, 'name' | 'company_name' | 'plan_name'>>
): Promise<Customer | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.company_name !== undefined) {
    updates.push(`company_name = $${paramIndex++}`);
    values.push(data.company_name);
  }
  if (data.plan_name !== undefined) {
    updates.push(`plan_name = $${paramIndex++}`);
    values.push(data.plan_name);
  }
  
  if (updates.length === 0) return getCustomerById(id);
  
  values.push(id);
  
  const results = await query<Customer>(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return results[0] || null;
}

/**
 * Resolve Slack user ID to email
 */
export async function resolveSlackUserEmail(slackUserId: string): Promise<string | null> {
  try {
    const response = await axios.get('https://slack.com/api/users.info', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { user: slackUserId }
    });

    if (response.data.ok) {
      return response.data.user.profile?.email || null;
    }
    return null;
  } catch (error) {
    console.error('Error resolving Slack user:', error);
    return null;
  }
}

/**
 * Sync customer data from Stripe by email
 */
export async function syncCustomerFromStripe(email: string): Promise<Customer> {
  const normalizedEmail = email.toLowerCase();
  
  // Check if customer exists locally
  let customer = await getCustomerByEmail(normalizedEmail);
  
  // Search Stripe for customer
  const stripeCustomers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 1,
    expand: ['data.subscriptions']
  });

  let arr = 0;
  let planName = 'Free';
  let stripeId: string | null = null;

  if (stripeCustomers.data.length > 0) {
    const stripeCustomer = stripeCustomers.data[0];
    stripeId = stripeCustomer.id;

    // Calculate ARR from subscriptions
    const subscriptions = stripeCustomer.subscriptions?.data || [];
    
    for (const sub of subscriptions) {
      if (sub.status === 'active' || sub.status === 'trialing') {
        for (const item of sub.items.data) {
          const price = item.price;
          let annualAmount = 0;

          if (price.recurring) {
            const unitAmount = price.unit_amount || 0;
            const quantity = item.quantity || 1;
            
            switch (price.recurring.interval) {
              case 'month':
                annualAmount = (unitAmount * quantity * 12) / 100;
                break;
              case 'year':
                annualAmount = (unitAmount * quantity) / 100;
                break;
              case 'week':
                annualAmount = (unitAmount * quantity * 52) / 100;
                break;
              case 'day':
                annualAmount = (unitAmount * quantity * 365) / 100;
                break;
            }
          }
          
          arr += annualAmount;
        }
        
        // Get plan name from first active subscription
        if (sub.items.data[0]?.price.product) {
          const productId = typeof sub.items.data[0].price.product === 'string' 
            ? sub.items.data[0].price.product 
            : sub.items.data[0].price.product.id;
          const product = await stripe.products.retrieve(productId);
          planName = product.name;
        }
      }
    }
  }

  // Upsert customer
  if (customer) {
    const results = await query<Customer>(
      `UPDATE customers 
       SET stripe_id = COALESCE($1, stripe_id), 
           arr = $2, 
           plan_name = $3,
           last_synced_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [stripeId, arr, planName, customer.id]
    );
    return results[0];
  } else {
    const id = uuidv4();
    const results = await query<Customer>(
      `INSERT INTO customers (id, email, stripe_id, arr, plan_name, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, normalizedEmail, stripeId, arr, planName]
    );
    return results[0];
  }
}

/**
 * Resolve identity for a feedback entry
 * This is called after feedback is saved to enrich it with customer data
 */
export async function resolveFeedbackIdentity(feedbackId: string): Promise<void> {
  // Get the feedback entry
  const feedbackResults = await query<{
    id: string;
    author_email?: string;
    metadata: Record<string, any>;
  }>(
    'SELECT id, author_email, metadata FROM feedback WHERE id = $1',
    [feedbackId]
  );

  const feedback = feedbackResults[0];
  if (!feedback) return;

  let email = feedback.author_email;

  // If no email but we have Slack metadata, try to resolve
  if (!email && feedback.metadata?.slack_user_id) {
    email = await resolveSlackUserEmail(feedback.metadata.slack_user_id);
  }

  if (!email) return;

  // Sync from Stripe (will create if doesn't exist)
  const customer = await syncCustomerFromStripe(email);

  // Calculate weight based on ARR
  const weight = calculateWeight(customer.arr);

  // Update feedback with customer link and weight
  await query(
    `UPDATE feedback 
     SET customer_id = $1, weight = $2, author_email = $3
     WHERE id = $4`,
    [customer.id, weight, email, feedbackId]
  );

  console.log(`✅ Identity resolved for feedback ${feedbackId}: ${email} ($${customer.arr} ARR)`);
}

/**
 * Calculate feedback weight based on ARR
 * Formula: base_score + (ARR / 1000)
 */
export function calculateWeight(arr: number): number {
  const baseScore = 1;
  const arrMultiplier = arr / 1000;
  return baseScore + arrMultiplier;
}

/**
 * Bulk sync all customers from Stripe
 */
export async function bulkSyncFromStripe(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const customers = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.subscriptions']
    });

    for (const stripeCustomer of customers.data) {
      if (stripeCustomer.email) {
        try {
          await syncCustomerFromStripe(stripeCustomer.email);
          synced++;
        } catch (error) {
          console.error(`Error syncing ${stripeCustomer.email}:`, error);
          errors++;
        }
      }
    }

    hasMore = customers.has_more;
    if (customers.data.length > 0) {
      startingAfter = customers.data[customers.data.length - 1].id;
    }
  }

  return { synced, errors };
}

