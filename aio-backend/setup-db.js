import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    const schemaPath = path.resolve(process.cwd(), 'supabase_schema.sql');
    console.log('Reading schema file:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema...');
    await client.query(schema);
    console.log('✅ Schema created successfully!');

    console.log('Inserting test license...');
    await client.query(
      `INSERT INTO licenses (license_key, is_activated, expires_at)
       VALUES ('TEST-RAILWAY-2024', false, '2025-12-31')
       ON CONFLICT (license_key) DO NOTHING`
    );
    console.log('✅ Test license inserted!');

    console.log('\n🎉 Database setup complete!');
    console.log('Test license key: TEST-RAILWAY-2024\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (process.env.RUN_DB_SETUP === 'true') {
  setupDatabase();
} else {
  console.log('ℹ️ RUN_DB_SETUP not set — skipping DB setup');
}
