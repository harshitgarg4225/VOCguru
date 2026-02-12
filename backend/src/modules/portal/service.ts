import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import type { Feature, PublicVote } from '../../types/index.js';

interface PublicRoadmapOptions {
  status?: string;
  sort?: 'votes' | 'recent' | 'arr';
  page?: number;
  limit?: number;
}

/**
 * Get public roadmap (only features marked as public)
 */
export async function getPublicRoadmap(options: PublicRoadmapOptions): Promise<{
  features: Array<Omit<Feature, 'embedding'> & { vote_count: number; critical_count: number }>;
  total: number;
}> {
  const { status = 'planned,in_progress', sort = 'votes', page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const statuses = status.split(',').map(s => s.trim());

  // Determine sort order
  let orderBy = 'public_votes DESC, total_arr DESC';
  if (sort === 'recent') {
    orderBy = 'created_at DESC';
  } else if (sort === 'arr') {
    orderBy = 'total_arr DESC, public_votes DESC';
  }

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM features 
     WHERE is_public = true AND status = ANY($1)`,
    [statuses]
  );

  const features = await query<Feature & { vote_count: number; critical_count: number }>(
    `SELECT f.id, f.title, f.description, f.problem_summary, f.status, f.tags,
            f.public_votes, f.created_at, f.updated_at,
            COALESCE(v.vote_count, 0) as vote_count,
            COALESCE(v.critical_count, 0) as critical_count
     FROM features f
     LEFT JOIN (
       SELECT feature_id, 
              COUNT(*) as vote_count,
              COUNT(*) FILTER (WHERE is_critical = true) as critical_count
       FROM public_votes
       GROUP BY feature_id
     ) v ON f.id = v.feature_id
     WHERE f.is_public = true AND f.status = ANY($1)
     ORDER BY ${orderBy}
     LIMIT $2 OFFSET $3`,
    [statuses, limit, offset]
  );

  return {
    features,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Get single public feature
 */
export async function getPublicFeature(featureId: string): Promise<(Omit<Feature, 'embedding'> & {
  vote_count: number;
  critical_count: number;
}) | null> {
  const results = await query<Feature & { vote_count: number; critical_count: number }>(
    `SELECT f.id, f.title, f.description, f.problem_summary, f.status, f.tags,
            f.public_votes, f.created_at, f.updated_at,
            COALESCE(v.vote_count, 0) as vote_count,
            COALESCE(v.critical_count, 0) as critical_count
     FROM features f
     LEFT JOIN (
       SELECT feature_id, 
              COUNT(*) as vote_count,
              COUNT(*) FILTER (WHERE is_critical = true) as critical_count
       FROM public_votes
       GROUP BY feature_id
     ) v ON f.id = v.feature_id
     WHERE f.id = $1 AND f.is_public = true`,
    [featureId]
  );

  return results[0] || null;
}

/**
 * Submit vote for a feature
 */
export async function submitVote(
  featureId: string,
  data: { email: string; is_critical: boolean; wants_updates: boolean }
): Promise<PublicVote> {
  // Check if feature exists and is public
  const feature = await query<Feature>(
    'SELECT id FROM features WHERE id = $1 AND is_public = true',
    [featureId]
  );

  if (!feature[0]) {
    throw new Error('Feature not found');
  }

  // Check if already voted
  const existing = await query<PublicVote>(
    'SELECT id FROM public_votes WHERE feature_id = $1 AND email = $2',
    [featureId, data.email]
  );

  if (existing.length > 0) {
    throw new Error('Already voted');
  }

  // Create vote
  const voteId = uuidv4();
  const results = await query<PublicVote>(
    `INSERT INTO public_votes (id, feature_id, email, is_critical, wants_updates)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [voteId, featureId, data.email, data.is_critical, data.wants_updates]
  );

  // Update feature vote count
  await query(
    'UPDATE features SET public_votes = public_votes + 1 WHERE id = $1',
    [featureId]
  );

  // Also upsert into customers table if they want updates (for future notifications)
  if (data.wants_updates) {
    await query(
      `INSERT INTO customers (id, email, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [uuidv4(), data.email]
    );
  }

  return results[0];
}

/**
 * Check if user has voted for a feature
 */
export async function hasVoted(featureId: string, email: string): Promise<boolean> {
  const results = await query<{ id: string }>(
    'SELECT id FROM public_votes WHERE feature_id = $1 AND email = $2',
    [featureId, email]
  );

  return results.length > 0;
}

/**
 * Get vote statistics for a feature
 */
export async function getFeatureVotes(featureId: string): Promise<{
  total: number;
  critical: number;
  regular: number;
}> {
  const results = await query<{ total: string; critical: string }>(
    `SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_critical = true) as critical
     FROM public_votes
     WHERE feature_id = $1`,
    [featureId]
  );

  const total = parseInt(results[0]?.total || '0');
  const critical = parseInt(results[0]?.critical || '0');

  return {
    total,
    critical,
    regular: total - critical
  };
}

/**
 * Subscribe to general updates
 */
export async function subscribeToUpdates(email: string): Promise<void> {
  await query(
    `INSERT INTO customers (id, email, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO NOTHING`,
    [uuidv4(), email]
  );
}

/**
 * Get all emails that want updates for a feature
 */
export async function getUpdateSubscribers(featureId: string): Promise<string[]> {
  const results = await query<{ email: string }>(
    `SELECT email FROM public_votes 
     WHERE feature_id = $1 AND wants_updates = true`,
    [featureId]
  );

  return results.map(r => r.email);
}

