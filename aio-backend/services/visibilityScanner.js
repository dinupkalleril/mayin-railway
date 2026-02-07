import { pool } from '../config/db.js';
import { AIModelService } from './aiModels.js';
import { generatePrompts } from './promptGenerator.js';
import { generateRealisticPrompts } from './realisticPromptGenerator.js';
import { generatePromptsWithAICached, validatePrompts } from './aiPromptGenerator.js';
import * as crypto from 'crypto';

// --- Start of Optimization ---

// Memoize the derived key so it's only computed once per application instance.
// This is a significant performance boost as hashing is a synchronous CPU-intensive operation.
let derivedKey = null;
const ALGORITHM = 'aes-256-cbc';

function getDerivedKey() {
  if (derivedKey) {
    return derivedKey;
  }
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
  // createHash is synchronous and can block the event loop if called frequently.
  // By memoizing the result, we ensure it only happens once.
  derivedKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  return derivedKey;
}

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      console.error('Invalid encrypted text format.');
      return null;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// --- End of Optimization ---


// Main visibility scanner service

export async function runVisibilityScan(scanId, userId, aiModel, modelVersion, brandInfo, promptCount) {
  console.log(`\n========== SCAN STARTED ==========`);
  console.log(`Scan ID: ${scanId}`);
  console.log(`AI Model: ${aiModel}`);
  console.log(`Model Version: ${modelVersion}`);
  console.log(`Brand: ${brandInfo.brandName}`);
  console.log(`Prompt Count: ${promptCount}`);
  console.log(`==================================\n`);

  try {
    // Update status to running
    await pool.query(
      'UPDATE visibility_scans SET status = $1, updated_at = $2 WHERE id = $3',
      ['running', new Date().toISOString(), scanId]
    );
    console.log('✓ Status updated to running');

    // Get user's API keys (decrypted)
    console.log('Fetching API keys...');
    const apiKeys = await getDecryptedAPIKeys(userId);

    if (!apiKeys[aiModel]) {
      throw new Error(`API key for ${aiModel} not configured`);
    }
    console.log(`✓ API key found for ${aiModel}`);

    // Initialize AI service with model version
    const aiService = new AIModelService(apiKeys, modelVersion);
    console.log(`✓ AI service initialized with model: ${modelVersion || 'default'}`);

    // Generate realistic prompts using GPT-4o (AI-powered)
    console.log(`Generating ${promptCount} AI-powered realistic prompts for ${brandInfo.brandName}...`);
    console.log(`[Note] Using GPT-4o to generate prompts that match real user behavior`);

    let prompts;
    try {
      // Use ChatGPT API key to generate prompts with GPT-4o
      prompts = await generatePromptsWithAICached(brandInfo, promptCount, apiKeys.chatgpt);

      // Validate that prompts don't mention the brand name
      prompts = validatePrompts(prompts, brandInfo.brandName);

      console.log(`✓ Generated ${prompts.length} AI-powered, realistic prompts`);

      // Log a sample prompt for debugging
      if (prompts.length > 0) {
        console.log(`Sample prompt: "${prompts[0].substring(0, 150)}..."`);
      }
    } catch (error) {
      console.error(`[Warning] AI prompt generation failed: ${error.message}`);
      console.log(`[Fallback] Using static prompt generator...`);

      // Fallback to static realistic prompts if AI generation fails
      prompts = generateRealisticPrompts(brandInfo, promptCount);
      console.log(`✓ Generated ${prompts.length} prompts (fallback mode)`);
    }

    // Provider-specific execution config
    // Using parallel processing (8 concurrent requests) like Mayin backend for faster scans
    const PROVIDER_CONFIG = {
      chatgpt: { perCallTimeoutMs: 30000, batchSize: 8 },
      claude: { perCallTimeoutMs: 30000, batchSize: 8 },
      // Reduce concurrency and increase timeout for Gemini to mitigate 503/latency
      gemini: { perCallTimeoutMs: 45000, batchSize: 4 },
      perplexity: { perCallTimeoutMs: 15000, batchSize: 5 }, // Lower for rate limits
    };
    const cfg = PROVIDER_CONFIG[aiModel] || { perCallTimeoutMs: 30000, batchSize: 8 };
    console.log(`[Config] Provider: ${aiModel}, Timeout: ${cfg.perCallTimeoutMs}ms, Concurrency: ${cfg.batchSize}`);

    // Run prompts (with concurrency limit to avoid rate limits)
    const results = [];
    const batchSize = cfg.batchSize;
    let mentionedCount = 0;
    const competitorMap = new Map();

    console.log(`Starting scan with ${prompts.length} prompts using ${aiModel}...`);
    const startTime = Date.now();

    // Hard deadline to avoid long-running scans even if provider is slow
    const expectedBatches = Math.ceil(prompts.length / batchSize);
    const baseBudget = Math.ceil((cfg.perCallTimeoutMs * expectedBatches) / 2);
    const maxDurationMs = Math.min(baseBudget + 60000, aiModel === 'perplexity' ? 4 * 60 * 1000 : 5 * 60 * 1000);
    const deadline = Date.now() + maxDurationMs;

    for (let i = 0; i < prompts.length; i += batchSize) {
      if (Date.now() > deadline) {
        console.warn(`Scan ${scanId} reached time budget; finishing with partial results.`);
        break;
      }
      const batch = prompts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(prompts.length / batchSize);

      console.log(`\nProcessing batch ${batchNum}/${totalBatches}... (${batch.length} prompts)`);

      // Per-call explicit timeout wrapper to avoid stuck requests
      const withTimeout = (p, ms, label) => {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(`[Timeout] ${label} exceeded ${ms}ms`);
            reject(new Error(`${label || 'Request'} timed out after ${ms}ms`));
          }, ms);
        });
        return Promise.race([p, timeoutPromise]).finally(() => clearTimeout(timeoutId));
      };

      const batchResults = await Promise.all(
        batch.map(async (prompt, idx) => {
          const promptNum = i + idx + 1;
          console.log(`  [${promptNum}] Starting query...`);
          try {
            // Query the AI model
            const answer = await withTimeout(
              aiService.queryModel(aiModel, prompt),
              cfg.perCallTimeoutMs,
              `Prompt ${promptNum}`
            );
            console.log(`  ✓ Prompt ${promptNum} completed (${answer.length} chars)`);

            // Analyze the answer with error handling
            let mentioned = false;
            let competitors = [];

            try {
              console.log(`  [${promptNum}] Analyzing brand mention...`);
              mentioned = (typeof aiService.isBrandMentioned === 'function')
                ? aiService.isBrandMentioned(answer, brandInfo.brandName)
                : aiService.analyzeBrandMention(answer, brandInfo.brandName);
              console.log(`  [${promptNum}] Brand mention analysis complete: ${mentioned}`);
            } catch (error) {
              console.error(`  ✗ Error analyzing brand mention for prompt ${promptNum}:`, error.message);
            }

            try {
              console.log(`  [${promptNum}] Extracting competitors...`);
              competitors = await aiService.extractCompetitors(answer, brandInfo.brandName) || [];
              console.log(`  [${promptNum}] Extracted ${competitors.length} competitors`);
            } catch (error) {
              console.error(`  ✗ Error extracting competitors for prompt ${promptNum}:`, error.message);
              competitors = [];
            }

            // Count competitors
            try {
              if (Array.isArray(competitors)) {
                competitors.forEach(comp => {
                  const existing = competitorMap.get(comp.name) || 0;
                  competitorMap.set(comp.name, existing + comp.mentions);
                });
              }
            } catch (error) {
              console.error(`  ✗ Error counting competitors for prompt ${promptNum}:`, error.message);
            }

            if (mentioned) {
              mentionedCount++;
            }

            console.log(`  [${promptNum}] Storing answer: "${answer.substring(0, 500)}..."`);

            return {
              prompt,
              answer,
              mentioned
            };
          } catch (error) {
            console.error(`  ✗ Prompt ${promptNum} failed: ${error.message}`);
            return {
              prompt,
              answer: `Error: ${error.message}`,
              mentioned: false
            };
          }
        })
      );

      console.log(`Batch ${batchNum} complete. Total processed: ${results.length + batchResults.length}/${prompts.length}`);
      results.push(...batchResults);

      // Minimal delay between batches (parallel processing handles rate limiting better)
      if (i + batchSize < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 1000ms to 100ms
      }

      // Update progress
      const progress = Math.round((results.length / prompts.length) * 100);
      console.log(`Progress: ${progress}% (${results.length}/${prompts.length})`);
    }

    // Calculate score
    const score = Math.round((mentionedCount / prompts.length) * 100);
    console.log(`\n✓ Scan processing complete. Calculating final results...`);
    console.log(`  Mentioned Count: ${mentionedCount}/${prompts.length}`);
    console.log(`  Visibility Score: ${score}/100`);

    // Convert competitor map to array
    const competitors = Array.from(competitorMap.entries())
      .map(([name, mentions]) => ({ name, mentions }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20); // Top 20 competitors

    console.log(`  Competitors Found: ${competitors.length}`);

    console.log('--- BEGIN RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
    console.log('--- END RESULTS ---');

    // Save results to database
    console.log(`\n💾 Saving results to database...`);

    try {
      const updateResult = await pool.query(
        `UPDATE visibility_scans
         SET status = $1, score = $2, mentioned_count = $3, competitors = $4,
             prompts_and_answers = $5, completed_at = $6, updated_at = $7
         WHERE id = $8
         RETURNING *`,
        [
          'completed',
          score,
          mentionedCount,
          JSON.stringify(competitors),
          JSON.stringify(results),
          new Date().toISOString(),
          new Date().toISOString(),
          scanId
        ]
      );

      if (updateResult.rowCount === 0) {
        throw new Error(`Failed to update scan ${scanId} - scan not found in database`);
      }

      console.log(`✓ Results saved successfully to database`);
      console.log(`\n========== SCAN COMPLETED ==========`);
      console.log(`Scan ID: ${scanId}`);
      console.log(`Score: ${score}/100`);
      console.log(`Mentioned: ${mentionedCount}/${prompts.length} prompts`);
      console.log(`Competitors: ${competitors.length}`);
      console.log(`====================================\n`);

    } catch (dbError) {
      console.error(`\n❌ DATABASE ERROR - Failed to save results:`, dbError.message);
      console.error(`Error details:`, dbError);
      throw new Error(`Database save failed: ${dbError.message}`);
    }

    return {
      success: true,
      score,
      mentionedCount,
      totalPrompts: prompts.length
    };

  } catch (error) {
    console.error('Visibility scan error:', error);

    // Update scan with error
    await pool.query(
      'UPDATE visibility_scans SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
      ['failed', error.message, new Date().toISOString(), scanId]
    );

    throw error;
  }
}

// Helper to get decrypted API keys
async function getDecryptedAPIKeys(userId) {
  try {
    // Query database directly instead of HTTP call
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('No API keys found');
    }

    const data = result.rows[0];

    // Decrypt all keys using the optimized decrypt function
    return {
      chatgpt: data.chatgpt_key ? decrypt(data.chatgpt_key) : null,
      claude: data.claude_key ? decrypt(data.claude_key) : null,
      gemini: data.gemini_key ? decrypt(data.gemini_key) : null,
      perplexity: data.perplexity_key ? decrypt(data.perplexity_key) : null
    };
  } catch (error) {
    console.error('Failed to retrieve API keys:', error);
    throw new Error('Failed to retrieve API keys');
  }
}

export default { runVisibilityScan };
