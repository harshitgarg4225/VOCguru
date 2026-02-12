import { Router, Request, Response } from 'express';
import { 
  getCustomerById, 
  getCustomerByEmail, 
  syncCustomerFromStripe,
  getAllCustomers,
  updateCustomer
} from './service.js';

export const identifierRoutes = Router();

/**
 * Get all customers with pagination
 */
identifierRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const customers = await getAllCustomers(page, limit, search);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

/**
 * Get customer by ID
 */
identifierRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

/**
 * Lookup customer by email
 */
identifierRoutes.get('/lookup/email', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const customer = await getCustomerByEmail(email);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({ success: false, error: 'Failed to lookup customer' });
  }
});

/**
 * Sync customer data from Stripe
 */
identifierRoutes.post('/sync/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    const customer = await syncCustomerFromStripe(email);
    
    res.json({ 
      success: true, 
      data: customer,
      message: 'Customer synced successfully'
    });
  } catch (error) {
    console.error('Error syncing customer:', error);
    res.status(500).json({ success: false, error: 'Failed to sync customer' });
  }
});

/**
 * Update customer details
 */
identifierRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, company_name, plan_name } = req.body;
    
    const customer = await updateCustomer(req.params.id, {
      name,
      company_name,
      plan_name
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

/**
 * Bulk sync all customers from Stripe
 */
identifierRoutes.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const { bulkSyncFromStripe } = await import('./service.js');
    const result = await bulkSyncFromStripe();
    
    res.json({ 
      success: true, 
      data: result,
      message: `Synced ${result.synced} customers`
    });
  } catch (error) {
    console.error('Error bulk syncing:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk sync' });
  }
});

