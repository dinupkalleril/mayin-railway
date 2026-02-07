/**
 * Model Configuration API Routes
 *
 * Provides endpoints for the frontend to:
 * - Fetch available providers and their aliases
 * - Resolve aliases to model configurations
 * - Get configuration version and status
 */

import express from 'express';
import { modelConfigService } from '../services/modelConfig.js';

const router = express.Router();

/**
 * GET /api/model-config/providers
 * Returns all providers with their aliases for frontend consumption
 *
 * Response:
 * {
 *   success: true,
 *   version: "1.0.0",
 *   providers: {
 *     chatgpt: {
 *       displayName: "ChatGPT",
 *       company: "OpenAI",
 *       aliases: [
 *         { id: "chatgpt.fast", name: "OpenAI Fast", description: "...", isDefault: true },
 *         ...
 *       ]
 *     },
 *     ...
 *   }
 * }
 */
router.get('/providers', (req, res) => {
  try {
    const providers = modelConfigService.getAllProvidersWithAliases();
    res.json({
      success: true,
      version: modelConfigService.getVersion(),
      providers
    });
  } catch (error) {
    console.error('[ModelConfig API] Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model providers'
    });
  }
});

/**
 * GET /api/model-config/provider/:providerKey
 * Returns aliases for a specific provider
 */
router.get('/provider/:providerKey', (req, res) => {
  try {
    const { providerKey } = req.params;
    const aliases = modelConfigService.getProviderAliases(providerKey);

    if (aliases.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Unknown provider: ${providerKey}`
      });
    }

    res.json({
      success: true,
      provider: providerKey,
      aliases
    });
  } catch (error) {
    console.error('[ModelConfig API] Error fetching provider aliases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider aliases'
    });
  }
});

/**
 * GET /api/model-config/resolve/:alias
 * Resolves an alias to its full configuration (useful for debugging)
 *
 * Example: GET /api/model-config/resolve/chatgpt.fast
 * Response:
 * {
 *   success: true,
 *   resolved: {
 *     provider: "openai",
 *     legacyProvider: "chatgpt",
 *     alias: "fast",
 *     fullAlias: "chatgpt.fast",
 *     label: "OpenAI Fast",
 *     description: "Quick responses, cost-effective",
 *     fallbackChain: ["gpt-4o-mini", "gpt-3.5-turbo"],
 *     primaryModel: "gpt-4o-mini"
 *   }
 * }
 */
router.get('/resolve/:alias', (req, res) => {
  try {
    const { alias } = req.params;
    const resolved = modelConfigService.resolveAlias(alias);
    res.json({
      success: true,
      resolved
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/model-config/default/:providerKey
 * Returns the default alias for a provider
 */
router.get('/default/:providerKey', (req, res) => {
  try {
    const { providerKey } = req.params;
    const defaultAlias = modelConfigService.getDefaultAlias(providerKey);
    const resolved = modelConfigService.resolveAlias(defaultAlias);

    res.json({
      success: true,
      provider: providerKey,
      defaultAlias,
      resolved
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/model-config/version
 * Returns configuration version
 */
router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: modelConfigService.getVersion()
  });
});

/**
 * POST /api/model-config/reload
 * Reloads configuration from file/env (admin use)
 */
router.post('/reload', (req, res) => {
  try {
    modelConfigService.reload();
    res.json({
      success: true,
      message: 'Configuration reloaded',
      version: modelConfigService.getVersion()
    });
  } catch (error) {
    console.error('[ModelConfig API] Error reloading config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reload configuration'
    });
  }
});

export default router;
