-- MIGRATION: Add status to sentiment_analyses
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
