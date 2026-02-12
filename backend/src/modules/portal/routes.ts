import { Router, Request, Response } from 'express';
import { 
  getPublicRoadmap,
  getPublicFeature,
  submitVote,
  getFeatureVotes
} from './service.js';

export const portalRoutes = Router();

/**
 * Get public roadmap items
 * No authentication required
 */
portalRoutes.get('/roadmap', async (req: Request, res: Response) => {
  try {
    const {
      status = 'planned,in_progress',
      sort = 'votes',
      page = '1',
      limit = '20'
    } = req.query;

    const roadmap = await getPublicRoadmap({
      status: status as string,
      sort: sort as 'votes' | 'recent' | 'arr',
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Error fetching public roadmap:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch roadmap' });
  }
});

/**
 * Get single public feature
 */
portalRoutes.get('/features/:id', async (req: Request, res: Response) => {
  try {
    const feature = await getPublicFeature(req.params.id);

    if (!feature) {
      return res.status(404).json({ success: false, error: 'Feature not found' });
    }

    res.json({ success: true, data: feature });
  } catch (error) {
    console.error('Error fetching public feature:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feature' });
  }
});

/**
 * Submit vote for a feature ("I need this")
 * Captures email for updates without requiring full account
 */
portalRoutes.post('/features/:id/vote', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const { email, is_critical, wants_updates = true } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    const result = await submitVote(featureId, {
      email: email.toLowerCase(),
      is_critical: is_critical || false,
      wants_updates
    });

    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Thanks for your feedback!'
    });
  } catch (error: any) {
    if (error.message === 'Already voted') {
      return res.status(409).json({ success: false, error: 'You have already voted for this feature' });
    }
    console.error('Error submitting vote:', error);
    res.status(500).json({ success: false, error: 'Failed to submit vote' });
  }
});

/**
 * Check if email has voted for a feature
 */
portalRoutes.get('/features/:id/vote-check', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const email = (req.query.email as string)?.toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { hasVoted } = await import('./service.js');
    const voted = await hasVoted(featureId, email);

    res.json({ success: true, data: { has_voted: voted } });
  } catch (error) {
    console.error('Error checking vote:', error);
    res.status(500).json({ success: false, error: 'Failed to check vote status' });
  }
});

/**
 * Get vote stats for a feature
 */
portalRoutes.get('/features/:id/votes', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const votes = await getFeatureVotes(featureId);

    res.json({ success: true, data: votes });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch votes' });
  }
});

/**
 * Subscribe to updates without voting for specific feature
 * General newsletter-style subscription
 */
portalRoutes.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    const { subscribeToUpdates } = await import('./service.js');
    await subscribeToUpdates(email.toLowerCase());

    res.status(201).json({ 
      success: true, 
      message: 'Subscribed to updates!'
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

