import express from 'express';
import { pool } from '../config/db.js';
import { runWebsiteScan } from '../services/websiteAnalyzer.js';

const router = express.Router();

// Start a new website scan
router.post('/scan', async (req, res, next) => {
  try {
    const { userId, websiteUrl } = req.body;

    if (!userId || !websiteUrl) {
      return res.status(400).json({
        error: 'User ID and website URL are required'
      });
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Create scan record
    const result = await pool.query(
      `INSERT INTO website_scans (user_id, url, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, websiteUrl, 'pending']
    );
    
    const scan = result.rows[0];

    // Start scan in background
    runWebsiteScan(scan.id, userId, websiteUrl)
      .catch(err => {
        console.error('Background website scan error:', err);
      });

    res.json({
      success: true,
      scanId: scan.id,
      status: 'pending',
      message: 'Website scan started'
    });
  } catch (error) {
    console.error('Error creating website scan:', error);
    return res.status(400).json({ error: 'Failed to create scan' });
  }
});

// Get scan results
router.get('/scan/:scanId', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    const result = await pool.query(
      `SELECT * FROM website_scans WHERE id = $1`,
      [scanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ scan: result.rows[0] });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return res.status(404).json({ error: 'Scan not found' });
  }
});

// Get all website scans for a user
router.get('/scans/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    let query = `SELECT * FROM website_scans
                 WHERE user_id = $1
                 ORDER BY created_at DESC`;
    const params = [userId];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);

    res.json({ scans: result.rows });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return res.status(400).json({ error: 'Failed to fetch scans' });
  }
});

// Delete a scan
router.delete('/scan/:scanId', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    const result = await pool.query(
      `DELETE FROM website_scans WHERE id = $1 RETURNING id`,
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
