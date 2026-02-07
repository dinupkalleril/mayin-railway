import { pool } from '../config/db.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

// Website Analyzer Service
// Analyzes website content for AI optimization

export async function runWebsiteScan(scanId, userId, websiteUrl) {
  try {
    // Update status
    await pool.query(
      'UPDATE website_scans SET status = $1, updated_at = $2 WHERE id = $3',
      ['running', new Date().toISOString(), scanId]
    );

    console.log(`Starting website scan for ${websiteUrl}...`);

    // Fetch website content
    const content = await fetchWebsiteContent(websiteUrl);

    // Get API keys
    const apiKeys = await getDecryptedAPIKeys(userId);

    if (!apiKeys.chatgpt && !apiKeys.claude) {
      throw new Error('ChatGPT or Claude API key required for website analysis');
    }

    // Analyze with AI
    const analysis = await analyzeWebsiteContent(content, websiteUrl, apiKeys);

    // Save results
    await pool.query(
      `UPDATE website_scans
       SET status = $1, is_ai_friendly = $2, score = $3, issues = $4, suggestions = $5,
           recommended_content = $6, ai_visibility_factors = $7, priority_actions = $8,
           content_gaps = $9, competitive_insights = $10, completed_at = $11, updated_at = $12
       WHERE id = $13`,
      [
        'completed',
        analysis.isAIFriendly,
        analysis.score,
        JSON.stringify(analysis.issues),
        JSON.stringify(analysis.suggestions),
        analysis.recommendedContent,
        JSON.stringify(analysis.aiVisibilityFactors),
        JSON.stringify(analysis.priorityActions),
        JSON.stringify(analysis.contentGaps),
        analysis.competitiveInsights,
        new Date().toISOString(),
        new Date().toISOString(),
        scanId
      ]
    );

    console.log(`Website scan ${scanId} completed. Score: ${analysis.score}/100`);

    return analysis;

  } catch (error) {
    console.error('Website scan error:', error);

    await pool.query(
      'UPDATE website_scans SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
      ['failed', error.message, new Date().toISOString(), scanId]
    );

    throw error;
  }
}

async function fetchWebsiteContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIOptimizationBot/1.0)'
      }
    });

    // Extract text content (simplified - in production use a proper HTML parser)
    let text = response.data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to first 8000 characters for analysis
    text = text.substring(0, 8000);

    return text;
  } catch (error) {
    throw new Error(`Failed to fetch website: ${error.message}`);
  }
}

async function analyzeWebsiteContent(content, url, apiKeys) {
  const apiKey = apiKeys.chatgpt || apiKeys.claude;

  if (apiKeys.chatgpt) {
    return await analyzeWithOpenAI(content, url, apiKeys.chatgpt);
  } else {
    return await analyzeWithClaude(content, url, apiKeys.claude);
  }
}

async function analyzeWithOpenAI(content, url, apiKey) {
  const openai = new OpenAI({ apiKey });

  const prompt = `You are an AI Visibility Optimization Expert. Analyze this website for how well it can be discovered and cited by AI models like ChatGPT, Claude, Gemini, and Perplexity.

Website: ${url}

Content:
${content}

Provide a comprehensive analysis in the following JSON format:
{
  "isAIFriendly": boolean,
  "score": number (0-100),
  "issues": ["issue 1", "issue 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "recommendedContent": "specific content to add",
  "aiVisibilityFactors": {
    "structuredData": { "score": number (0-100), "issues": [], "recommendations": [] },
    "contentClarity": { "score": number (0-100), "issues": [], "recommendations": [] },
    "authoritySignals": { "score": number (0-100), "issues": [], "recommendations": [] },
    "citableContent": { "score": number (0-100), "issues": [], "recommendations": [] },
    "technicalAccessibility": { "score": number (0-100), "issues": [], "recommendations": [] }
  },
  "priorityActions": [
    { "action": "string", "impact": "high|medium|low", "effort": "easy|medium|hard", "description": "string" }
  ],
  "contentGaps": ["topics or content types missing that would help AI visibility"],
  "competitiveInsights": "what competitors might be doing better for AI visibility"
}

CRITICAL FACTORS FOR AI VISIBILITY:

1. **Structured Data & Schema Markup**
   - Does it use Schema.org markup (Organization, Product, FAQ, HowTo)?
   - Are entities clearly defined for AI understanding?
   - Is there JSON-LD structured data?

2. **Content Clarity & Factual Density**
   - Clear, factual statements that AI can quote
   - Statistics, numbers, and verifiable claims
   - Definitions and explanations AI can reference
   - Well-structured headings (H1, H2, H3 hierarchy)

3. **Authority Signals**
   - Author credentials and expertise signals
   - Citations and references to authoritative sources
   - Industry certifications, awards mentioned
   - "About Us" with company history and expertise

4. **Citable Content**
   - Unique insights, research, or data
   - Expert quotes and opinions
   - Case studies with specific results
   - Original statistics or surveys

5. **Technical Accessibility for AI Crawlers**
   - Is content accessible (not behind paywalls/logins)?
   - Does it allow AI crawlers (GPTBot, Claude-Web, Google-Extended)?
   - Are there sitemaps and proper internal linking?
   - Is the content regularly updated?

6. **Entity Recognition**
   - Is the brand name consistently mentioned?
   - Are products/services clearly named and described?
   - Is there a clear value proposition AI can extract?

Be specific and actionable. Focus on what will actually help this brand get mentioned in AI responses.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI Visibility Optimization Expert specializing in helping brands get mentioned and cited by AI models like ChatGPT, Claude, Gemini, and Perplexity. Provide actionable, specific recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      isAIFriendly: result.isAIFriendly,
      score: result.score,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      recommendedContent: result.recommendedContent || 'No specific recommendations',
      aiVisibilityFactors: result.aiVisibilityFactors || null,
      priorityActions: result.priorityActions || [],
      contentGaps: result.contentGaps || [],
      competitiveInsights: result.competitiveInsights || ''
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze website content');
  }
}

async function analyzeWithClaude(content, url, apiKey) {
  const anthropic = new Anthropic({ apiKey });

  const prompt = `You are an AI Visibility Optimization Expert. Analyze this website for how well it can be discovered and cited by AI models like ChatGPT, Claude, Gemini, and Perplexity.

Website: ${url}

Content:
${content}

Provide a comprehensive analysis in the following JSON format:
{
  "isAIFriendly": boolean,
  "score": number (0-100),
  "issues": ["issue 1", "issue 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "recommendedContent": "specific content to add",
  "aiVisibilityFactors": {
    "structuredData": { "score": number (0-100), "issues": [], "recommendations": [] },
    "contentClarity": { "score": number (0-100), "issues": [], "recommendations": [] },
    "authoritySignals": { "score": number (0-100), "issues": [], "recommendations": [] },
    "citableContent": { "score": number (0-100), "issues": [], "recommendations": [] },
    "technicalAccessibility": { "score": number (0-100), "issues": [], "recommendations": [] }
  },
  "priorityActions": [
    { "action": "string", "impact": "high|medium|low", "effort": "easy|medium|hard", "description": "string" }
  ],
  "contentGaps": ["topics or content types missing that would help AI visibility"],
  "competitiveInsights": "what competitors might be doing better for AI visibility"
}

CRITICAL FACTORS FOR AI VISIBILITY:
1. Structured Data & Schema Markup (Schema.org, JSON-LD)
2. Content Clarity & Factual Density (quotable facts, statistics)
3. Authority Signals (credentials, certifications, awards)
4. Citable Content (unique research, case studies, expert insights)
5. Technical Accessibility (AI crawler access, sitemaps)
6. Entity Recognition (brand/product clarity)

Return ONLY valid JSON. Be specific and actionable.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const resultText = response.content[0].text;
    // Extract JSON from response (Claude might include some text around it)
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    const result = JSON.parse(jsonMatch[0]);

    return {
      isAIFriendly: result.isAIFriendly,
      score: result.score,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      recommendedContent: result.recommendedContent || 'No specific recommendations',
      aiVisibilityFactors: result.aiVisibilityFactors || null,
      priorityActions: result.priorityActions || [],
      contentGaps: result.contentGaps || [],
      competitiveInsights: result.competitiveInsights || ''
    };
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw new Error('Failed to analyze website content with Claude');
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
    };
  } catch (error) {
    console.error('Failed to retrieve API keys:', error);
    throw new Error('Failed to retrieve API keys');
  }
}

export default { runWebsiteScan };
