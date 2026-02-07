# Model Configuration Guide

This guide explains how to configure AI models for self-hosted deployments of the AI Optimization Tool.

## Overview

The application uses a **provider-agnostic model alias system** that decouples your deployment from specific AI model identifiers. Instead of hardcoding model names like `gpt-4o-mini` or `claude-3-haiku-20240307`, the system uses logical aliases like `chatgpt.fast` or `claude.premium`.

### Benefits

- **Zero-code model updates** - Change models by editing config, no redeployment needed
- **Automatic fallback** - If a model is unavailable, the system tries alternatives
- **Self-hosted flexibility** - Customize model mappings for your API plan
- **Future-proof** - When providers release new models or deprecate old ones, just update config

## Configuration Methods

Configuration is loaded in the following priority order:

### 1. Environment Variable (Full Override)

Set the entire configuration via JSON:

```bash
MODEL_CONFIG_JSON='{"providers":{"openai":{"aliases":{"fast":{"models":["gpt-4o-mini"]}}}}}'
```

### 2. Environment Variables (Per-Alias Override)

Override specific aliases without replacing the entire config:

```bash
# Override model list for an alias
MODEL_ALIAS_OPENAI_FAST=gpt-4o-mini,gpt-3.5-turbo
MODEL_ALIAS_ANTHROPIC_DEFAULT=claude-sonnet-4-5-20250929
MODEL_ALIAS_GOOGLE_PREMIUM=gemini-2.5-pro,gemini-1.5-pro-latest

# Override display labels
MODEL_LABEL_OPENAI_FAST="GPT-4o Mini (Budget)"
MODEL_LABEL_ANTHROPIC_PREMIUM="Claude Opus (Maximum)"
```

### 3. Config File

Edit `config/models.config.json` in the backend directory.

## Alias Format

Aliases follow the pattern: `{provider}.{tier}`

**Providers:**
- `chatgpt` (OpenAI)
- `claude` (Anthropic)
- `gemini` (Google)
- `perplexity` (Perplexity AI)
- `grok` (xAI)

**Tiers:**
- `fast` - Quick responses, cost-effective (default)
- `default` - Balanced performance
- `premium` - Maximum capability

**Examples:**
- `chatgpt.fast` - OpenAI's fast/cheap model
- `claude.premium` - Anthropic's most capable model
- `gemini.default` - Google's balanced model

## Config File Schema

```json
{
  "version": "1.0.0",
  "providers": {
    "openai": {
      "displayName": "ChatGPT",
      "company": "OpenAI",
      "aliases": {
        "fast": {
          "label": "OpenAI Fast",
          "description": "Quick responses, cost-effective",
          "models": ["gpt-4o-mini", "gpt-3.5-turbo"],
          "default": true
        },
        "default": {
          "label": "OpenAI Standard",
          "description": "Balanced performance",
          "models": ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"]
        },
        "premium": {
          "label": "OpenAI Premium",
          "description": "Maximum capability",
          "models": ["gpt-4o", "gpt-4-turbo"]
        }
      }
    }
    // ... other providers
  },
  "legacyMapping": {
    "chatgpt": "openai",
    "claude": "anthropic",
    "gemini": "google",
    "perplexity": "perplexity",
    "grok": "xai"
  }
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `label` | User-friendly name shown in the UI |
| `description` | Brief description of the tier |
| `models` | Ordered list of model IDs to try (fallback chain) |
| `default` | If `true`, this alias is used when provider is selected without tier |

## Fallback Chain

Each alias has a `models` array that defines the fallback order:

```json
"fast": {
  "models": ["gpt-4o-mini", "gpt-3.5-turbo"]
}
```

When a scan runs:
1. System tries `gpt-4o-mini` first
2. If it fails (model deprecated, quota exceeded, etc.), tries `gpt-3.5-turbo`
3. If all models fail, returns an error

## Common Tasks

### Adding a New Model

When a provider releases a new model:

1. **Option A: Environment Variable**
   ```bash
   MODEL_ALIAS_OPENAI_FAST=gpt-5-mini,gpt-4o-mini,gpt-3.5-turbo
   ```

2. **Option B: Edit Config File**
   ```json
   "fast": {
     "models": ["gpt-5-mini", "gpt-4o-mini", "gpt-3.5-turbo"]
   }
   ```

Put the new model first in the list so it's tried before fallbacks.

### Removing a Deprecated Model

Simply remove it from the models array. The fallback chain will skip it.

### Changing the Default Tier

Set `"default": true` on the alias you want as default:

```json
"premium": {
  "label": "OpenAI Premium",
  "models": ["gpt-4o"],
  "default": true  // Now premium is the default
}
```

### Adding a Custom Tier

Add a new alias under the provider:

```json
"aliases": {
  "fast": { ... },
  "default": { ... },
  "premium": { ... },
  "experimental": {
    "label": "OpenAI Experimental",
    "description": "Cutting-edge models",
    "models": ["gpt-4.5-preview"]
  }
}
```

## API Endpoints

### Get All Providers and Aliases

```
GET /api/model-config/providers
```

Returns all available providers with their aliases for UI dropdowns.

### Resolve an Alias

```
GET /api/model-config/resolve/chatgpt.fast
```

Returns the resolved configuration including fallback chain (useful for debugging).

### Reload Configuration

```
POST /api/model-config/reload
```

Hot-reloads the configuration from file/env without restarting the server.

## Troubleshooting

### All Models Failing

1. **Check API key** - Verify your API key is valid and has quota
2. **Check model access** - Some models require specific API plans
3. **Check fallback chain** - Ensure at least one model in the chain is accessible

### Model Not Found Errors

- Verify the model ID is correct (check provider's documentation)
- Some models require specific API versions or endpoints

### Configuration Not Loading

1. Check JSON syntax in config file
2. Check ENV variable JSON is properly escaped
3. Run `POST /api/model-config/reload` to force reload
4. Check server logs for parsing errors

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial alias system with 5 providers, 3 tiers each |

## Support

For issues or questions:
- Check the main [troubleshooting guide](../troubleshooting.md)
- Review server logs for detailed error messages
- Verify your API keys have access to the models you're configuring
