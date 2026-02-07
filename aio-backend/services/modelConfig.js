/**
 * ModelConfigService - Provider-Agnostic Model Alias System
 *
 * This service manages AI model configuration through aliases, enabling:
 * - Zero-code model updates via config file or ENV variables
 * - Automatic fallback chains when models are unavailable
 * - Self-hosted flexibility for model customization
 *
 * Configuration Priority:
 * 1. MODEL_CONFIG_JSON env variable (full override)
 * 2. MODEL_ALIAS_* env variables (per-alias override)
 * 3. config/models.config.json file
 * 4. Embedded defaults
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ModelConfigService {
  constructor() {
    this.config = null;
    this.configPromise = this.loadConfig();
  }

  /**
   * Ensure config is loaded before using the service
   */
  async ensureConfigLoaded() {
    await this.configPromise;
  }

  /**
   * Load configuration with priority: ENV > config file > embedded defaults
   * Then optionally check for remote updates in background
   */
  async loadConfig() {
    // Priority 1: Full JSON from ENV
    if (process.env.MODEL_CONFIG_JSON) {
      try {
        this.config = JSON.parse(process.env.MODEL_CONFIG_JSON);
        console.log('[ModelConfig] Loaded from MODEL_CONFIG_JSON env variable');
        this.applyEnvOverrides();
        return;
      } catch (e) {
        console.error('[ModelConfig] Invalid MODEL_CONFIG_JSON:', e.message);
      }
    }

    // Priority 2: JSON config file
    const configPath = path.join(__dirname, '../config/models.config.json');
    console.log('[ModelConfig] Looking for config at:', configPath);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(content);
        console.log('[ModelConfig] Loaded from config/models.config.json');
      } catch (e) {
        console.error('[ModelConfig] Error reading config file:', e.message);
        this.config = this.getDefaultConfig();
        console.log('[ModelConfig] Using embedded defaults due to config error');
      }
    } else {
      this.config = this.getDefaultConfig();
      console.log('[ModelConfig] Config file not found at', configPath, '- using embedded defaults');
    }

    // Apply ENV overrides for specific aliases
    this.applyEnvOverrides();

    // Priority 0: Check for remote updates (non-blocking)
    // This runs in background and updates config if newer version available
    this.checkRemoteUpdates();
  }

  /**
   * Check for remote config updates in background (non-blocking)
   * This allows Docker containers to get model updates without rebuilding
   */
  async checkRemoteUpdates() {
    const remoteConfig = await this.fetchRemoteConfig();
    if (remoteConfig) {
      // Check if remote version is newer
      if (this.isNewerVersion(remoteConfig.version, this.config.version)) {
        console.log(`[ModelConfig] 🔄 Updating to remote config version ${remoteConfig.version}`);
        this.config = remoteConfig;
        this.applyEnvOverrides();
      } else {
        console.log(`[ModelConfig] Local config is up to date (${this.config.version})`);
      }
    }
  }

  /**
   * Compare version strings (simple semver comparison)
   */
  isNewerVersion(remoteVer, localVer) {
    if (!remoteVer || !localVer) return false;

    const parseVer = (v) => v.split('.').map(n => parseInt(n) || 0);
    const remote = parseVer(remoteVer);
    const local = parseVer(localVer);

    for (let i = 0; i < 3; i++) {
      if (remote[i] > local[i]) return true;
      if (remote[i] < local[i]) return false;
    }
    return false;
  }

  /**
   * Fetch remote model configuration (for Docker/self-hosted deployments)
   * This allows updating model configs without rebuilding containers
   */
  async fetchRemoteConfig() {
    // Check if remote updates are enabled
    const autoUpdate = process.env.MODEL_CONFIG_AUTO_UPDATE !== 'false'; // Default: true
    const remoteUrl = process.env.MODEL_CONFIG_UPDATE_URL;

    if (!autoUpdate) {
      console.log('[ModelConfig] Remote updates disabled via MODEL_CONFIG_AUTO_UPDATE=false');
      return null;
    }

    if (!remoteUrl) {
      // No remote URL configured - this is fine, use local config
      return null;
    }

    try {
      console.log(`[ModelConfig] Checking for remote config at: ${remoteUrl}`);

      // Use native fetch (Node.js 18+) or skip if not available
      if (typeof fetch === 'undefined') {
        console.log('[ModelConfig] Fetch not available (Node.js < 18), skipping remote update');
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(remoteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AIO-ModelConfig/1.0',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[ModelConfig] Remote config fetch failed: HTTP ${response.status}`);
        return null;
      }

      const remoteConfig = await response.json();

      // Validate remote config
      if (!remoteConfig.version || !remoteConfig.providers) {
        console.warn('[ModelConfig] Invalid remote config structure');
        return null;
      }

      console.log(`[ModelConfig] ✅ Remote config fetched successfully (version ${remoteConfig.version})`);
      return remoteConfig;

    } catch (error) {
      console.warn(`[ModelConfig] Failed to fetch remote config: ${error.message}`);
      console.log('[ModelConfig] Falling back to local configuration');
      return null;
    }
  }

  /**
   * Apply environment variable overrides for specific aliases and labels
   * Pattern: MODEL_ALIAS_{PROVIDER}_{ALIAS} for models
   * Pattern: MODEL_LABEL_{PROVIDER}_{ALIAS} for display labels
   */
  applyEnvOverrides() {
    Object.keys(process.env).forEach(key => {
      // Pattern: MODEL_ALIAS_{PROVIDER}_{ALIAS}
      const aliasMatch = key.match(/^MODEL_ALIAS_(\w+)_(\w+)$/i);
      if (aliasMatch) {
        const [, provider, alias] = aliasMatch;
        const providerKey = provider.toLowerCase();
        const aliasKey = alias.toLowerCase();
        const models = process.env[key].split(',').map(m => m.trim()).filter(Boolean);

        if (models.length > 0 && this.config.providers[providerKey]?.aliases[aliasKey]) {
          this.config.providers[providerKey].aliases[aliasKey].models = models;
          console.log(`[ModelConfig] ENV override: ${providerKey}.${aliasKey} = [${models.join(', ')}]`);
        }
      }

      // Pattern: MODEL_LABEL_{PROVIDER}_{ALIAS}
      const labelMatch = key.match(/^MODEL_LABEL_(\w+)_(\w+)$/i);
      if (labelMatch) {
        const [, provider, alias] = labelMatch;
        const providerKey = provider.toLowerCase();
        const aliasKey = alias.toLowerCase();

        if (this.config.providers[providerKey]?.aliases[aliasKey]) {
          this.config.providers[providerKey].aliases[aliasKey].label = process.env[key];
          console.log(`[ModelConfig] ENV label override: ${providerKey}.${aliasKey} = "${process.env[key]}"`);
        }
      }
    });
  }

  /**
   * Resolve alias to actual model configuration
   * @param {string} alias - Alias in format "{provider}.{intent}" (e.g., "chatgpt.fast")
   * @returns {Object} Resolved configuration with fallback chain
   */
  resolveAlias(alias) {
    if (!alias || typeof alias !== 'string') {
      throw new Error('Invalid alias: must be a non-empty string');
    }

    // Parse alias format: {provider}.{intent}
    const parts = alias.split('.');
    const providerKey = parts[0];
    const intentKey = parts[1] || 'default';

    // Handle legacy provider names
    const normalizedProvider = this.config.legacyMapping[providerKey] || providerKey;
    const provider = this.config.providers[normalizedProvider];

    if (!provider) {
      throw new Error(`Unknown provider: ${providerKey}. Valid providers: ${Object.keys(this.config.legacyMapping).join(', ')}`);
    }

    const aliasConfig = provider.aliases[intentKey];
    if (!aliasConfig) {
      const validAliases = Object.keys(provider.aliases).join(', ');
      throw new Error(`Unknown alias: ${alias}. Valid aliases for ${providerKey}: ${validAliases}`);
    }

    return {
      provider: normalizedProvider,
      legacyProvider: providerKey,
      alias: intentKey,
      fullAlias: `${providerKey}.${intentKey}`,
      label: aliasConfig.label,
      description: aliasConfig.description,
      fallbackChain: aliasConfig.models,
      primaryModel: aliasConfig.models[0],
      isDefault: aliasConfig.default || false
    };
  }

  /**
   * Get all available aliases for a provider
   * @param {string} providerKey - Provider key (e.g., "chatgpt", "claude")
   * @returns {Array} List of alias objects
   */
  getProviderAliases(providerKey) {
    const normalizedProvider = this.config.legacyMapping[providerKey] || providerKey;
    const provider = this.config.providers[normalizedProvider];

    if (!provider) return [];

    return Object.entries(provider.aliases).map(([key, config]) => ({
      alias: `${providerKey}.${key}`,
      label: config.label,
      description: config.description,
      isDefault: config.default || false
    }));
  }

  /**
   * Get all providers with their aliases for frontend consumption
   * @returns {Object} Providers grouped with their aliases
   */
  getAllProvidersWithAliases() {
    const result = {};

    Object.entries(this.config.legacyMapping).forEach(([legacyName, providerKey]) => {
      const provider = this.config.providers[providerKey];
      if (!provider) return;

      result[legacyName] = {
        displayName: provider.displayName,
        company: provider.company,
        aliases: Object.entries(provider.aliases).map(([aliasKey, config]) => ({
          id: `${legacyName}.${aliasKey}`,
          name: config.label,
          description: config.description,
          isDefault: config.default || false
        }))
      };
    });

    return result;
  }

  /**
   * Get the default alias for a provider
   * @param {string} providerKey - Provider key (e.g., "chatgpt")
   * @returns {string} Default alias (e.g., "chatgpt.fast")
   */
  getDefaultAlias(providerKey) {
    const aliases = this.getProviderAliases(providerKey);
    const defaultAlias = aliases.find(a => a.isDefault);
    return defaultAlias ? defaultAlias.alias : (aliases[0]?.alias || `${providerKey}.default`);
  }

  /**
   * Execute a query function with automatic fallback through the model chain
   * @param {string} alias - The model alias
   * @param {Function} queryFn - Async function that takes modelId and returns result
   * @returns {Object} Result with modelUsed and actual result
   */
  async executeWithFallback(alias, queryFn) {
    const resolved = this.resolveAlias(alias);
    const errors = [];

    for (const modelId of resolved.fallbackChain) {
      try {
        console.log(`[ModelConfig] Trying model: ${modelId} for alias ${alias}`);
        const result = await queryFn(modelId);
        console.log(`[ModelConfig] Success with model: ${modelId}`);
        return {
          success: true,
          modelUsed: modelId,
          alias: resolved.fullAlias,
          label: resolved.label,
          result
        };
      } catch (error) {
        const errorMsg = error?.message || String(error);
        console.warn(`[ModelConfig] Model ${modelId} failed: ${errorMsg}`);
        errors.push({ model: modelId, error: errorMsg });
      }
    }

    // All models in fallback chain failed
    const errorDetails = errors.map(e => `${e.model}: ${e.error}`).join('; ');
    throw new Error(
      `All models failed for alias "${alias}". ` +
      `Tried: [${resolved.fallbackChain.join(', ')}]. ` +
      `Errors: ${errorDetails}`
    );
  }

  /**
   * Get configuration version
   * @returns {string} Config version
   */
  getVersion() {
    return this.config.version || '1.0.0';
  }

  /**
   * Reload configuration (useful for hot-reload scenarios)
   */
  reload() {
    console.log('[ModelConfig] Reloading configuration...');
    this.loadConfig();
  }

  /**
   * Embedded default configuration as fallback
   */
  getDefaultConfig() {
    return {
      version: "1.0.0",
      providers: {
        openai: {
          displayName: "ChatGPT",
          company: "OpenAI",
          aliases: {
            fast: { label: "OpenAI Fast", description: "Quick, cost-effective", models: ["gpt-4o-mini"], default: true },
            default: { label: "OpenAI Standard", description: "Balanced", models: ["gpt-4o", "gpt-4o-mini"] },
            premium: { label: "OpenAI Premium", description: "Maximum capability", models: ["gpt-4o"] }
          }
        },
        anthropic: {
          displayName: "Claude",
          company: "Anthropic",
          aliases: {
            fast: { label: "Claude Fast", description: "Quick responses", models: ["claude-haiku-4-5-20251001", "claude-3-5-haiku-20241022"], default: true },
            default: { label: "Claude Standard", description: "Best overall", models: ["claude-sonnet-4-5-20250929", "claude-3-5-sonnet-20241022"] },
            premium: { label: "Claude Premium", description: "Maximum intelligence", models: ["claude-opus-4-5-20251101", "claude-sonnet-4-5-20250929"] }
          }
        },
        google: {
          displayName: "Gemini",
          company: "Google",
          aliases: {
            fast: { label: "Gemini Fast", description: "Fast and cost-efficient", models: ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite"], default: true },
            default: { label: "Gemini Standard", description: "Best price-performance", models: ["gemini-2.5-flash", "gemini-2.0-flash"] },
            premium: { label: "Gemini Premium", description: "Most capable for complex reasoning", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"] }
          }
        },
        perplexity: {
          displayName: "Perplexity",
          company: "Perplexity AI",
          aliases: {
            fast: { label: "Perplexity Fast", description: "Quick search", models: ["sonar"], default: true },
            default: { label: "Perplexity Standard", description: "Enhanced search", models: ["sonar-pro", "sonar"] },
            premium: { label: "Perplexity Premium", description: "Advanced reasoning with DeepSeek-R1", models: ["sonar-reasoning-pro", "sonar-reasoning"] }
          }
        }
      },
      legacyMapping: {
        chatgpt: "openai",
        claude: "anthropic",
        gemini: "google",
        perplexity: "perplexity"
      }
    };
  }
}

// Singleton instance
export const modelConfigService = new ModelConfigService();
export default ModelConfigService;
