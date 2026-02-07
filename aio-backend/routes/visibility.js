import express from 'express';
import { pool } from '../config/db.js';
import { runVisibilityScan } from '../services/visibilityScanner.js';
import { modelConfigService } from '../services/modelConfig.js';

const router = express.Router();

// Start a new visibility scan
router.post('/scan', async (req, res, next) => {
  try {
    const { userId, aiModel, modelVersion, brandInfo, promptCount } = req.body;

    if (!userId || !aiModel || !brandInfo) {
      return res.status(400).json({
        error: 'User ID, AI model, and brand info are required'
      });
    }


    // Validate AI model provider
    const validProviders = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];
    if (!validProviders.includes(aiModel)) {
      return res.status(400).json({
        error: 'Invalid AI model. Must be one of: ' + validProviders.join(', ')
      });
    }

    // Resolve model alias - modelVersion can be:
    // - Full alias like "chatgpt.fast"
    // - Legacy provider name (will use default alias)
    // - Empty (will use default alias for the provider)
    let modelAlias;
    try {
      if (modelVersion && modelVersion.includes('.')) {
        // It's already a full alias
        modelConfigService.resolveAlias(modelVersion); // Validate it exists
        modelAlias = modelVersion;
      } else {
        // Use default alias for the provider
        modelAlias = modelConfigService.getDefaultAlias(aiModel);
      }
    } catch (e) {
      return res.status(400).json({
        error: `Invalid model alias: ${modelVersion}. ${e.message}`
      });
    }

    // Validate prompt count (tighter range to avoid timeouts/limits)
    const count = promptCount || 50;
    if (count < 20 || count > 200) {
      return res.status(400).json({
        error: 'Prompt count must be between 20 and 200'
      });
    }

    // Get resolved config for logging/display purposes
    const resolvedConfig = modelConfigService.resolveAlias(modelAlias);

    // Create scan record - store both the alias (for display) and model_version can store actual model used
    let result;
    try {
      // Try with model_version column (stores the alias for now, will be updated with actual model used)
      result = await pool.query(
        `INSERT INTO visibility_scans (user_id, ai_model, model_version, brand_name, brand_info, prompt_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, aiModel, modelAlias, brandInfo.brandName, JSON.stringify(brandInfo), count, 'pending']
      );
    } catch (err) {
      if (err.code === '42703') {
        // Column doesn't exist, try without it
        console.log('model_version column not found, inserting without it');
        result = await pool.query(
          `INSERT INTO visibility_scans (user_id, ai_model, brand_name, brand_info, prompt_count, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [userId, aiModel, brandInfo.brandName, JSON.stringify(brandInfo), count, 'pending']
        );
      } else {
        throw err;
      }
    }

    const scan = result.rows[0];

    // Start scan in background (don't wait for completion)
    // Pass the alias - the scanner will resolve it to actual model IDs
    runVisibilityScan(scan.id, userId, aiModel, modelAlias, brandInfo, count)
      .catch(err => {
        console.error('Background scan error:', err);
        // Update scan with error in case of immediate failure
        pool.query(
          'UPDATE visibility_scans SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
          ['failed', err.message, new Date().toISOString(), scan.id]
        );
      });

    res.json({
      success: true,
      scanId: scan.id,
      status: 'pending',
      message: 'Scan started. Check status using GET /api/visibility/scan/:scanId'
    });
  } catch (error) {
    console.error('Error creating scan:', error);
    // Return more detailed error message for debugging
    const errorMessage = error.code === '23503'
      ? 'Invalid user ID - user does not exist'
      : error.code === '42P01'
      ? 'Database table not found - please run database setup'
      : error.message || 'Failed to create scan';
    return res.status(400).json({ error: errorMessage });
  }
});

// Get scan status and results
router.get('/scan/:scanId', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    const result = await pool.query(
      `SELECT * FROM visibility_scans WHERE id = $1`,
      [scanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Avoid intermediary caches and ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json({ scan: result.rows[0] });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return res.status(404).json({ error: 'Scan not found' });
  }
});

// Get all scans for a user
router.get('/scans/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { aiModel, modelVersion, limit } = req.query;
    let query = `SELECT * FROM visibility_scans
                 WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;

    if (aiModel) {
      query += ` AND ai_model = $${paramIndex}`;
      params.push(aiModel);
      paramIndex++;
    }

    if (modelVersion) {
      query += ` AND model_version = $${paramIndex}`;
      params.push(modelVersion);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);

    res.json({ scans: result.rows });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return res.status(400).json({ error: 'Failed to fetch scans' });
  }
});

// Get latest scan for each AI model
router.get('/latest/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const models = ['chatgpt', 'claude', 'gemini', 'perplexity'];
    const latestScans = {};

    for (const model of models) {
      const result = await pool.query(
        `SELECT * FROM visibility_scans
         WHERE user_id = $1 AND ai_model = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, model]
      );

      if (result.rows.length > 0) {
        latestScans[model] = result.rows[0];
      }
    }

    res.json({ scans: latestScans });
  } catch (error) {
    console.error('Error fetching latest scans:', error);
    return res.status(400).json({ error: 'Failed to fetch latest scans' });
  }
});

// Get visibility progress data for charts
router.get('/progress/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const numDays = Math.min(Math.max(parseInt(days) || 30, 7), 365);
    // Get aggregated daily scores
    const result = await pool.query(
      `SELECT
        DATE(created_at) as date,
        ROUND(AVG(score)::numeric, 1) as average_score,
        COUNT(*) as scan_count
      FROM visibility_scans
      WHERE user_id = $1
        AND status = 'completed'
        AND score IS NOT NULL
        AND created_at >= NOW() - INTERVAL '${numDays} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [userId]
    );

    const data = result.rows;

    // Calculate trend (compare first half to second half)
    let trend = 'stable';
    let trendPercentage = 0;

    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const firstAvg = firstHalf.reduce((sum, d) => sum + parseFloat(d.average_score), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + parseFloat(d.average_score), 0) / secondHalf.length;

      if (firstAvg > 0) {
        trendPercentage = parseFloat(((secondAvg - firstAvg) / firstAvg * 100).toFixed(1));
        trend = secondAvg > firstAvg + 1 ? 'up' : secondAvg < firstAvg - 1 ? 'down' : 'stable';
      }
    }

    // Calculate summary stats
    const totalScans = data.reduce((sum, d) => sum + parseInt(d.scan_count), 0);
    const overallAverage = data.length > 0
      ? parseFloat((data.reduce((sum, d) => sum + parseFloat(d.average_score), 0) / data.length).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: data.map(row => ({
        date: row.date,
        averageScore: parseFloat(row.average_score),
        scanCount: parseInt(row.scan_count)
      })),
      summary: {
        totalScans,
        overallAverage,
        trend,
        trendPercentage
      }
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return res.status(400).json({ error: 'Failed to fetch progress data' });
  }
});

// Cancel a stuck scan
router.put('/scan/:scanId/cancel', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    // Only cancel if currently pending or running
    const result = await pool.query(
      `UPDATE visibility_scans
       SET status = 'failed', error_message = 'Scan cancelled by user', updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'running')
       RETURNING *`,
      [scanId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Scan not found or already completed' });
    }

    res.json({ success: true, message: 'Scan cancelled', scan: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling scan:', error);
    return res.status(400).json({ error: 'Failed to cancel scan' });
  }
});

// Cleanup stuck scans (auto-fail scans stuck for more than 10 minutes)
router.post('/cleanup/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `UPDATE visibility_scans
       SET status = 'failed', error_message = 'Scan timed out', updated_at = NOW()
       WHERE user_id = $1
         AND status IN ('pending', 'running')
         AND created_at < NOW() - INTERVAL '10 minutes'
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      cleanedUp: result.rows.length,
      message: `${result.rows.length} stuck scan(s) marked as failed`
    });
  } catch (error) {
    console.error('Error cleaning up scans:', error);
    return res.status(400).json({ error: 'Failed to cleanup scans' });
  }
});

// Delete a scan
router.delete('/scan/:scanId', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    const result = await pool.query(
      `DELETE FROM visibility_scans WHERE id = $1 RETURNING id`,
      [scanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ success: true, message: 'Scan deleted successfully' });
  } catch (error) {
    console.error('Error deleting scan:', error);
    return res.status(400).json({ error: 'Failed to delete scan' });
  }
});

export default router;
