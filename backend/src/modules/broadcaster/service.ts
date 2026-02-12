import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import axios from 'axios';
import { query } from '../../config/database.js';
import { generateReleaseNote } from '../../config/groq.js';
import type { Notification, Feature, Customer, JiraWebhook } from '../../types/index.js';

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@propel.app';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Get pending notifications
 */
export async function getPendingNotifications(
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: Array<Notification & { feature_title?: string; customer_name?: string }>; total: number }> {
  const offset = (page - 1) * limit;

  const countResult = await query<{ count: string }>(
    "SELECT COUNT(*) FROM notifications WHERE status = 'pending'"
  );

  const notifications = await query<Notification & { feature_title?: string; customer_name?: string }>(
    `SELECT n.*, f.title as feature_title, c.name as customer_name
     FROM notifications n
     LEFT JOIN features f ON n.feature_id = f.id
     LEFT JOIN customers c ON n.customer_id = c.id
     WHERE n.status = 'pending'
     ORDER BY n.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    notifications,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Get notification history with filters
 */
export async function getNotificationHistory(options: {
  status?: string;
  featureId?: string;
  page?: number;
  limit?: number;
}): Promise<{ notifications: Notification[]; total: number }> {
  const { status, featureId, page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (featureId) {
    conditions.push(`feature_id = $${paramIndex++}`);
    params.push(featureId);
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}` 
    : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM notifications ${whereClause}`,
    params
  );

  const notifications = await query<Notification>(
    `SELECT n.*, f.title as feature_title, c.name as customer_name
     FROM notifications n
     LEFT JOIN features f ON n.feature_id = f.id
     LEFT JOIN customers c ON n.customer_id = c.id
     ${whereClause}
     ORDER BY n.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    notifications,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Generate notifications for all customers linked to a shipped feature
 */
export async function generateNotificationsForFeature(featureId: string): Promise<number> {
  // Get feature details
  const features = await query<Feature>(
    'SELECT * FROM features WHERE id = $1',
    [featureId]
  );

  const feature = features[0];
  if (!feature) throw new Error('Feature not found');

  // Get all customers who gave feedback for this feature
  const customers = await query<Customer & { feedback_date: Date }>(
    `SELECT DISTINCT c.*, MIN(f.created_at) as feedback_date
     FROM customers c
     JOIN feedback fb ON c.id = fb.customer_id
     JOIN feedback_features ff ON fb.id = ff.feedback_id
     WHERE ff.feature_id = $1
     GROUP BY c.id`,
    [featureId]
  );

  let generated = 0;

  for (const customer of customers) {
    try {
      // Generate personalized message using Groq
      const feedbackDate = new Date(customer.feedback_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const body = await generateReleaseNote(feature.title, feedbackDate);

      // Determine channel (prefer email, fallback to Slack)
      const channel = customer.email ? 'email' : 'slack';
      const recipient = customer.email || customer.slack_user_id || '';

      if (!recipient) continue;

      // Create notification
      await query(
        `INSERT INTO notifications (id, feature_id, customer_id, channel, recipient, subject, body, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          uuidv4(),
          featureId,
          customer.id,
          channel,
          recipient,
          `${feature.title} is live! 🎉`,
          body
        ]
      );

      generated++;
    } catch (error) {
      console.error(`Error generating notification for customer ${customer.id}:`, error);
    }
  }

  console.log(`📨 Generated ${generated} notifications for feature: ${feature.title}`);
  return generated;
}

/**
 * Approve a notification
 */
export async function approveNotification(
  notificationId: string,
  approvedBy?: string
): Promise<Notification | null> {
  const results = await query<Notification>(
    `UPDATE notifications 
     SET status = 'approved', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [approvedBy || null, notificationId]
  );

  return results[0] || null;
}

/**
 * Reject a notification
 */
export async function rejectNotification(
  notificationId: string,
  reason?: string
): Promise<Notification | null> {
  const results = await query<Notification>(
    `UPDATE notifications 
     SET status = 'failed', error_message = $1
     WHERE id = $2
     RETURNING *`,
    [reason || 'Rejected by PM', notificationId]
  );

  return results[0] || null;
}

/**
 * Regenerate notification content
 */
export async function regenerateNotification(notificationId: string): Promise<Notification | null> {
  const notifications = await query<Notification & { feature_title?: string; feedback_date?: Date }>(
    `SELECT n.*, f.title as feature_title, 
            (SELECT MIN(fb.created_at) FROM feedback fb 
             JOIN feedback_features ff ON fb.id = ff.feedback_id 
             WHERE ff.feature_id = n.feature_id AND fb.customer_id = n.customer_id) as feedback_date
     FROM notifications n
     LEFT JOIN features f ON n.feature_id = f.id
     WHERE n.id = $1`,
    [notificationId]
  );

  const notification = notifications[0];
  if (!notification) return null;

  const feedbackDate = notification.feedback_date 
    ? new Date(notification.feedback_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      })
    : 'recently';

  const body = await generateReleaseNote(notification.feature_title || 'your feature', feedbackDate);

  const results = await query<Notification>(
    `UPDATE notifications SET body = $1, status = 'pending' WHERE id = $2 RETURNING *`,
    [body, notificationId]
  );

  return results[0] || null;
}

/**
 * Update notification content manually
 */
export async function updateNotificationContent(
  notificationId: string,
  data: { body?: string; subject?: string }
): Promise<Notification | null> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.body) {
    updates.push(`body = $${paramIndex++}`);
    params.push(data.body);
  }
  if (data.subject) {
    updates.push(`subject = $${paramIndex++}`);
    params.push(data.subject);
  }

  if (updates.length === 0) return null;

  params.push(notificationId);

  const results = await query<Notification>(
    `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return results[0] || null;
}

/**
 * Send a single notification
 */
export async function sendNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const notifications = await query<Notification>(
    'SELECT * FROM notifications WHERE id = $1',
    [notificationId]
  );

  const notification = notifications[0];
  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  if (notification.status !== 'approved') {
    return { success: false, error: 'Notification not approved' };
  }

  try {
    if (notification.channel === 'email') {
      await sendEmail(notification);
    } else if (notification.channel === 'slack') {
      await sendSlackMessage(notification);
    }

    // Mark as sent
    await query(
      "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1",
      [notificationId]
    );

    return { success: true };
  } catch (error: any) {
    // Mark as failed
    await query(
      "UPDATE notifications SET status = 'failed', error_message = $1 WHERE id = $2",
      [error.message, notificationId]
    );

    return { success: false, error: error.message };
  }
}

/**
 * Send email notification
 */
async function sendEmail(notification: Notification): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: notification.recipient,
    subject: notification.subject || 'Update from our team',
    text: notification.body,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <p style="font-size: 16px; line-height: 1.6; color: #131313;">
          ${notification.body.replace(/\n/g, '<br>')}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666;">
          You're receiving this because you gave us feedback. Thank you! 💜
        </p>
      </div>
    `
  });
}

/**
 * Send Slack notification
 */
async function sendSlackMessage(notification: Notification): Promise<void> {
  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: notification.recipient,
    text: notification.body,
    mrkdwn: true
  }, {
    headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
  });
}

/**
 * Blast all approved notifications (optionally for a specific feature)
 */
export async function blastAllApproved(featureId?: string): Promise<{ sent: number; failed: number }> {
  let whereClause = "WHERE status = 'approved'";
  const params: any[] = [];

  if (featureId) {
    whereClause += ' AND feature_id = $1';
    params.push(featureId);
  }

  const notifications = await query<Notification>(
    `SELECT * FROM notifications ${whereClause}`,
    params
  );

  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const result = await sendNotification(notification.id);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Process Jira webhook for status changes
 */
export async function processJiraWebhook(webhook: JiraWebhook): Promise<void> {
  // Only process issue_updated events
  if (webhook.webhookEvent !== 'jira:issue_updated') return;

  // Check if status changed
  const statusChange = webhook.changelog?.items.find(item => item.field === 'status');
  if (!statusChange) return;

  const issueKey = webhook.issue.key;
  const newStatus = statusChange.toString.toLowerCase();

  // Find feature by Jira key
  const features = await query<Feature>(
    'SELECT * FROM features WHERE jira_issue_key = $1',
    [issueKey]
  );

  const feature = features[0];
  if (!feature) {
    console.log(`No feature found for Jira issue: ${issueKey}`);
    return;
  }

  // Check if status changed to Done/Closed/Complete
  if (newStatus.includes('done') || newStatus.includes('complete') || newStatus.includes('closed')) {
    // Update feature status
    await query(
      "UPDATE features SET status = 'shipped' WHERE id = $1",
      [feature.id]
    );

    // Generate notifications
    await generateNotificationsForFeature(feature.id);

    console.log(`🎉 Feature shipped via Jira: ${feature.title}`);
  } else if (newStatus.includes('progress')) {
    await query(
      "UPDATE features SET status = 'in_progress' WHERE id = $1",
      [feature.id]
    );
  }
}

