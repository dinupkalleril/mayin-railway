import express from 'express';
import { pool } from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes for AES-256
function getKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encrypt(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Save or update API keys
router.post('/', async (req, res, next) => {
  try {
    const { userId, apiKeys } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Encrypt all API keys before storing
    const chatgptKey = apiKeys.chatgpt ? encrypt(apiKeys.chatgpt) : null;
    const claudeKey = apiKeys.claude ? encrypt(apiKeys.claude) : null;
    const geminiKey = apiKeys.gemini ? encrypt(apiKeys.gemini) : null;
    const perplexityKey = apiKeys.perplexity ? encrypt(apiKeys.perplexity) : null;
    const grokKey = apiKeys.grok ? encrypt(apiKeys.grok) : null;

    // Upsert (update if exists, insert if not)
    // Use COALESCE to preserve existing keys when new value is null
    await pool.query(
      `INSERT INTO api_keys (user_id, chatgpt_key, claude_key, gemini_key, perplexity_key, grok_key, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         chatgpt_key = COALESCE(EXCLUDED.chatgpt_key, api_keys.chatgpt_key),
         claude_key = COALESCE(EXCLUDED.claude_key, api_keys.claude_key),
         gemini_key = COALESCE(EXCLUDED.gemini_key, api_keys.gemini_key),
         perplexity_key = COALESCE(EXCLUDED.perplexity_key, api_keys.perplexity_key),
         grok_key = COALESCE(EXCLUDED.grok_key, api_keys.grok_key),
         updated_at = NOW()`,
      [userId, chatgptKey, claudeKey, geminiKey, perplexityKey, grokKey]
    );

    res.json({ success: true, message: 'API keys saved successfully' });
  } catch (error) {
    next(error);
  }
});

// Get API keys for a user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ apiKeys: {} });
    }

    const data = result.rows[0];

    // Decrypt keys (but only return masked versions for security)
    const maskedKeys = {
      chatgpt: data.chatgpt_key ? '••••' + decrypt(data.chatgpt_key)?.slice(-4) : null,
      claude: data.claude_key ? '••••' + decrypt(data.claude_key)?.slice(-4) : null,
      gemini: data.gemini_key ? '••••' + decrypt(data.gemini_key)?.slice(-4) : null,
      perplexity: data.perplexity_key ? '••••' + decrypt(data.perplexity_key)?.slice(-4) : null,
      grok: data.grok_key ? '••••' + decrypt(data.grok_key)?.slice(-4) : null,
    };

    res.json({
      apiKeys: maskedKeys,
      hasKeys: {
        chatgpt: !!data.chatgpt_key,
        claude: !!data.claude_key,
        gemini: !!data.gemini_key,
        perplexity: !!data.perplexity_key,
        grok: !!data.grok_key,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get decrypted API keys (internal use only - for running scans)
router.get('/:userId/decrypted', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { internalKey } = req.headers;

    // Simple internal authorization
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to fetch API keys' });
    }

    const data = result.rows[0];

    // Decrypt all keys
    const decryptedKeys = {
      chatgpt: data.chatgpt_key ? decrypt(data.chatgpt_key) : null,
      claude: data.claude_key ? decrypt(data.claude_key) : null,
      gemini: data.gemini_key ? decrypt(data.gemini_key) : null,
      perplexity: data.perplexity_key ? decrypt(data.perplexity_key) : null,
      grok: data.grok_key ? decrypt(data.grok_key) : null,
    };

    res.json({ apiKeys: decryptedKeys });
  } catch (error) {
    next(error);
  }
});

// Delete API keys
router.delete('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    await pool.query(
      'DELETE FROM api_keys WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, message: 'API keys deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
