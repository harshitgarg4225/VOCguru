import { Router, Request, Response } from 'express';
import { 
  getAllFeatures, 
  getFeatureById, 
  updateFeature,
  getLinkedFeedback,
  manualMergeFeatures,
  reprocessFeedback
} from './service.js';

export const synthesizerRoutes = Router();

/**
 * Get all features with filters
 */
synthesizerRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      sort = 'total_arr',
      order = 'desc',
      page = '1',
      limit = '50',
      search
    } = req.query;

    const features = await getAllFeatures({
      status: status as string,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string
    });

    res.json({ success: true, data: features });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch features' });
  }
});

/**
 * Get feature by ID with linked feedback
 */
synthesizerRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const feature = await getFeatureById(req.params.id);
    
    if (!feature) {
      return res.status(404).json({ success: false, error: 'Feature not found' });
    }

    const linkedFeedback = await getLinkedFeedback(req.params.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...feature, 
        linked_feedback: linkedFeedback 
      } 
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feature' });
  }
});

/**
 * Update feature
 */
synthesizerRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      tags,
      is_public 
    } = req.body;

    const feature = await updateFeature(req.params.id, {
      title,
      description,
      status,
      priority,
      tags,
      is_public
    });

    if (!feature) {
      return res.status(404).json({ success: false, error: 'Feature not found' });
    }

    res.json({ success: true, data: feature });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ success: false, error: 'Failed to update feature' });
  }
});

/**
 * Manually merge two features
 */
synthesizerRoutes.post('/merge', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId) {
      return res.status(400).json({ 
        success: false, 
        error: 'sourceId and targetId are required' 
      });
    }

    const mergedFeature = await manualMergeFeatures(sourceId, targetId);
    
    res.json({ 
      success: true, 
      data: mergedFeature,
      message: 'Features merged successfully'
    });
  } catch (error) {
    console.error('Error merging features:', error);
    res.status(500).json({ success: false, error: 'Failed to merge features' });
  }
});

/**
 * Reprocess pending feedback
 */
synthesizerRoutes.post('/reprocess', async (req: Request, res: Response) => {
  try {
    const result = await reprocessFeedback();
    
    res.json({ 
      success: true, 
      data: result,
      message: `Processed ${result.processed} feedback items`
    });
  } catch (error) {
    console.error('Error reprocessing feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to reprocess feedback' });
  }
});

/**
 * Find similar features (for manual dedup review)
 */
synthesizerRoutes.get('/:id/similar', async (req: Request, res: Response) => {
  try {
    const { findSimilarFeatures } = await import('./service.js');
    const threshold = parseFloat(req.query.threshold as string) || 0.3;
    
    const similar = await findSimilarFeatures(req.params.id, threshold);
    
    res.json({ success: true, data: similar });
  } catch (error) {
    console.error('Error finding similar features:', error);
    res.status(500).json({ success: false, error: 'Failed to find similar features' });
  }
});

