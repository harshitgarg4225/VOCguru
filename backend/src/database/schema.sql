-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS TABLE (Module 2: The Identifier)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  slack_user_id VARCHAR(50),
  stripe_id VARCHAR(50),
  arr DECIMAL(12, 2) DEFAULT 0,
  plan_name VARCHAR(100),
  company_name VARCHAR(255),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_slack_id ON customers(slack_user_id);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_id);

-- ============================================
-- RAW FEEDBACK TABLE (Module 1: The Collector)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(50) NOT NULL, -- 'slack', 'zoom', 'freshdesk', 'manual'
  external_id VARCHAR(255), -- Message ID, Ticket ID, etc.
  content TEXT NOT NULL,
  author_email VARCHAR(255),
  author_name VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  weight DECIMAL(8, 2) DEFAULT 1, -- Calculated from ARR
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_customer ON feedback(customer_id);
CREATE INDEX idx_feedback_processed ON feedback(processed);

-- ============================================
-- FEATURES TABLE (Module 3: The Synthesizer)
-- ============================================
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  problem_summary TEXT,
  sentiment VARCHAR(20) DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
  urgency_score INTEGER DEFAULT 5,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'discovered', -- 'discovered', 'planned', 'in_progress', 'shipped', 'declined'
  priority INTEGER DEFAULT 0,
  total_weight DECIMAL(12, 2) DEFAULT 0, -- Sum of linked feedback weights
  total_arr DECIMAL(12, 2) DEFAULT 0, -- Revenue at risk
  feedback_count INTEGER DEFAULT 0,
  jira_issue_key VARCHAR(50),
  jira_issue_url VARCHAR(500),
  embedding vector(384), -- For similarity search
  is_public BOOLEAN DEFAULT FALSE, -- Show in public portal
  public_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_priority ON features(priority DESC);
CREATE INDEX idx_features_total_arr ON features(total_arr DESC);
CREATE INDEX idx_features_embedding ON features USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- FEEDBACK <-> FEATURE LINKING
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, feature_id)
);

CREATE INDEX idx_ff_feedback ON feedback_features(feedback_id);
CREATE INDEX idx_ff_feature ON feedback_features(feature_id);

-- ============================================
-- NOTIFICATIONS TABLE (Module 5: The Broadcaster)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'email', 'slack'
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'sent', 'failed'
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_feature ON notifications(feature_id);

-- ============================================
-- PUBLIC VOTES TABLE (Module 6: The Portal)
-- ============================================
CREATE TABLE IF NOT EXISTS public_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,
  wants_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, email)
);

CREATE INDEX idx_votes_feature ON public_votes(feature_id);
CREATE INDEX idx_votes_email ON public_votes(email);

-- ============================================
-- USERS TABLE (Admin/PM users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'pm', -- 'admin', 'pm'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INTEGRATION TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'jira', 'slack', 'zoom'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to recalculate feature stats
CREATE OR REPLACE FUNCTION recalculate_feature_stats(p_feature_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE features SET
    feedback_count = (
      SELECT COUNT(*) FROM feedback_features WHERE feature_id = p_feature_id
    ),
    total_weight = COALESCE((
      SELECT SUM(f.weight) 
      FROM feedback f 
      JOIN feedback_features ff ON f.id = ff.feedback_id 
      WHERE ff.feature_id = p_feature_id
    ), 0),
    total_arr = COALESCE((
      SELECT SUM(c.arr) 
      FROM customers c 
      JOIN feedback f ON c.id = f.customer_id 
      JOIN feedback_features ff ON f.id = ff.feedback_id 
      WHERE ff.feature_id = p_feature_id
    ), 0)
  WHERE id = p_feature_id;
END;
$$ LANGUAGE plpgsql;

