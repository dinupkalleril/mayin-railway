import express from 'express';
import { pool } from '../config/db.js';
import { modelConfigService } from '../services/modelConfig.js';

const router = express.Router();

/**
 * Get default models dynamically from the model config service.
 * This ensures model defaults come from config, not hardcoded values.
 */
function getDefaultModels() {
  const providers = modelConfigService.getAllProvidersWithAliases();
  const result = {};

  Object.entries(providers).forEach(([providerKey, provider]) => {
    result[providerKey] = provider.aliases.map((alias) => ({
      modelId: alias.id,           // Alias ID like "chatgpt.fast"
      displayName: alias.name,     // Display name like "OpenAI Fast"
      description: alias.description
    }));
  });

  return result;
}

// Get all models for a user (grouped by provider)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM user_models
       WHERE user_id = $1
       ORDER BY provider, sort_order, created_at`,
      [userId]
    );

    // Group models by provider
    const models = {
      chatgpt: [],
      claude: [],
      gemini: [],
      perplexity: [],
      grok: []
    };

    result.rows.forEach(row => {
      if (models[row.provider]) {
        models[row.provider].push({
          id: row.id,
          modelId: row.model_id,
          displayName: row.display_name,
          description: row.description,
          isDefault: row.is_default,
          sortOrder: row.sort_order
        });
      }
    });

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error fetching user models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Seed default models for a user
router.post('/user/:userId/seed', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user already has models
    const existing = await pool.query(
      'SELECT COUNT(*) FROM user_models WHERE user_id = $1',
      [userId]
    );

    if (parseInt(existing.rows[0].count) > 0) {
      return res.json({ success: true, message: 'Models already seeded', seeded: false });
    }

    // Insert default models from config (dynamic, not hardcoded)
    const defaultModels = getDefaultModels();
    const providers = Object.keys(defaultModels);

    for (const provider of providers) {
      const models = defaultModels[provider];
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        await pool.query(
          `INSERT INTO user_models (user_id, provider, model_id, display_name, description, is_default, sort_order)
           VALUES ($1, $2, $3, $4, $5, true, $6)`,
          [userId, provider, model.modelId, model.displayName, model.description || '', i]
        );
      }
    }

    res.json({ success: true, message: 'Default models seeded', seeded: true });
  } catch (error) {
    console.error('Error seeding models:', error);
    res.status(500).json({ error: 'Failed to seed models' });
  }
});

// Add a new model
router.post('/', async (req, res) => {
  try {
    const { userId, provider, modelId, displayName, description } = req.body;

    if (!userId || !provider || !modelId || !displayName) {
      return res.status(400).json({
        error: 'userId, provider, modelId, and displayName are required'
      });
    }

    // Validate provider
    const validProviders = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be one of: ' + validProviders.join(', ')
      });
    }

    // Get the max sort_order for this user/provider
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM user_models WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    const result = await pool.query(
      `INSERT INTO user_models (user_id, provider, model_id, display_name, description, is_default, sort_order)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING *`,
      [userId, provider, modelId, displayName, description || '', maxOrder.rows[0].max_order + 1]
    );

    const row = result.rows[0];
    res.json({
      success: true,
      model: {
        id: row.id,
        modelId: row.model_id,
        displayName: row.display_name,
        description: row.description,
        isDefault: row.is_default,
        sortOrder: row.sort_order
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'A model with this ID already exists for this provider' });
    }
    console.error('Error adding model:', error);
    res.status(500).json({ error: 'Failed to add model' });
  }
});

// Update a model
router.put('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { newModelId, displayName, description } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: 'displayName is required' });
    }

    // Build update query dynamically
    let query = 'UPDATE user_models SET display_name = $1, description = $2, updated_at = NOW()';
    let params = [displayName, description || ''];
    let paramIndex = 3;

    if (newModelId) {
      query += `, model_id = $${paramIndex}`;
      params.push(newModelId);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(modelId);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      model: {
        id: row.id,
        modelId: row.model_id,
        displayName: row.display_name,
        description: row.description,
        isDefault: row.is_default,
        sortOrder: row.sort_order
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'A model with this ID already exists for this provider' });
    }
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// Delete a model
router.delete('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_models WHERE id = $1 RETURNING *',
      [modelId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({ success: true, message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

export default router;
