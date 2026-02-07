-- AI Optimization Tool - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Licenses table
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(255) UNIQUE NOT NULL,
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Users table (internal authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  license_key VARCHAR(255) REFERENCES licenses(license_key),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table (encrypted storage)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chatgpt_key TEXT,
  claude_key TEXT,
  gemini_key TEXT,
  perplexity_key TEXT,
  grok_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  tagline TEXT,
  product_details TEXT NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visibility Scans table
CREATE TABLE visibility_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL, -- chatgpt, claude, gemini, perplexity, grok
  model_version VARCHAR(100), -- specific model version (e.g., gpt-4o, claude-sonnet-4-20250514)
  brand_name VARCHAR(255) NOT NULL,
  brand_info JSONB NOT NULL,
  prompt_count INTEGER NOT NULL DEFAULT 100,
  score INTEGER,
  mentioned_count INTEGER,
  competitors JSONB DEFAULT '[]'::jsonb,
  prompts_and_answers JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Website Scans table
CREATE TABLE website_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  website_url VARCHAR(500) NOT NULL,
  is_ai_friendly BOOLEAN,
  score INTEGER,
  issues JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  recommended_content TEXT,
  ai_visibility_factors JSONB DEFAULT '{}'::jsonb, -- Detailed factor scores
  priority_actions JSONB DEFAULT '[]'::jsonb, -- Prioritized action items
  content_gaps JSONB DEFAULT '[]'::jsonb, -- Missing content for AI visibility
  competitive_insights TEXT, -- Competitive analysis
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Sentiment Analysis table
CREATE TABLE sentiment_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  overall_sentiment VARCHAR(50), -- positive, neutral, negative
  positive_aspects JSONB DEFAULT '[]'::jsonb,
  negative_aspects JSONB DEFAULT '[]'::jsonb,
  competitor_comparison JSONB DEFAULT '[]'::jsonb,
  improvement_strategies JSONB DEFAULT '[]'::jsonb,
  web_presence_score INTEGER,
  ai_visibility_strategies JSONB DEFAULT '{}'::jsonb, -- Categorized AI visibility strategies
  citation_opportunities JSONB DEFAULT '[]'::jsonb, -- Where to get cited
  content_topics JSONB DEFAULT '[]'::jsonb, -- Content to create for AI visibility
  industry_publications JSONB DEFAULT '[]'::jsonb, -- Publications to target
  key_messages JSONB DEFAULT '[]'::jsonb, -- Messages to amplify
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Action Plans table (combined insights and recommendations)
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  plan_data JSONB NOT NULL, -- The comprehensive action plan
  data_summary JSONB DEFAULT '{}'::jsonb, -- Summary of data used to generate plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_license_key ON users(license_key);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_brands_user_id ON brands(user_id);
CREATE INDEX idx_visibility_scans_user_id ON visibility_scans(user_id);
CREATE INDEX idx_visibility_scans_ai_model ON visibility_scans(ai_model);
CREATE INDEX idx_visibility_scans_model_version ON visibility_scans(model_version);
CREATE INDEX idx_visibility_scans_status ON visibility_scans(status);
CREATE INDEX idx_website_scans_user_id ON website_scans(user_id);
CREATE INDEX idx_sentiment_analyses_user_id ON sentiment_analyses(user_id);
CREATE INDEX idx_action_plans_user_id ON action_plans(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;

-- Note: For self-hosted version, RLS policies should be minimal
-- as authentication is handled at application level
-- You can add specific policies based on your security requirements

-- MIGRATION: Add model_version column to existing visibility_scans table
-- Run this if your database was created before model version support was added:
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS model_version VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_visibility_scans_model_version ON visibility_scans(model_version);

-- MIGRATION: Add new columns to website_scans for enhanced AI visibility analysis
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS ai_visibility_factors JSONB DEFAULT '{}'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS priority_actions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS content_gaps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS competitive_insights TEXT;

-- MIGRATION: Add new columns to sentiment_analyses for AI visibility strategies
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS ai_visibility_strategies JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS citation_opportunities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS content_topics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS industry_publications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS key_messages JSONB DEFAULT '[]'::jsonb;

-- MIGRATION: Add action_plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  plan_data JSONB NOT NULL,
  data_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON action_plans(user_id);
