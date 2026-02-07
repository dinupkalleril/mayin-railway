import express from 'express';
import { pool } from '../config/db.js';
import { generateActionPlan } from '../services/actionPlanGenerator.js';

const router = express.Router();

// Generate a new action plan based on all available analysis data
router.post('/generate', async (req, res, next) => {
  try {
    const { userId, brandName } = req.body;

    if (!userId || !brandName) {
      return res.status(400).json({
        error: 'User ID and brand name are required'
      });
    }

    // Check if user has any completed scans
    const hasData = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM visibility_scans WHERE user_id = $1 AND status = 'completed') as visibility_count,
        (SELECT COUNT(*) FROM website_scans WHERE user_id = $1 AND status = 'completed') as website_count,
        (SELECT COUNT(*) FROM sentiment_analyses WHERE user_id = $1 AND status = 'completed') as sentiment_count`,
      [userId]
    );

    const counts = hasData.rows[0];
    const totalScans = parseInt(counts.visibility_count) + parseInt(counts.website_count) + parseInt(counts.sentiment_count);

    if (totalScans === 0) {
      return res.status(400).json({
        error: 'No analysis data available. Please run at least one visibility scan, website scan, or sentiment analysis first.',
        suggestion: 'Start with a visibility scan to see how often your brand is mentioned by AI models.'
      });
    }

    // Generate the action plan
    const actionPlan = await generateActionPlan(userId, brandName);

    // Save the action plan
    const result = await pool.query(
      `INSERT INTO action_plans (user_id, brand_name, plan_data, data_summary)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, brandName, JSON.stringify(actionPlan.plan), JSON.stringify(actionPlan.dataUsed)]
    );

    res.json({
      success: true,
      actionPlanId: result.rows[0].id,
      ...actionPlan
    });

  } catch (error) {
    console.error('Error generating action plan:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate action plan' });
  }
});

// Get all action plans for a user (MUST be before /:planId to avoid route conflict)
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    let query = `SELECT * FROM action_plans WHERE user_id = $1 ORDER BY created_at DESC`;
    const params = [userId];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);

    res.json({ actionPlans: result.rows });
  } catch (error) {
    console.error('Error fetching action plans:', error);
    return res.status(500).json({ error: 'Failed to fetch action plans' });
  }
});

// Get summary of all analysis data for dashboard (MUST be before /:planId to avoid route conflict)
router.get('/summary/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get counts and latest scores
    const summary = await pool.query(
      `SELECT
        (SELECT json_agg(json_build_object(
          'aiModel', ai_model,
          'score', score,
          'mentionedCount', mentioned_count,
          'promptCount', prompt_count,
          'createdAt', created_at
        )) FROM (
          SELECT DISTINCT ON (ai_model) ai_model, score, mentioned_count, prompt_count, created_at
          FROM visibility_scans
          WHERE user_id = $1 AND status = 'completed'
          ORDER BY ai_model, created_at DESC
        ) v) as visibility_scans,

        (SELECT json_build_object(
          'url', website_scans.website_url,
          'score', website_scans.score,
          'isAIFriendly', website_scans.is_ai_friendly,
          'createdAt', website_scans.created_at
        ) FROM website_scans
        WHERE user_id = $1 AND status = 'completed'
        ORDER BY created_at DESC LIMIT 1) as website_scan,

        (SELECT json_build_object(
          'brandName', brand_name,
          'sentiment', overall_sentiment,
          'webPresenceScore', web_presence_score,
          'createdAt', created_at
        ) FROM sentiment_analyses
        WHERE user_id = $1 AND status = 'completed'
        ORDER BY created_at DESC LIMIT 1) as sentiment_analysis,

        (SELECT json_build_object(
          'id', id,
          'brandName', brand_name,
          'createdAt', created_at
        ) FROM action_plans
        WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 1) as latest_action_plan`,
      [userId]
    );

    const data = summary.rows[0];

    // Calculate overall AI visibility score
    let overallScore = 0;
    let scoreCount = 0;

    if (data.visibility_scans) {
      const avgVisibility = data.visibility_scans.reduce((acc, s) => acc + (s.score || 0), 0) / data.visibility_scans.length;
      overallScore += avgVisibility;
      scoreCount++;
    }

    if (data.website_scan?.score) {
      overallScore += data.website_scan.score;
      scoreCount++;
    }

    if (data.sentiment_analysis?.webPresenceScore) {
      overallScore += data.sentiment_analysis.webPresenceScore;
      scoreCount++;
    }

    const aiVisibilityScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : null;

    res.json({
      success: true,
      aiVisibilityScore,
      visibilityScans: data.visibility_scans || [],
      websiteScan: data.website_scan || null,
      sentimentAnalysis: data.sentiment_analysis || null,
      latestActionPlan: data.latest_action_plan || null,
      recommendations: {
        hasVisibilityData: !!data.visibility_scans,
        hasWebsiteData: !!data.website_scan,
        hasSentimentData: !!data.sentiment_analysis,
        suggestedNextStep: getSuggestedNextStep(data)
      }
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    return res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

function getSuggestedNextStep(data) {
  if (!data.visibility_scans || data.visibility_scans.length === 0) {
    return {
      action: 'Run Visibility Scan',
      description: 'Start by checking how often your brand is mentioned by AI models',
      path: '/dashboard/visibility'
    };
  }

  if (!data.website_scan) {
    return {
      action: 'Run Website Scan',
      description: 'Analyze your website for AI optimization opportunities',
      path: '/dashboard/website-scan'
    };
  }

  if (!data.sentiment_analysis) {
    return {
      action: 'Run Sentiment Analysis',
      description: 'Understand your online reputation and get improvement strategies',
      path: '/dashboard/sentiment'
    };
  }

  return {
    action: 'Generate Action Plan',
    description: 'Get a comprehensive plan to improve your AI visibility',
    path: '/dashboard/action-plan'
  };
}

// Get a specific action plan by ID (MUST be after /user and /summary routes)
router.get('/:planId', async (req, res, next) => {
  try {
    const { planId } = req.params;

    const result = await pool.query(
      `SELECT * FROM action_plans WHERE id = $1`,
      [planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Action plan not found' });
    }

    res.json({ actionPlan: result.rows[0] });
  } catch (error) {
    console.error('Error fetching action plan:', error);
    return res.status(500).json({ error: 'Failed to fetch action plan' });
  }
});

// Delete an action plan
router.delete('/:planId', async (req, res, next) => {
  try {
    const { planId } = req.params;

    const result = await pool.query(
      `DELETE FROM action_plans WHERE id = $1 RETURNING id`,
      [planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Action plan not found' });
    }

    res.json({ success: true, message: 'Action plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting action plan:', error);
    return res.status(500).json({ error: 'Failed to delete action plan' });
  }
});

export default router;
