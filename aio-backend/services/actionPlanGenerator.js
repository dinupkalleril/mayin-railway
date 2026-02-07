import { pool } from '../config/db.js';
import OpenAI from 'openai';

// Action Plan Generator Service
// Combines insights from visibility scans, website analysis, and sentiment analysis
// to create a unified AI visibility improvement plan

export async function generateActionPlan(userId, brandName) {
  try {
    // Get API keys
    const apiKeys = await getDecryptedAPIKeys(userId);

    if (!apiKeys.chatgpt) {
      throw new Error('ChatGPT API key required for action plan generation');
    }

    // Gather all data from previous scans
    const data = await gatherInsights(userId, brandName);

    // Generate comprehensive action plan
    const actionPlan = await createActionPlan(data, brandName, apiKeys.chatgpt);

    return actionPlan;

  } catch (error) {
    console.error('Action plan generation error:', error);
    throw error;
  }
}

async function gatherInsights(userId, brandName) {
  const insights = {
    visibilityScans: [],
    websiteScans: [],
    sentimentAnalysis: null
  };

  // Get latest visibility scans (one per AI model)
  const visibilityResult = await pool.query(
    `SELECT DISTINCT ON (ai_model) *
     FROM visibility_scans
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY ai_model, created_at DESC`,
    [userId]
  );
  insights.visibilityScans = visibilityResult.rows;

  // Get latest website scan
  const websiteResult = await pool.query(
    `SELECT * FROM website_scans
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (websiteResult.rows.length > 0) {
    insights.websiteScans = websiteResult.rows;
  }

  // Get latest sentiment analysis
  const sentimentResult = await pool.query(
    `SELECT * FROM sentiment_analyses
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (sentimentResult.rows.length > 0) {
    insights.sentimentAnalysis = sentimentResult.rows[0];
  }

  return insights;
}

async function createActionPlan(data, brandName, apiKey) {
  const openai = new OpenAI({ apiKey });

  // Compile visibility scan data
  const visibilityData = data.visibilityScans.map(scan => ({
    aiModel: scan.ai_model,
    modelVersion: scan.model_version,
    score: scan.score,
    mentionedCount: scan.mentioned_count,
    promptCount: scan.prompt_count,
    competitors: scan.competitors
  }));

  // Compile website scan data
  const websiteData = data.websiteScans.length > 0 ? {
    url: data.websiteScans[0].website_url,
    score: data.websiteScans[0].score,
    isAIFriendly: data.websiteScans[0].is_ai_friendly,
    issues: data.websiteScans[0].issues,
    suggestions: data.websiteScans[0].suggestions,
    aiVisibilityFactors: data.websiteScans[0].ai_visibility_factors,
    priorityActions: data.websiteScans[0].priority_actions,
    contentGaps: data.websiteScans[0].content_gaps
  } : null;

  // Compile sentiment data
  const sentimentData = data.sentimentAnalysis ? {
    sentiment: data.sentimentAnalysis.overall_sentiment,
    webPresenceScore: data.sentimentAnalysis.web_presence_score,
    positiveAspects: data.sentimentAnalysis.positive_aspects,
    negativeAspects: data.sentimentAnalysis.negative_aspects,
    aiVisibilityStrategies: data.sentimentAnalysis.ai_visibility_strategies,
    citationOpportunities: data.sentimentAnalysis.citation_opportunities,
    contentTopics: data.sentimentAnalysis.content_topics,
    industryPublications: data.sentimentAnalysis.industry_publications
  } : null;

  const prompt = `You are an AI Visibility Strategy Consultant. Based on the comprehensive analysis data below for "${brandName}", create a prioritized action plan to improve the brand's visibility in AI model responses.

## ANALYSIS DATA

### Visibility Scan Results (How often brand is mentioned by AI models):
${JSON.stringify(visibilityData, null, 2)}

### Website Analysis Results:
${websiteData ? JSON.stringify(websiteData, null, 2) : 'No website scan data available'}

### Sentiment & Online Presence Analysis:
${sentimentData ? JSON.stringify(sentimentData, null, 2) : 'No sentiment analysis data available'}

## OUTPUT FORMAT

Create a comprehensive action plan in the following JSON format:
{
  "overallAssessment": {
    "currentVisibilityScore": number (0-100, weighted average),
    "potentialScore": number (0-100, estimated after improvements),
    "urgencyLevel": "critical|high|medium|low",
    "summary": "2-3 sentence assessment"
  },
  "strengthsToLeverage": [
    { "strength": "string", "howToLeverage": "string" }
  ],
  "criticalGaps": [
    { "gap": "string", "impact": "high|medium|low", "solution": "string" }
  ],
  "immediateActions": [
    {
      "action": "string",
      "category": "content|technical|authority|presence",
      "priority": 1-5,
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "timeline": "string (e.g., '1-2 weeks')",
      "details": "string",
      "expectedOutcome": "string"
    }
  ],
  "shortTermStrategy": {
    "timeline": "1-3 months",
    "goals": ["goal 1", "goal 2"],
    "actions": [
      {
        "action": "string",
        "category": "content|technical|authority|presence",
        "details": "string",
        "milestones": ["milestone 1", "milestone 2"]
      }
    ]
  },
  "longTermStrategy": {
    "timeline": "3-12 months",
    "goals": ["goal 1", "goal 2"],
    "actions": [
      {
        "action": "string",
        "category": "content|technical|authority|presence",
        "details": "string"
      }
    ]
  },
  "contentPlan": {
    "immediateContent": [
      { "type": "blog|guide|case-study|faq|whitepaper", "topic": "string", "purpose": "string" }
    ],
    "ongoingContent": [
      { "type": "string", "frequency": "string", "topics": ["topic 1", "topic 2"] }
    ]
  },
  "authorityBuildingPlan": {
    "targetPublications": ["publication 1", "publication 2"],
    "targetDirectories": ["directory 1", "directory 2"],
    "partnershipOpportunities": ["opportunity 1", "opportunity 2"],
    "socialProofActions": ["action 1", "action 2"]
  },
  "technicalChecklist": [
    { "item": "string", "status": "needed|partial|complete", "priority": "high|medium|low" }
  ],
  "kpisToTrack": [
    { "metric": "string", "currentValue": "string", "targetValue": "string", "timeframe": "string" }
  ],
  "modelSpecificRecommendations": {
    "chatgpt": ["recommendation 1", "recommendation 2"],
    "claude": ["recommendation 1", "recommendation 2"],
    "gemini": ["recommendation 1", "recommendation 2"],
    "perplexity": ["recommendation 1", "recommendation 2"]
  }
}

IMPORTANT GUIDELINES:
1. Prioritize actions by impact vs effort (quick wins first)
2. Be specific and actionable - no vague recommendations
3. Consider the brand's current position when setting expectations
4. Focus on sustainable, long-term improvements
5. Include both technical and content strategies
6. Provide model-specific recommendations since different AI models have different training data sources`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s backend safety timeout
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI Visibility Strategy Consultant specializing in helping brands get mentioned and cited by AI models. Create actionable, prioritized plans based on comprehensive analysis data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    }, { signal: controller.signal });
    clearTimeout(timeout);

    const result = JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      brandName,
      generatedAt: new Date().toISOString(),
      dataUsed: {
        visibilityScans: data.visibilityScans.length,
        websiteScans: data.websiteScans.length,
        sentimentAnalysis: data.sentimentAnalysis ? 1 : 0
      },
      plan: result
    };

  } catch (error) {
    console.error('Action plan generation error:', error);
    throw new Error('Failed to generate action plan');
  }
}

async function getDecryptedAPIKeys(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('No API keys found');
    }

    const data = result.rows[0];

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

export default { generateActionPlan };
