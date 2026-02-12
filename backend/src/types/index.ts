// ============================================
// Shared Types for Propel Backend
// ============================================

export interface NormalizedFeedback {
  source: 'slack' | 'zoom' | 'freshdesk' | 'manual';
  external_id: string;
  content: string;
  author_email?: string;
  author_name?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  slack_user_id?: string;
  stripe_id?: string;
  arr: number;
  plan_name?: string;
  company_name?: string;
  last_synced_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Feedback {
  id: string;
  source: string;
  external_id?: string;
  content: string;
  author_email?: string;
  author_name?: string;
  customer_id?: string;
  weight: number;
  metadata: Record<string, any>;
  processed: boolean;
  created_at: Date;
}

export interface Feature {
  id: string;
  title: string;
  description?: string;
  problem_summary?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency_score: number;
  tags: string[];
  status: 'discovered' | 'planned' | 'in_progress' | 'shipped' | 'declined';
  priority: number;
  total_weight: number;
  total_arr: number;
  feedback_count: number;
  jira_issue_key?: string;
  jira_issue_url?: string;
  embedding?: number[];
  is_public: boolean;
  public_votes: number;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  feature_id: string;
  customer_id: string;
  channel: 'email' | 'slack';
  recipient: string;
  subject?: string;
  body: string;
  status: 'pending' | 'approved' | 'sent' | 'failed';
  approved_by?: string;
  approved_at?: Date;
  sent_at?: Date;
  error_message?: string;
  created_at: Date;
}

export interface PublicVote {
  id: string;
  feature_id: string;
  email: string;
  is_critical: boolean;
  wants_updates: boolean;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  role: 'admin' | 'pm';
  created_at: Date;
  updated_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Slack webhook types
export interface SlackEvent {
  type: string;
  event: {
    type: string;
    user: string;
    text?: string;
    channel: string;
    ts: string;
    reaction?: string;
    item?: {
      type: string;
      channel: string;
      ts: string;
    };
  };
  challenge?: string;
}

// Zoom webhook types
export interface ZoomEvent {
  event: string;
  payload: {
    account_id: string;
    object: {
      uuid: string;
      host_id: string;
      topic: string;
      recording_files?: Array<{
        file_type: string;
        download_url: string;
      }>;
    };
  };
}

// Jira types
export interface JiraIssue {
  key: string;
  self: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
  };
}

export interface JiraWebhook {
  webhookEvent: string;
  issue: JiraIssue;
  changelog?: {
    items: Array<{
      field: string;
      fromString: string;
      toString: string;
    }>;
  };
}

