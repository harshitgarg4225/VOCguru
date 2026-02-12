import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../config/database.js';
import { extractFeature, generateEmbedding, type ExtractedFeature } from '../../config/groq.js';
import type { Feature, Feedback } from '../../types/index.js';

// Similarity threshold for auto-merge
const AUTO_MERGE_THRESHOLD = 0.15;

interface GetFeaturesOptions {
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Get all features with filtering and sorting
 */
export async function getAllFeatures(options: GetFeaturesOptions): Promise<{
  features: Feature[];
  total: number;
}> {
  const {
    status,
    sort = 'total_arr',
    order = 'desc',
    page = 1,
    limit = 50,
    search
  } = options;

  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}` 
    : '';

  // Validate sort column
  const validSortColumns = ['total_arr', 'total_weight', 'feedback_count', 'urgency_score', 'created_at', 'priority'];
  const sortColumn = validSortColumns.includes(sort) ? sort : 'total_arr';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM features ${whereClause}`,
    params
  );

  const features = await query<Feature>(
    `SELECT * FROM features ${whereClause} 
     ORDER BY ${sortColumn} ${sortOrder}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    features,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Get feature by ID
 */
export async function getFeatureById(id: string): Promise<Feature | null> {
  const results = await query<Feature>(
    'SELECT * FROM features WHERE id = $1',
    [id]
  );
  return results[0] || null;
}

/**
 * Get linked feedback for a feature
 */
export async function getLinkedFeedback(featureId: string): Promise<Array<Feedback & {
  customer_name?: string;
  customer_arr?: number;
  similarity_score?: number;
}>> {
  return await query(
    `SELECT f.*, c.name as customer_name, c.arr as customer_arr, ff.similarity_score
     FROM feedback f
     JOIN feedback_features ff ON f.id = ff.feedback_id
     LEFT JOIN customers c ON f.customer_id = c.id
     WHERE ff.feature_id = $1
     ORDER BY f.weight DESC, f.created_at DESC`,
    [featureId]
  );
}

/**
 * Update feature
 */
export async function updateFeature(
  id: string,
  data: Partial<Pick<Feature, 'title' | 'description' | 'status' | 'priority' | 'tags' | 'is_public'>>
): Promise<Feature | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`);
    values.push(data.priority);
  }
  if (data.tags !== undefined) {
    updates.push(`tags = $${paramIndex++}`);
    values.push(data.tags);
  }
  if (data.is_public !== undefined) {
    updates.push(`is_public = $${paramIndex++}`);
    values.push(data.is_public);
  }

  if (updates.length === 0) return getFeatureById(id);

  values.push(id);

  const results = await query<Feature>(
    `UPDATE features SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return results[0] || null;
}

/**
 * Process feedback: extract feature info and deduplicate
 */
export async function processFeedback(feedbackId: string): Promise<void> {
  // Get the feedback
  const feedbackResults = await query<Feedback>(
    'SELECT * FROM feedback WHERE id = $1',
    [feedbackId]
  );
  
  const feedback = feedbackResults[0];
  if (!feedback || feedback.processed) return;

  try {
    // Extract feature information using Groq
    const extracted = await extractFeature(feedback.content);
    
    // Generate embedding for similarity search
    const embedding = await generateEmbedding(
      `${extracted.feature_title} ${extracted.problem_summary}`
    );

    // Find similar existing features
    const similarFeature = await findMostSimilarFeature(embedding);

    let featureId: string;

    if (similarFeature && similarFeature.distance < AUTO_MERGE_THRESHOLD) {
      // Auto-merge with existing feature
      featureId = similarFeature.id;
      console.log(`🔗 Auto-merging feedback into existing feature: ${similarFeature.title}`);
    } else {
      // Create new feature
      featureId = await createFeature(extracted, embedding);
      console.log(`✨ Created new feature: ${extracted.feature_title}`);
    }

    // Link feedback to feature
    await linkFeedbackToFeature(feedbackId, featureId, similarFeature?.distance);

    // Mark feedback as processed
    await query(
      'UPDATE feedback SET processed = true WHERE id = $1',
      [feedbackId]
    );

    // Recalculate feature stats
    await recalculateFeatureStats(featureId);

  } catch (error) {
    console.error('Error processing feedback:', error);
    throw error;
  }
}

/**
 * Find the most similar feature using vector similarity
 */
async function findMostSimilarFeature(embedding: number[]): Promise<{
  id: string;
  title: string;
  distance: number;
} | null> {
  const embeddingStr = `[${embedding.join(',')}]`;
  
  const results = await query<{ id: string; title: string; distance: number }>(
    `SELECT id, title, embedding <=> $1::vector as distance
     FROM features
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    [embeddingStr]
  );

  return results[0] || null;
}

/**
 * Find similar features for a given feature ID
 */
export async function findSimilarFeatures(
  featureId: string, 
  threshold: number = 0.3
): Promise<Array<Feature & { similarity: number }>> {
  const feature = await getFeatureById(featureId);
  if (!feature || !feature.embedding) return [];

  const embeddingStr = `[${(feature.embedding as number[]).join(',')}]`;

  return await query(
    `SELECT *, 1 - (embedding <=> $1::vector) as similarity
     FROM features
     WHERE id != $2 
       AND embedding IS NOT NULL
       AND (embedding <=> $1::vector) < $3
     ORDER BY embedding <=> $1::vector
     LIMIT 10`,
    [embeddingStr, featureId, threshold]
  );
}

/**
 * Create a new feature
 */
async function createFeature(
  extracted: ExtractedFeature,
  embedding: number[]
): Promise<string> {
  const id = uuidv4();
  const embeddingStr = `[${embedding.join(',')}]`;

  await query(
    `INSERT INTO features (
      id, title, problem_summary, sentiment, urgency_score, tags, embedding
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::vector)`,
    [
      id,
      extracted.feature_title,
      extracted.problem_summary,
      extracted.sentiment,
      extracted.urgency,
      extracted.tags,
      embeddingStr
    ]
  );

  return id;
}

/**
 * Link feedback to feature
 */
async function linkFeedbackToFeature(
  feedbackId: string,
  featureId: string,
  similarityScore?: number
): Promise<void> {
  await query(
    `INSERT INTO feedback_features (id, feedback_id, feature_id, similarity_score)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (feedback_id, feature_id) DO NOTHING`,
    [uuidv4(), feedbackId, featureId, similarityScore || null]
  );
}

/**
 * Recalculate feature statistics
 */
async function recalculateFeatureStats(featureId: string): Promise<void> {
  await query('SELECT recalculate_feature_stats($1)', [featureId]);
}

/**
 * Manually merge two features
 */
export async function manualMergeFeatures(
  sourceId: string,
  targetId: string
): Promise<Feature> {
  return await transaction(async (client) => {
    // Move all feedback links from source to target
    await client.query(
      `UPDATE feedback_features 
       SET feature_id = $1 
       WHERE feature_id = $2
       AND feedback_id NOT IN (
         SELECT feedback_id FROM feedback_features WHERE feature_id = $1
       )`,
      [targetId, sourceId]
    );

    // Delete duplicate links
    await client.query(
      'DELETE FROM feedback_features WHERE feature_id = $1',
      [sourceId]
    );

    // Recalculate target stats
    await client.query('SELECT recalculate_feature_stats($1)', [targetId]);

    // Mark source as declined (or delete)
    await client.query(
      "UPDATE features SET status = 'declined' WHERE id = $1",
      [sourceId]
    );

    // Return updated target feature
    const result = await client.query(
      'SELECT * FROM features WHERE id = $1',
      [targetId]
    );
    return result.rows[0];
  });
}

/**
 * Reprocess all unprocessed feedback
 */
export async function reprocessFeedback(): Promise<{ processed: number; errors: number }> {
  const unprocessed = await query<Feedback>(
    'SELECT id FROM feedback WHERE processed = false ORDER BY created_at ASC LIMIT 100'
  );

  let processed = 0;
  let errors = 0;

  for (const feedback of unprocessed) {
    try {
      await processFeedback(feedback.id);
      processed++;
    } catch (error) {
      console.error(`Error processing feedback ${feedback.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

