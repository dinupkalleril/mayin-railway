import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = new Client(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }, // Railway requires SSL
        }
      : {
          host: process.env.POSTGRES_HOST || 'postgres',
          port: Number(process.env.POSTGRES_PORT) || 5432,
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          ssl: false,
        }
  );

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    /* ---------- extensions ---------- */
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    /* ---------- base tables ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        license_key TEXT UNIQUE NOT NULL,
        is_activated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        license_key TEXT REFERENCES licenses(license_key),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,

        chatgpt_key TEXT,
        claude_key TEXT,
        gemini_key TEXT,
        perplexity_key TEXT,
        grok_key TEXT,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),

        UNIQUE(user_id)
      );
    `);

    /* ---------- api_keys schema evolution ---------- */

    await client.query(`
      ALTER TABLE api_keys
      ADD COLUMN IF NOT EXISTS chatgpt_key TEXT,
      ADD COLUMN IF NOT EXISTS claude_key TEXT,
      ADD COLUMN IF NOT EXISTS gemini_key TEXT,
      ADD COLUMN IF NOT EXISTS perplexity_key TEXT,
      ADD COLUMN IF NOT EXISTS grok_key TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      ALTER TABLE api_keys
      DROP CONSTRAINT IF EXISTS api_keys_user_id_provider_key;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_user_id_unique'
        ) THEN
          ALTER TABLE api_keys
          ADD CONSTRAINT api_keys_user_id_unique UNIQUE (user_id);
        END IF;
      END$$;
    `);

    /* ---------- license schema evolution ---------- */

    await client.query(`
      ALTER TABLE licenses
      ADD COLUMN IF NOT EXISTS machine_id TEXT,
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS product_tier VARCHAR(50),
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS max_activations INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS activation_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS assigned_to TEXT,
      ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='licenses'
            AND column_name='license_key'
            AND data_type <> 'text'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='users_license_key_fkey'
          ) THEN
            ALTER TABLE users DROP CONSTRAINT users_license_key_fkey;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='license_audit_log_license_key_fkey'
          ) THEN
            ALTER TABLE license_audit_log DROP CONSTRAINT license_audit_log_license_key_fkey;
          END IF;

          ALTER TABLE licenses ALTER COLUMN license_key TYPE TEXT;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='licenses'
              AND column_name='assigned_to'
              AND data_type <> 'text'
          ) THEN
            ALTER TABLE licenses ALTER COLUMN assigned_to TYPE TEXT;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='users'
              AND column_name='license_key'
          ) THEN
            ALTER TABLE users ALTER COLUMN license_key TYPE TEXT;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='license_audit_log'
              AND column_name='license_key'
          ) THEN
            ALTER TABLE license_audit_log ALTER COLUMN license_key TYPE TEXT;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='users'
              AND column_name='license_key'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT users_license_key_fkey
            FOREIGN KEY (license_key) REFERENCES licenses(license_key);
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='license_audit_log'
              AND column_name='license_key'
          ) THEN
            ALTER TABLE license_audit_log
            ADD CONSTRAINT license_audit_log_license_key_fkey
            FOREIGN KEY (license_key) REFERENCES licenses(license_key);
          END IF;
        END IF;
      END$$;
    `);

    /* ---------- brands ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,

        brand_name VARCHAR(255) NOT NULL,
        tagline TEXT,
        product_details TEXT,
        website_url TEXT,
        location VARCHAR(255),

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS tagline TEXT,
      ADD COLUMN IF NOT EXISTS product_details TEXT,
      ADD COLUMN IF NOT EXISTS website_url TEXT,
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    /* ---------- visibility_scans ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS visibility_scans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,

        brand_name VARCHAR(255),
        brand_info JSONB,

        ai_model VARCHAR(100),
        model_version VARCHAR(100),
        model_alias VARCHAR(100),

        prompt_count INTEGER,
        status VARCHAR(50) DEFAULT 'completed',

        scan_result JSONB,

        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE visibility_scans
      ADD COLUMN IF NOT EXISTS brand_info JSONB,
      ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100),
      ADD COLUMN IF NOT EXISTS model_version VARCHAR(100),
      ADD COLUMN IF NOT EXISTS model_alias VARCHAR(100),
      ADD COLUMN IF NOT EXISTS prompt_count INTEGER,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
    `);

    /* ---------- action_plans ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS action_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        brand_name VARCHAR(255) NOT NULL,
        plan_data JSONB NOT NULL,
        data_summary JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_action_plans_user_id
      ON action_plans(user_id);
    `);

    /* ---------- user_models ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_models (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        provider VARCHAR(50) NOT NULL,
        model_id VARCHAR(100) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, provider, model_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_models_user_provider
      ON user_models(user_id, provider);
    `);

    /* ---------- website_scans ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS website_scans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        url TEXT NOT NULL,
        scan_result JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE website_scans
      ADD COLUMN IF NOT EXISTS ai_visibility_factors JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS priority_actions JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS content_gaps JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS competitive_insights TEXT,
      ADD COLUMN IF NOT EXISTS recommended_content TEXT;
    `);

    /* ---------- sentiment_analyses ---------- */

    await client.query(`
      CREATE TABLE IF NOT EXISTS sentiment_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        brand_name VARCHAR(255),
        sentiment_result JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE sentiment_analyses
      ADD COLUMN IF NOT EXISTS ai_visibility_strategies JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS citation_opportunities JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS content_topics JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS industry_publications JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS key_messages JSONB DEFAULT '[]'::jsonb;
    `);

    /* ---------- indexes ---------- */

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);
    `);

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// 🔐 IMPORTANT: Do NOT auto-run migrations on Railway
if (process.env.RUN_MIGRATIONS === 'true') {
  runMigration().catch((err) => {
    console.error('[Migration] Failed:', err.message);
  });
} else {
  console.log('ℹ️ RUN_MIGRATIONS not set — skipping DB migrations');
}
