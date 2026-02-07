import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Perplexity from '@perplexity-ai/perplexity_ai';
import { modelConfigService } from './modelConfig.js';

// AI Model Integrations - Provider-Agnostic Alias System
// Model IDs are now resolved from config, not hardcoded here.

// Centralized timeout for all API calls
const API_TIMEOUT_MS = 35000; // 35 seconds

export class AIModelService {
  // Initialize all clients in the constructor for efficiency.
  // This avoids creating new connections for every single prompt.
  constructor(apiKeys, modelAlias = null) {
    // modelAlias can be:
    // - Full alias like "chatgpt.fast" or "claude.premium"
    // - Legacy provider name like "chatgpt" (defaults to .fast)
    // - Raw model ID (for backward compatibility)
    this.modelAlias = modelAlias;
    this.resolvedConfig = null;
    this._geminiModelsCache = null; // { at: number, models: string[] }

    // OpenAI Client
    if (apiKeys.chatgpt) {
      this.openai = new OpenAI({
        apiKey: apiKeys.chatgpt,
        timeout: API_TIMEOUT_MS,
      });
    }

    // Anthropic Client
    if (apiKeys.claude) {
      this.anthropic = new Anthropic({
        apiKey: apiKeys.claude,
        timeout: API_TIMEOUT_MS,
      });
    }

    // Google Gemini Client
    if (apiKeys.gemini) {
      this.geminiKey = apiKeys.gemini;
      this.genAI = new GoogleGenerativeAI(apiKeys.gemini);
      // Don't pre-configure a model - we'll create it per-query with the resolved alias
      this.gemini = null;
    }

    // Perplexity API key (use HTTP fetch instead of SDK for reliability)
    if (apiKeys.perplexity) {
      this.perplexityKey = apiKeys.perplexity;
    }
  }

  async queryModel(model, prompt) {
    switch (model) {
      case 'chatgpt':
        return await this.queryChatGPT(prompt);
      case 'claude':
        return await this.queryClaude(prompt);
      case 'gemini':
        return await this.queryGemini(prompt);
      case 'perplexity':
        return await this.queryPerplexity(prompt);
      // Grok has been removed as it does not have a public API.
      default:
        throw new Error(`Unsupported or removed AI model: ${model}`);
    }
  }

  async queryChatGPT(prompt) {
    if (!this.openai) {
      throw new Error('ChatGPT API key not configured or client failed to initialize');
    }

    // Resolve alias to model(s) with fallback chain
    const alias = this._resolveProviderAlias('chatgpt');
    console.log(`[ChatGPT] Starting query with alias: ${alias}`);

    const queryFn = async (modelId) => {
      console.log(`[ChatGPT] Trying model: ${modelId}`);
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a helpful assistant providing product and service recommendations. When users ask for suggestions, provide specific, detailed recommendations with brand names and reasons why they might be suitable.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,  // Increased from 250
      });
      return response.choices[0].message.content.trim();
    };

    try {
      const result = await modelConfigService.executeWithFallback(alias, queryFn);
      console.log(`[ChatGPT] Query completed successfully with model: ${result.modelUsed}`);
      return result.result;
    } catch (error) {
      console.error(`[ChatGPT] All models failed for alias ${alias}:`, error.message);
      throw new Error(`ChatGPT query failed: ${error.message}`);
    }
  }

  async queryClaude(prompt) {
    if (!this.anthropic) {
      throw new Error('Claude API key not configured or client failed to initialize');
    }

    // Resolve alias to model(s) with fallback chain
    const alias = this._resolveProviderAlias('claude');
    console.log(`[Claude] Starting query with alias: ${alias}`);

    const queryFn = async (modelId) => {
      console.log(`[Claude] Trying model: ${modelId}`);
      const response = await this.anthropic.messages.create({
                    model: modelId,
                    max_tokens: 2000,  // Increased from 250        system: 'You are a helpful assistant providing product and service recommendations. When users ask for suggestions, provide specific, detailed recommendations with brand names and reasons why they might be suitable.',
        messages: [{ role: 'user', content: prompt }],
      });
      // The response structure for the latest SDK provides content as an array of blocks.
      const responseText = response.content.map(block => block.text).join(' ');
      return responseText.trim();
    };

    try {
      const result = await modelConfigService.executeWithFallback(alias, queryFn);
      console.log(`[Claude] Query completed successfully with model: ${result.modelUsed}`);
      return result.result;
    } catch (error) {
      console.error(`[Claude] All models failed for alias ${alias}:`, error.message);
      throw new Error(`Claude query failed: ${error.message}`);
    }
  }

  async queryGemini(prompt) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured or client failed to initialize');
    }

    // Resolve alias to model(s) with fallback chain
    const alias = this._resolveProviderAlias('gemini');
    console.log(`[Gemini] Starting query with alias: ${alias}`);

    const queryFn = async (modelId) => {
      console.log(`[Gemini] Trying model: ${modelId}`);

      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const isRetryable = (errMsg) => {
        const msg = (errMsg || '').toLowerCase();
        return (
          msg.includes('503') ||
          msg.includes('overloaded') ||
          msg.includes('unavailable') ||
          msg.includes('timeout') ||
          msg.includes('deadline') ||
          msg.includes('aborted') ||
          msg.includes('network') ||
          msg.includes('empty response') ||
          msg.includes('no response candidates')
        );
      };

      let lastErr = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
              maxOutputTokens: 4000,
              temperature: 0.7,
              topP: 0.95,
              topK: 40,
            },
          });

        // Prepend clear instructions to the prompt itself
        const instructedPrompt = `You are a helpful assistant providing detailed product and service recommendations.

User question: ${prompt}

Provide a comprehensive answer with:
- Specific brand/product names
- Reasons why they're suitable
- Key features to consider
- At least 3-5 recommendations

Answer in detail (minimum 100 words):`;

          const result = await model.generateContent(instructedPrompt);
        const response = result.response;

        // Debug logging
        console.log(`[Gemini] Response received, candidates: ${response.candidates?.length || 0}`);

        // Check if response was blocked
        if (response.promptFeedback?.blockReason) {
          console.error(`[Gemini] Content blocked: ${response.promptFeedback.blockReason}`);
          throw new Error(`Content blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }

        // Check for candidates
          if (!response.candidates || response.candidates.length === 0) {
            console.error(`[Gemini] No candidates in response`);
            throw new Error('No response candidates generated');
          }

        // Log finish reason for all candidates
        response.candidates.forEach((candidate, index) => {
          console.log(`[Gemini] Candidate ${index} finishReason: ${candidate.finishReason}`);
        });

        // Get first candidate for checks and logging
          const candidate = response.candidates[0];

        // LOGGING THE ENTIRE CANDIDATE OBJECT FOR DEBUGGING
        console.log('[Gemini] FULL CANDIDATE OBJECT:', JSON.stringify(candidate, null, 2));

        // Check if candidate was blocked
          if (candidate.finishReason === 'SAFETY') {
            console.error(`[Gemini] Response blocked by safety filters`);
            throw new Error('Response blocked by safety filters');
          }

        // Prefer response.text() which concatenates parts, with fallback aggregating all candidates/parts
          let text = '';
          try {
            if (typeof response.text === 'function') {
              text = response.text();
            }
          } catch (_) {
            // ignore and fallback below
          }

        // Fallback A: concatenate all text parts from the first candidate
          let firstCandidateText = '';
          if (candidate?.content?.parts?.length) {
            firstCandidateText = candidate.content.parts
              .map((p) => (typeof p === 'string' ? p : (p.text || '')))
              .filter(Boolean)
              .join('\n');
          }

        // Fallback B: concatenate parts from all candidates (choose the longest)
          let allCandidatesText = '';
          if (Array.isArray(response.candidates) && response.candidates.length > 0) {
            allCandidatesText = response.candidates
              .map((c) => (c?.content?.parts || [])
                .map((p) => (typeof p === 'string' ? p : (p.text || '')))
                .filter(Boolean)
                .join('\n'))
              .filter(Boolean)
              .join('\n\n');
          }

        // Pick the richest non-empty text available
          const candidatesTexts = [text, allCandidatesText, firstCandidateText].filter((t) => t && t.trim().length > 0);
          text = candidatesTexts.sort((a, b) => b.length - a.length)[0] || '';

          if (!text || text.trim().length === 0) {
            throw new Error('Empty response from Gemini');
          }

          const trimmedText = text.trim();
          console.log(`[Gemini] Success: ${trimmedText.length} chars, ${trimmedText.split(' ').length} words`);
          console.log(`[Gemini] Preview: "${trimmedText.substring(0, 100)}..."`);

          if (trimmedText.length < 50) {
            console.warn(`[Gemini] Warning: Very short response (${trimmedText.length} chars)`);
          }

          return trimmedText;

        } catch (error) {
          const msg = error?.message || String(error);
          console.error(`[Gemini] Attempt ${attempt} failed: ${msg}`);
          lastErr = error;
          if (attempt < 3 && isRetryable(msg)) {
            const backoff = attempt * 1000;
            console.log(`[Gemini] Retrying in ${backoff}ms due to transient error...`);
            await wait(backoff);
            continue;
          }
          throw error;
        }
      }
      throw lastErr || new Error('Gemini query failed');
    };

    try {
      const result = await modelConfigService.executeWithFallback(alias, queryFn);
      console.log(`[Gemini] Query completed successfully with model: ${result.modelUsed}`);
      return result.result;
    } catch (error) {
      console.error(`[Gemini] All models failed for alias ${alias}:`, error.message);
      throw new Error(`Gemini query failed: ${error.message}`);
    }
  }

  async queryPerplexity(prompt) {
    if (!this.perplexityKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Resolve alias to model(s) with fallback chain
    const alias = this._resolveProviderAlias('perplexity');
    console.log(`[Perplexity] Starting query with alias: ${alias}`);

    const queryFn = async (modelId) => {
      console.log(`[Perplexity] Trying model: ${modelId}`);
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000); // 10s hard timeout per call

      try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: 'You are a helpful assistant providing product and service recommendations. When users ask for suggestions, provide specific, detailed recommendations with brand names and reasons why they might be suitable.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,  // Increased from 250
          }),
          signal: controller.signal,
        });
        clearTimeout(t);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        const data = await res.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Unexpected response shape from Perplexity');
        }
        return (data.choices[0].message.content || '').trim();
      } finally {
        clearTimeout(t);
      }
    };

    try {
      const result = await modelConfigService.executeWithFallback(alias, queryFn);
      console.log(`[Perplexity] Query completed successfully with model: ${result.modelUsed}`);
      return result.result;
    } catch (error) {
      console.error(`[Perplexity] All models failed for alias ${alias}:`, error.message);
      throw new Error(`Perplexity query failed: ${error.message}`);
    }
  }

  /**
   * Helper to resolve the alias for a specific provider
   * Supports multiple formats:
   * - Full alias: "chatgpt.fast"
   * - Provider only: "chatgpt" -> "chatgpt.fast" (default)
   * - Legacy raw model ID (backward compatibility)
   */
  _resolveProviderAlias(provider) {
    if (!this.modelAlias) {
      // No alias specified, use provider default
      return modelConfigService.getDefaultAlias(provider);
    }

    // If alias contains a dot, it's already a full alias
    if (this.modelAlias.includes('.')) {
      return this.modelAlias;
    }

    // Check if it's just a provider name (use default alias)
    const providers = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];
    if (providers.includes(this.modelAlias.toLowerCase())) {
      return modelConfigService.getDefaultAlias(this.modelAlias);
    }

    // It might be a raw model ID for backward compatibility
    // Use the provider's default alias
    return modelConfigService.getDefaultAlias(provider);
  }

  // Analyze if brand is mentioned in the answer
  analyzeBrandMention(answer, brandName) {
    if (!answer || !brandName) return false;

    // Safety check: limit input sizes to prevent regex issues
    if (answer.length > 50000 || brandName.length > 500) {
      console.warn('[analyzeBrandMention] Input too large, using simple string match');
      const la = answer.toLowerCase();
      const lb = brandName.toLowerCase().trim();
      return lb.length > 0 && la.includes(lb);
    }

    // Safer regex: match each word separated by non-alphanumerics
    const normalized = brandName.trim();
    const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const words = normalized.split(/\s+/).map(escapeRx);
    const body = words.join('[^a-z0-9]+');

    try {
      const pattern = new RegExp(`(^|[^a-z0-9])${body}([^a-z0-9]|$)`, 'i');
      return pattern.test(answer);
    } catch (e) {
      console.warn('[analyzeBrandMention] Regex failed, using fallback:', e.message);
      const la = answer.toLowerCase();
      const lb = normalized.toLowerCase();
      return lb.length > 0 && la.includes(lb);
    }
  }

  // Extract competitor mentions
  // NOTE: This function is highly complex and could be simplified by asking the LLM
  // to return structured JSON output. For now, it is kept as-is to focus on fixing the scan functionality.
  async extractCompetitors(answer, brandName) {
    // Safety checks
    if (!answer || answer.length === 0) {
      return [];
    }

    if (answer.length > 50000) {
      console.log('[extractCompetitors] Answer too large, truncating...');
      answer = answer.substring(0, 50000);
    }

    if (!brandName || brandName.length > 500) {
      return [];
    }

    // Check if OpenAI client is available
    if (!this.openai) {
      console.log('[extractCompetitors] OpenAI client not available, skipping competitor extraction');
      return [];
    }

    // Use AI to extract competitors (Mayin backend approach)
    try {
      const schema = '{ "competitors": [{"name": string, "count": number}] }';
      const systemPrompt = 'Extract brand/product names mentioned in the text as strict JSON. No extra text or explanation. Provide a detailed answer with a minimum of 500 words.';
      const userPrompt = `Extract all brand or product names from this text. Return as JSON array.\n\nSchema: ${schema}\n\nText:\n${answer.substring(0, 10000)}`; // Limit to 10000 chars for extraction

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      const raw = response.choices?.[0]?.message?.content?.trim() || '{}';

      // Try to parse JSON (handle markdown code blocks)
      let jsonStr = raw;
      if (raw.includes('```')) {
        jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(jsonStr);

      // Extract competitor names
      const competitors = (parsed.competitors || [])
        .map(c => ({ name: String(c.name || '').trim(), mentions: c.count || 1 }))
        .filter(c => c.name.length > 2) // At least 3 chars
        .filter(c => !brandName || !new RegExp(brandName, 'i').test(c.name)) // Exclude own brand
        .slice(0, 20);

      if (competitors.length > 0) {
        console.log(`[extractCompetitors] Extracted ${competitors.length} competitors`);
      }

      return competitors;

    } catch (error) {
      // Fail silently - competitor extraction is optional
      return [];
    }
  }
}

export default AIModelService;
