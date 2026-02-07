import express from 'express';
import { pool } from '../config/db.js';
import { runSentimentAnalysis } from '../services/sentimentAnalyzer.js';

const router = express.Router();

// Start a new sentiment analysis
router.post('/analyze', async (req, res, next) => {
  try {
    const { userId, brandName, location } = req.body;

    if (!userId || !brandName) {
      return res.status(400).json({
        error: 'User ID and brand name are required'
      });
    }


    // Create analysis record
    const result = await pool.query(
      `INSERT INTO sentiment_analyses (user_id, brand_name, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, brandName, 'pending']
    );

    const analysis = result.rows[0];

    // Start analysis in background
    runSentimentAnalysis(analysis.id, userId, brandName, location)
  .catch(err => {
    console.error('Background sentiment analysis error:', err);
  });


    res.json({
      success: true,
      analysisId: analysis.id,
      status: 'pending',
      message: 'Sentiment analysis started'
    });
  } catch (error) {
    console.error('Error creating sentiment analysis:', error);
    return res.status(400).json({ error: 'Failed to create analysis' });
  }
});

// Get analysis results
router.get('/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;

    const result = await pool.query(
      `SELECT * FROM sentiment_analyses WHERE id = $1`,
      [analysisId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis: result.rows[0] });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return res.status(404).json({ error: 'Analysis not found' });
  }
});

// Get all analyses for a user
router.get('/analyses/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;


    let query = `SELECT * FROM sentiment_analyses
                 WHERE user_id = $1
                 ORDER BY created_at DESC`;
    const params = [userId];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);

    res.json({ analyses: result.rows });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return res.status(400).json({ error: 'Failed to fetch analyses' });
  }
});

// Delete an analysis
router.delete('/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;

    const result = await pool.query(
      `DELETE FROM sentiment_analyses WHERE id = $1 RETURNING id`,
      [analysisId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ success: true, message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return res.status(400).json({ error: 'Failed to delete analysis' });
  }
});

export default router;
