/**
 * Run License Migration
 * Applies the enhanced license schema to the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  console.log('🔄 Running license migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations/002_enhance_licenses.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('Applying database changes...');
    await pool.query(sql);

    console.log('✅ License migration completed successfully!\n');

    // Show current license stats
    console.log('Current license statistics:');
    const statsResult = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM licenses
      GROUP BY status
      ORDER BY status
    `);

    if (statsResult.rows.length > 0) {
      console.table(statsResult.rows);
    } else {
      console.log('  No licenses in database yet.');
      console.log('  Run: npm run license:batch -- -c 25\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Check if columns already exist (migration already ran)
    if (error.message.includes('already exists')) {
      console.log('\n💡 Migration may have already been applied.');
      console.log('   This is safe to ignore if you already ran it before.\n');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
