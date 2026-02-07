import { pool } from '../config/db.js';
import OpenAI from 'openai';
import axios from 'axios';

// Sentiment Analyzer Service
// Analyzes brand sentiment and web presence

export async function runSentimentAnalysis(analysisId, userId, brandName, location = '') {
  try {
    // Update status
    await pool.query(
      'UPDATE sentiment_analyses SET status = $1, updated_at = $2 WHERE id = $3',
      ['running', new Date().toISOString(), analysisId]
    );

    console.log(`Starting sentiment analysis for ${brandName}...`);

    // Get API keys
    const apiKeys = await getDecryptedAPIKeys(userId);

    if (!apiKeys.perplexity && !apiKeys.chatgpt) {
      throw new Error('Perplexity or ChatGPT API key required for sentiment analysis');
    }

    // Perform web searches
    const searchResults = await performWebSearches(brandName, location, apiKeys);

    // Analyze sentiment
    const analysis = await analyzeSentiment(brandName, searchResults, apiKeys);

    // Save results
    await pool.query(
      `UPDATE sentiment_analyses
       SET status = $1, overall_sentiment = $2, positive_aspects = $3, negative_aspects = $4,
           competitor_comparison = $5, improvement_strategies = $6, web_presence_score = $7,
           ai_visibility_strategies = $8, citation_opportunities = $9, content_topics = $10,
           industry_publications = $11, key_messages = $12, completed_at = $13, updated_at = $14
       WHERE id = $15`,
      [
        'completed',
        analysis.overallSentiment,
        JSON.stringify(analysis.positiveAspects),
        JSON.stringify(analysis.negativeAspects),
        JSON.stringify(analysis.competitorComparison),
        JSON.stringify(analysis.improvementStrategies),
        analysis.webPresenceScore,
        JSON.stringify(analysis.aiVisibilityStrategies),
        JSON.stringify(analysis.citationOpportunities),
        JSON.stringify(analysis.contentTopicsToCreate),
        JSON.stringify(analysis.industryPublications),
        JSON.stringify(analysis.keyMessagesToAmplify),
        new Date().toISOString(),
        new Date().toISOString(),
        analysisId
      ]
    );

    console.log(`Sentiment analysis ${analysisId} completed.`);

    return analysis;

  } catch (error) {
    console.error('Sentiment analysis error:', error);

    await pool.query(
      'UPDATE sentiment_analyses SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
      ['failed', error.message, new Date().toISOString(), analysisId]
    );

    throw error;
  }
}

async function performWebSearches(brandName, location, apiKeys) {
  // Enhanced queries to gather information relevant for AI visibility
  const queries = [
    `${brandName} reviews`,
    `${brandName} customer feedback`,
    `${brandName} reputation`,
    `What do people say about ${brandName}`,
    `${brandName} complaints`,
    `${brandName} vs competitors`,
    `${brandName} pros and cons`,
    `${brandName} industry awards recognition`,
    `${brandName} mentioned in news articles`,
    `${brandName} expert opinions`,
    `${brandName} case studies success stories`,
    ...(location ? [`${brandName} in ${location}`] : [])
  ];

  const results = [];

  // Use Perplexity for web searches if available (it has web search built-in)
  if (apiKeys.perplexity) {
    for (const query of queries) {
      try {
        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful research assistant. Provide factual information based on web search.'
              },
              {
                role: 'user',
                content: query
              }
            ],
            temperature: 0.2,
            max_tokens: 400
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKeys.perplexity}`,
              'Content-Type': 'application/json'
            }
          }
        );

        results.push({
          query,
          result: response.data.choices[0].message.content.trim()
        });

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Search error for "${query}":`, error.message);
        results.push({
          query,
          result: 'No results found'
        });
      }
    }
  } else {
    // Fallback: Use ChatGPT without web search (less accurate)
    for (const query of queries) {
      results.push({
        query,
        result: `Analysis for: ${query} (Limited without web search)`
      });
    }
  }

  return results;
}

async function analyzeSentiment(brandName, searchResults, apiKeys) {
  if (!apiKeys.chatgpt) {
    throw new Error('ChatGPT API key required for sentiment analysis');
  }

  const openai = new OpenAI({ apiKey: apiKeys.chatgpt });

  // Compile search results
  const compiledResults = searchResults
    .map(r => `Query: ${r.query}\nResult: ${r.result}`)
    .join('\n\n');

  const prompt = `You are an AI Visibility Strategist. Based on the following web search results about "${brandName}", provide a comprehensive analysis focused on how to improve the brand's visibility in AI model responses (ChatGPT, Claude, Gemini, Perplexity).

Search Results:
${compiledResults}

Provide analysis in the following JSON format:
{
  "overallSentiment": "positive" | "neutral" | "negative",
  "webPresenceScore": number (0-100, how strong is their web presence for AI discovery),
  "positiveAspects": ["aspect 1", "aspect 2", ...] (5-10 brand strengths that AI models might cite),
  "negativeAspects": ["aspect 1", "aspect 2", ...] (5-10 weaknesses affecting AI visibility),
  "competitorComparison": ["comparison point 1", "comparison point 2", ...] (5-8 items showing competitive positioning),
  "improvementStrategies": ["strategy 1", "strategy 2", ...] (8-10 actionable strategies),
  "aiVisibilityStrategies": {
    "contentCreation": [
      { "strategy": "string", "priority": "high|medium|low", "description": "string", "expectedImpact": "string" }
    ],
    "authorityBuilding": [
      { "strategy": "string", "priority": "high|medium|low", "description": "string", "expectedImpact": "string" }
    ],
    "onlinePresence": [
      { "strategy": "string", "priority": "high|medium|low", "description": "string", "expectedImpact": "string" }
    ],
    "technicalOptimization": [
      { "strategy": "string", "priority": "high|medium|low", "description": "string", "expectedImpact": "string" }
    ]
  },
  "citationOpportunities": [
    { "source": "string", "type": "blog|forum|news|wiki|directory", "action": "string", "priority": "high|medium|low" }
  ],
  "contentTopicsToCreate": [
    { "topic": "string", "format": "blog|guide|case-study|whitepaper|faq", "reasoning": "string" }
  ],
  "industryPublications": ["publication names where brand should try to get mentioned"],
  "keyMessagesToAmplify": ["key brand messages that should be reinforced across platforms"]
}

AI VISIBILITY IMPROVEMENT FOCUS AREAS:

1. **Content Creation for AI Visibility**
   - Create comprehensive guides, FAQs, and how-to content
   - Publish original research and statistics AI can cite
   - Develop detailed product/service comparisons
   - Write thought leadership pieces with expert opinions

2. **Authority Building**
   - Get featured in industry publications and news
   - Earn backlinks from authoritative domains
   - Publish on Wikipedia (if notable enough)
   - Get listed in industry directories and comparison sites
   - Participate in industry forums and communities

3. **Online Presence Optimization**
   - Strengthen social media presence with valuable content
   - Encourage and respond to customer reviews
   - Build relationships with industry influencers
   - Create shareable content that gets referenced

4. **Technical/SEO Optimization**
   - Implement Schema.org structured data
   - Ensure AI crawlers can access content
   - Build internal linking structure
   - Optimize for featured snippets

Be specific with actionable recommendations tailored to this brand's industry and current position.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI Visibility Strategist specializing in helping brands get mentioned and cited by AI models like ChatGPT, Claude, Gemini, and Perplexity. Provide specific, actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      overallSentiment: result.overallSentiment || 'neutral',
      webPresenceScore: result.webPresenceScore || 50,
      positiveAspects: result.positiveAspects || [],
      negativeAspects: result.negativeAspects || [],
      competitorComparison: result.competitorComparison || [],
      improvementStrategies: result.improvementStrategies || [],
      aiVisibilityStrategies: result.aiVisibilityStrategies || null,
      citationOpportunities: result.citationOpportunities || [],
      contentTopicsToCreate: result.contentTopicsToCreate || [],
      industryPublications: result.industryPublications || [],
      keyMessagesToAmplify: result.keyMessagesToAmplify || []
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    throw new Error('Failed to analyze sentiment');
  }
}

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

    // Import decrypt function from apiKeys route
    const crypto = await import('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
    const ALGORITHM = 'aes-256-cbc';

    function getKey() {
      return crypto.default.createHash('sha256').update(ENCRYPTION_KEY).digest();
    }

    function decrypt(text) {
      if (!text) return null;
      try {
        const parts = text.split(':');
        if (parts.length !== 2) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.default.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        return null;
      }
    }

    // Decrypt all keys
    return {
      chatgpt: data.chatgpt_key ? decrypt(data.chatgpt_key) : null,
      claude: data.claude_key ? decrypt(data.claude_key) : null,
      gemini: data.gemini_key ? decrypt(data.gemini_key) : null,
      perplexity: data.perplexity_key ? decrypt(data.perplexity_key) : null,
      grok: data.grok_key ? decrypt(data.grok_key) : null,
    };
  } catch (error) {
    console.error('Failed to retrieve API keys:', error);
    throw new Error('Failed to retrieve API keys');
  }
}

export default { runSentimentAnalysis };
