import { Router, Request, Response } from 'express';
import { 
  getRoadmapView,
  pushToJira,
  syncFromJira,
  updateFeatureStatus,
  getFeatureCustomerQuotes
} from './service.js';

export const roadmapRoutes = Router();

/**
 * Get roadmap view (features sorted by revenue at risk)
 */
roadmapRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      view = 'list', // 'list' | 'kanban'
      page = '1',
      limit = '50'
    } = req.query;

    const roadmap = await getRoadmapView({
      status: status as string,
      view: view as 'list' | 'kanban',
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch roadmap' });
  }
});

/**
 * Get public roadmap (for portal)
 */
roadmapRoutes.get('/public', async (req: Request, res: Response) => {
  try {
    const roadmap = await getRoadmapView({
      isPublic: true,
      status: 'planned,in_progress'
    });

    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Error fetching public roadmap:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public roadmap' });
  }
});

/**
 * Push feature to Jira
 */
roadmapRoutes.post('/:id/jira', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const { projectKey } = req.body;

    const result = await pushToJira(featureId, projectKey);

    res.json({ 
      success: true, 
      data: result,
      message: 'Feature pushed to Jira successfully'
    });
  } catch (error) {
    console.error('Error pushing to Jira:', error);
    res.status(500).json({ success: false, error: 'Failed to push to Jira' });
  }
});

/**
 * Sync feature status from Jira
 */
roadmapRoutes.post('/:id/jira/sync', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const result = await syncFromJira(featureId);

    res.json({ 
      success: true, 
      data: result,
      message: 'Synced from Jira successfully'
    });
  } catch (error) {
    console.error('Error syncing from Jira:', error);
    res.status(500).json({ success: false, error: 'Failed to sync from Jira' });
  }
});

/**
 * Update feature status (triggers Jira sync)
 */
roadmapRoutes.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = await updateFeatureStatus(featureId, status);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * Get customer quotes for a feature (for Jira description)
 */
roadmapRoutes.get('/:id/quotes', async (req: Request, res: Response) => {
  try {
    const featureId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const quotes = await getFeatureCustomerQuotes(featureId, limit);

    res.json({ success: true, data: quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quotes' });
  }
});

/**
 * Get roadmap statistics
 */
roadmapRoutes.get('/stats', async (req: Request, res: Response) => {
  try {
    const { getRoadmapStats } = await import('./service.js');
    const stats = await getRoadmapStats();

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

