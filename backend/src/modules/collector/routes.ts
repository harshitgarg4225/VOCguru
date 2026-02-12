import { Router, Request, Response } from 'express';
import { normalizePayload, processSlackEvent, processZoomEvent, processManualFeedback } from './service.js';
import type { SlackEvent, ZoomEvent } from '../../types/index.js';

export const webhookRoutes = Router();

/**
 * Unified webhook endpoint for all integrations
 * Uses X-Source header to determine payload type
 */
webhookRoutes.post('/ingest', async (req: Request, res: Response) => {
  try {
    const source = req.headers['x-source'] as string || 'unknown';
    const rawBody = req.body;
    
    // Parse body if it's a Buffer (from raw middleware)
    const payload = Buffer.isBuffer(rawBody) 
      ? JSON.parse(rawBody.toString()) 
      : rawBody;

    console.log(`📥 Incoming webhook from: ${source}`);

    switch (source.toLowerCase()) {
      case 'slack':
        // Handle Slack URL verification challenge
        if (payload.challenge) {
          return res.json({ challenge: payload.challenge });
        }
        await processSlackEvent(payload as SlackEvent);
        break;
        
      case 'zoom':
        await processZoomEvent(payload as ZoomEvent);
        break;
        
      default:
        // Try to normalize as generic payload
        const normalized = normalizePayload(source, payload);
        if (normalized) {
          await processManualFeedback(normalized);
        }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process webhook' });
  }
});

/**
 * Slack-specific webhook endpoint
 * Handles event subscriptions and interactions
 */
webhookRoutes.post('/slack', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body;
    const payload = Buffer.isBuffer(rawBody) 
      ? JSON.parse(rawBody.toString()) 
      : rawBody;

    // URL verification
    if (payload.type === 'url_verification') {
      return res.json({ challenge: payload.challenge });
    }

    await processSlackEvent(payload);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Zoom webhook endpoint
 * Handles recording transcripts
 */
webhookRoutes.post('/zoom', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body;
    const payload = Buffer.isBuffer(rawBody) 
      ? JSON.parse(rawBody.toString()) 
      : rawBody;

    await processZoomEvent(payload);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Zoom webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Jira webhook endpoint
 * Handles issue status updates
 */
webhookRoutes.post('/jira', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Import dynamically to avoid circular deps
    const { processJiraWebhook } = await import('../broadcaster/service.js');
    await processJiraWebhook(payload);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Jira webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Manual feedback submission
 * For direct form submissions or API integrations
 */
webhookRoutes.post('/manual', async (req: Request, res: Response) => {
  try {
    const { content, author_email, author_name, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const normalized = normalizePayload('manual', {
      content,
      author_email,
      author_name,
      metadata: metadata || {}
    });

    if (normalized) {
      const feedbackId = await processManualFeedback(normalized);
      res.status(201).json({ success: true, feedbackId });
    } else {
      res.status(400).json({ success: false, error: 'Invalid payload' });
    }
  } catch (error) {
    console.error('Manual feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to process feedback' });
  }
});

