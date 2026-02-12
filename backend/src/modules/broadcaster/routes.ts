import { Router, Request, Response } from 'express';
import { 
  getPendingNotifications,
  approveNotification,
  rejectNotification,
  sendNotification,
  blastAllApproved,
  getNotificationHistory,
  regenerateNotification
} from './service.js';

export const notificationRoutes = Router();

/**
 * Get pending notifications awaiting approval
 */
notificationRoutes.get('/pending', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await getPendingNotifications(page, limit);

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

/**
 * Get notification history
 */
notificationRoutes.get('/history', async (req: Request, res: Response) => {
  try {
    const {
      status,
      featureId,
      page = '1',
      limit = '50'
    } = req.query;

    const history = await getNotificationHistory({
      status: status as string,
      featureId: featureId as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * Approve a notification
 */
notificationRoutes.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.body.userId; // TODO: Get from auth middleware

    const notification = await approveNotification(notificationId, userId);

    res.json({ 
      success: true, 
      data: notification,
      message: 'Notification approved'
    });
  } catch (error) {
    console.error('Error approving notification:', error);
    res.status(500).json({ success: false, error: 'Failed to approve notification' });
  }
});

/**
 * Reject a notification
 */
notificationRoutes.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const { reason } = req.body;

    const notification = await rejectNotification(notificationId, reason);

    res.json({ 
      success: true, 
      data: notification,
      message: 'Notification rejected'
    });
  } catch (error) {
    console.error('Error rejecting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to reject notification' });
  }
});

/**
 * Regenerate notification content
 */
notificationRoutes.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const notification = await regenerateNotification(notificationId);

    res.json({ 
      success: true, 
      data: notification,
      message: 'Notification regenerated'
    });
  } catch (error) {
    console.error('Error regenerating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to regenerate notification' });
  }
});

/**
 * Send a single approved notification
 */
notificationRoutes.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const result = await sendNotification(notificationId);

    res.json({ 
      success: true, 
      data: result,
      message: 'Notification sent'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

/**
 * Blast all approved notifications
 */
notificationRoutes.post('/blast', async (req: Request, res: Response) => {
  try {
    const { featureId } = req.body;
    const result = await blastAllApproved(featureId);

    res.json({ 
      success: true, 
      data: result,
      message: `Sent ${result.sent} notifications`
    });
  } catch (error) {
    console.error('Error blasting notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to blast notifications' });
  }
});

/**
 * Update notification body (manual edit)
 */
notificationRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const { body, subject } = req.body;

    const { updateNotificationContent } = await import('./service.js');
    const notification = await updateNotificationContent(notificationId, { body, subject });

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

