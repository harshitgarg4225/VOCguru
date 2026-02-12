import axios from 'axios';
import { query } from '../../config/database.js';
import type { Feature } from '../../types/index.js';

// Jira configuration
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'PROP';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Jira API client
const jiraClient = axios.create({
  baseURL: JIRA_BASE_URL,
  auth: {
    username: JIRA_EMAIL || '',
    password: JIRA_API_TOKEN || ''
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

interface RoadmapOptions {
  status?: string;
  view?: 'list' | 'kanban';
  page?: number;
  limit?: number;
  isPublic?: boolean;
}

/**
 * Get roadmap view with features sorted by revenue at risk
 */
export async function getRoadmapView(options: RoadmapOptions): Promise<{
  features: Feature[];
  total: number;
  byStatus?: Record<string, Feature[]>;
}> {
  const { status, view = 'list', page = 1, limit = 50, isPublic = false } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (isPublic) {
    conditions.push('is_public = true');
  }

  if (status) {
    const statuses = status.split(',').map(s => s.trim());
    conditions.push(`status = ANY($${paramIndex++})`);
    params.push(statuses);
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}` 
    : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM features ${whereClause}`,
    params
  );

  const features = await query<Feature>(
    `SELECT * FROM features ${whereClause}
     ORDER BY total_arr DESC, total_weight DESC, feedback_count DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  // For kanban view, also group by status
  if (view === 'kanban') {
    const allFeatures = await query<Feature>(
      `SELECT * FROM features ${isPublic ? 'WHERE is_public = true' : ''}
       ORDER BY total_arr DESC`,
      []
    );

    const byStatus: Record<string, Feature[]> = {
      discovered: [],
      planned: [],
      in_progress: [],
      shipped: [],
      declined: []
    };

    for (const feature of allFeatures) {
      if (byStatus[feature.status]) {
        byStatus[feature.status].push(feature);
      }
    }

    return {
      features,
      total: parseInt(countResult[0]?.count || '0'),
      byStatus
    };
  }

  return {
    features,
    total: parseInt(countResult[0]?.count || '0')
  };
}

/**
 * Push feature to Jira
 */
export async function pushToJira(
  featureId: string, 
  projectKey?: string
): Promise<{ issueKey: string; issueUrl: string }> {
  const feature = await query<Feature>(
    'SELECT * FROM features WHERE id = $1',
    [featureId]
  );

  if (!feature[0]) {
    throw new Error('Feature not found');
  }

  const f = feature[0];
  const quotes = await getFeatureCustomerQuotes(featureId, 5);
  const propelLink = `${FRONTEND_URL}/features/${featureId}`;

  // Build description with customer quotes
  let description = `*Problem Summary:*\n${f.problem_summary || 'No summary available'}\n\n`;
  description += `*Revenue at Risk:* $${f.total_arr?.toLocaleString() || 0}\n`;
  description += `*Feedback Count:* ${f.feedback_count || 0}\n\n`;
  
  if (quotes.length > 0) {
    description += `*Customer Quotes:*\n`;
    for (const quote of quotes) {
      const customerInfo = quote.customer_name 
        ? `${quote.customer_name} ($${quote.customer_arr?.toLocaleString() || 0} ARR)` 
        : 'Anonymous';
      description += `{quote}${quote.content.substring(0, 500)}${quote.content.length > 500 ? '...' : ''}\n— ${customerInfo}{quote}\n\n`;
    }
  }

  description += `\n----\n[View in Propel|${propelLink}]`;

  // Create Jira issue
  const response = await jiraClient.post('/rest/api/3/issue', {
    fields: {
      project: { key: projectKey || JIRA_PROJECT_KEY },
      summary: f.title,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }
        ]
      },
      issuetype: { name: 'Story' },
      labels: f.tags || []
    }
  });

  const issueKey = response.data.key;
  const issueUrl = `${JIRA_BASE_URL}/browse/${issueKey}`;

  // Update feature with Jira link
  await query(
    `UPDATE features 
     SET jira_issue_key = $1, jira_issue_url = $2, status = 'planned'
     WHERE id = $3`,
    [issueKey, issueUrl, featureId]
  );

  return { issueKey, issueUrl };
}

/**
 * Sync feature status from Jira
 */
export async function syncFromJira(featureId: string): Promise<Feature | null> {
  const feature = await query<Feature>(
    'SELECT * FROM features WHERE id = $1',
    [featureId]
  );

  if (!feature[0] || !feature[0].jira_issue_key) {
    throw new Error('Feature not found or not linked to Jira');
  }

  const issueKey = feature[0].jira_issue_key;

  // Fetch Jira issue
  const response = await jiraClient.get(`/rest/api/3/issue/${issueKey}`);
  const jiraStatus = response.data.fields.status.name.toLowerCase();

  // Map Jira status to Propel status
  let propelStatus: Feature['status'] = 'planned';
  
  if (jiraStatus.includes('done') || jiraStatus.includes('complete') || jiraStatus.includes('closed')) {
    propelStatus = 'shipped';
  } else if (jiraStatus.includes('progress') || jiraStatus.includes('dev') || jiraStatus.includes('review')) {
    propelStatus = 'in_progress';
  } else if (jiraStatus.includes('backlog') || jiraStatus.includes('todo')) {
    propelStatus = 'planned';
  }

  // Update feature
  const updated = await query<Feature>(
    'UPDATE features SET status = $1 WHERE id = $2 RETURNING *',
    [propelStatus, featureId]
  );

  return updated[0] || null;
}

/**
 * Update feature status
 */
export async function updateFeatureStatus(
  featureId: string, 
  status: Feature['status']
): Promise<Feature | null> {
  const result = await query<Feature>(
    'UPDATE features SET status = $1 WHERE id = $2 RETURNING *',
    [status, featureId]
  );

  const feature = result[0];

  // If shipped, trigger notification generation
  if (feature && status === 'shipped') {
    setImmediate(async () => {
      try {
        const { generateNotificationsForFeature } = await import('../broadcaster/service.js');
        await generateNotificationsForFeature(featureId);
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    });
  }

  return feature || null;
}

/**
 * Get customer quotes for a feature
 */
export async function getFeatureCustomerQuotes(
  featureId: string, 
  limit: number = 5
): Promise<Array<{
  content: string;
  customer_name?: string;
  customer_arr?: number;
  created_at: Date;
}>> {
  return await query(
    `SELECT f.content, c.name as customer_name, c.arr as customer_arr, f.created_at
     FROM feedback f
     JOIN feedback_features ff ON f.id = ff.feedback_id
     LEFT JOIN customers c ON f.customer_id = c.id
     WHERE ff.feature_id = $1
     ORDER BY c.arr DESC NULLS LAST, f.created_at DESC
     LIMIT $2`,
    [featureId, limit]
  );
}

/**
 * Get roadmap statistics
 */
export async function getRoadmapStats(): Promise<{
  totalFeatures: number;
  totalARR: number;
  byStatus: Record<string, { count: number; arr: number }>;
  topTags: Array<{ tag: string; count: number }>;
}> {
  const [totals, byStatus, topTags] = await Promise.all([
    query<{ count: string; total_arr: string }>(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_arr), 0) as total_arr FROM features'
    ),
    query<{ status: string; count: string; arr: string }>(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(total_arr), 0) as arr 
       FROM features GROUP BY status`
    ),
    query<{ tag: string; count: string }>(
      `SELECT unnest(tags) as tag, COUNT(*) as count 
       FROM features 
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT 10`
    )
  ]);

  const statusMap: Record<string, { count: number; arr: number }> = {};
  for (const row of byStatus) {
    statusMap[row.status] = {
      count: parseInt(row.count),
      arr: parseFloat(row.arr)
    };
  }

  return {
    totalFeatures: parseInt(totals[0]?.count || '0'),
    totalARR: parseFloat(totals[0]?.total_arr || '0'),
    byStatus: statusMap,
    topTags: topTags.map(t => ({ tag: t.tag, count: parseInt(t.count) }))
  };
}

