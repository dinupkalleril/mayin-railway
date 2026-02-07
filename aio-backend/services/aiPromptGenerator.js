/**
 * AI-Powered Prompt Generator
 *
 * Uses GPT-4o to generate realistic, conversational prompts that match
 * how real users actually search - WITHOUT mentioning the brand name.
 *
 * These prompts are then used to test all AI models (ChatGPT, Claude,
 * Gemini, Perplexity) to see if they naturally recommend the brand.
 */

import OpenAI from 'openai';

/**
 * Generate realistic prompts using GPT-4o
 */
export async function generatePromptsWithAI(brandInfo, count = 100, openaiApiKey) {
  const { brandName, productDetails, tagline, industry, location, websiteUrl } = brandInfo;

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  console.log(`[AI Prompt Generator] Using GPT-4o to generate ${count} realistic prompts...`);

  // System prompt for GPT-4o to act as a prompt generator
  const systemPrompt = `You are a user behavior specialist who generates realistic search queries.

Your task: Generate REALISTIC queries that REAL USERS would type when looking for products/services like the one described.

CRITICAL RULES:
1. NEVER mention the brand name "${brandName}" in the queries
2. Users are ASKING FOR recommendations, not asking ABOUT a specific brand
3. Queries should be conversational, natural, and detailed
4. Include specific pain points, needs, and context
5. Vary length (50-200 words)
6. Use first-person language ("I need", "I'm looking for", "help me")
7. Include real-world context and situations
8. Mix different user personas (beginner, professional, budget-conscious, frustrated, etc.)

GOOD EXAMPLES:
✅ "I need a video editing tool for my YouTube channel. I don't have technical skills and want something with AI automation for captions and cuts. Also need templates. Budget is around $50/month. What do creators actually use?"

✅ "Looking for project management software for a remote team of 15. Current tool is too complicated and missing integrations we need. Must have Slack/Google Workspace integration, mobile apps, and easy onboarding. Recommendations?"

✅ "I run a small e-commerce store and struggling with inventory management. Need something affordable that syncs with Shopify, handles multiple warehouses, and has good reporting. What works for businesses my size?"

BAD EXAMPLES:
❌ "What is ${brandName}?" (mentions brand name)
❌ "Is ${brandName} good?" (mentions brand name)
❌ "Best tools" (too short and generic)
❌ "Compare ${brandName} with competitors" (mentions brand name)

Remember: Users don't know about ${brandName} yet - that's what we're testing!`;

  const userPrompt = `Generate ${count} realistic, conversational search queries for users looking for: ${productDetails}

Context:
- Industry: ${industry || 'General'}
- Type: ${productDetails}
${tagline ? `- Value proposition: ${tagline}` : ''}
${location ? `- Some users might be in: ${location}` : ''}

Requirements:
1. NO brand names mentioned
2. Natural, conversational tone
3. Specific pain points and needs
4. Different user personas
5. Real-world situations
6. 50-200 words each
7. Varied question styles

Format: Return ONLY the queries, one per line, numbered 1-${count}. No explanations.`;

  try {
    // Generate prompts in batches to avoid token limits
    const batchSize = 20;
    const batches = Math.ceil(count / batchSize);
    const allPrompts = [];

    for (let i = 0; i < batches; i++) {
      const batchCount = Math.min(batchSize, count - allPrompts.length);

      console.log(`[AI Prompt Generator] Generating batch ${i + 1}/${batches} (${batchCount} prompts)...`);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for best quality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt.replace(count, batchCount) }
        ],
        temperature: 0.9, // Higher temperature for more variety
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content.trim();

      // Parse the numbered list
      const lines = content.split('\n').filter(line => line.trim());
      const prompts = lines
        .map(line => {
          // Remove numbering like "1.", "1)", "1 -", etc.
          return line.replace(/^\d+[\.\)\-\:]\s*/, '').trim();
        })
        .filter(line => {
          // Remove empty lines and lines that are too short
          return line.length > 30 && !line.toLowerCase().includes(brandName.toLowerCase());
        });

      allPrompts.push(...prompts);

      // Small delay between batches to avoid rate limits
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[AI Prompt Generator] ✓ Generated ${allPrompts.length} prompts using GPT-4o`);

    // If we got fewer prompts than requested, pad with variations
    while (allPrompts.length < count) {
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];

      // Create a slight variation
      const variation = await createVariation(openai, randomPrompt, productDetails);

      if (!allPrompts.includes(variation) && !variation.toLowerCase().includes(brandName.toLowerCase())) {
        allPrompts.push(variation);
      }
    }

    return allPrompts.slice(0, count);

  } catch (error) {
    console.error('[AI Prompt Generator] Error:', error.message);
    throw new Error(`Failed to generate prompts with GPT-4o: ${error.message}`);
  }
}

/**
 * Create a variation of an existing prompt
 */
async function createVariation(openai, originalPrompt, productDetails) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Use mini for variations (faster)
    messages: [
      {
        role: 'system',
        content: 'You are a user behavior specialist. Create a similar but different realistic query.'
      },
      {
        role: 'user',
        content: `Create a variation of this query for ${productDetails}:\n\n"${originalPrompt}"\n\nMake it different but maintain the same conversational, natural style. Change the specific needs, pain points, or context. Return only the new query, nothing else.`
      }
    ],
    temperature: 0.8,
    max_tokens: 300,
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate prompts with caching for performance
 */
let promptCache = new Map();

export async function generatePromptsWithAICached(brandInfo, count, openaiApiKey) {
  const cacheKey = `${brandInfo.brandName}-${brandInfo.productDetails}-${count}`;

  // Check cache (valid for 1 hour)
  if (promptCache.has(cacheKey)) {
    const cached = promptCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) {
      console.log('[AI Prompt Generator] Using cached prompts');
      return cached.prompts;
    }
  }

  // Generate new prompts
  const prompts = await generatePromptsWithAI(brandInfo, count, openaiApiKey);

  // Cache the results
  promptCache.set(cacheKey, {
    prompts,
    timestamp: Date.now()
  });

  // Clear old cache entries (keep only last 10)
  if (promptCache.size > 10) {
    const oldestKey = promptCache.keys().next().value;
    promptCache.delete(oldestKey);
  }

  return prompts;
}

/**
 * Validate that prompts don't mention the brand
 */
export function validatePrompts(prompts, brandName) {
  const invalidPrompts = prompts.filter(prompt =>
    prompt.toLowerCase().includes(brandName.toLowerCase())
  );

  if (invalidPrompts.length > 0) {
    console.warn(`[AI Prompt Generator] Warning: ${invalidPrompts.length} prompts mention the brand name:`);
    invalidPrompts.forEach(p => console.warn(`  - "${p.substring(0, 100)}..."`));
  }

  // Return only valid prompts
  return prompts.filter(prompt =>
    !prompt.toLowerCase().includes(brandName.toLowerCase())
  );
}

/**
 * Get sample prompts for preview (without full generation)
 */
export async function getSamplePrompts(brandInfo, openaiApiKey) {
  return await generatePromptsWithAI(brandInfo, 5, openaiApiKey);
}

export default {
  generatePromptsWithAI,
  generatePromptsWithAICached,
  validatePrompts,
  getSamplePrompts
};
