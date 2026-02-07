/**
 * Realistic Prompt Generator
 *
 * Generates natural, conversational prompts that match real user queries.
 * These prompts are longer, more detailed, and include specific pain points,
 * use cases, and requirements - just like actual users would type.
 */

// User personas with different styles
const PERSONAS = {
  beginner: {
    starters: [
      "I'm new to",
      "I'm just starting with",
      "I'm a beginner looking for",
      "I've never used",
      "I'm trying to learn",
      "I just started"
    ],
    concerns: [
      "easy to use",
      "beginner-friendly",
      "simple to understand",
      "not too complicated",
      "good for learning",
      "with tutorials"
    ]
  },

  professional: {
    starters: [
      "I'm a professional",
      "I work in",
      "My team needs",
      "We're looking for",
      "For my business, I need",
      "In my company, we use"
    ],
    concerns: [
      "enterprise features",
      "reliable and proven",
      "with good support",
      "scalable solution",
      "professional grade",
      "industry standard"
    ]
  },

  budget_conscious: {
    starters: [
      "I'm on a tight budget",
      "I don't want to spend too much",
      "Looking for affordable",
      "I need something cost-effective",
      "Budget-friendly options for",
      "I can't afford expensive"
    ],
    concerns: [
      "without breaking the bank",
      "good value for money",
      "affordable but quality",
      "within my budget",
      "reasonably priced",
      "free or cheap"
    ]
  },

  time_pressed: {
    starters: [
      "I don't have much time",
      "I need something quick",
      "Looking for fast",
      "I'm in a hurry to",
      "Need to get this done quickly",
      "Short on time for"
    ],
    concerns: [
      "quick to set up",
      "fast results",
      "time-saving",
      "automated",
      "efficient",
      "minimal setup"
    ]
  },

  frustrated: {
    starters: [
      "I'm frustrated with",
      "I've tried several",
      "None of the",
      "I'm tired of",
      "Fed up with",
      "Sick of dealing with"
    ],
    concerns: [
      "that actually works",
      "without issues",
      "reliable",
      "that doesn't crash",
      "with fewer bugs",
      "stable and dependable"
    ]
  }
};

// Pain points users commonly mention
const PAIN_POINTS = [
  "I don't want to spend hours figuring it out",
  "I need something that just works out of the box",
  "my current solution is too complicated",
  "I'm wasting too much time on manual work",
  "I need to automate this process",
  "the one I'm using now is too expensive",
  "I'm looking for better features",
  "I need more control over",
  "the current tool is missing important features",
  "I want something more intuitive",
  "I need better integration with my other tools",
  "I'm dealing with too many bugs",
  "customer support is terrible",
  "it's too slow for my needs",
  "I need something more reliable"
];

// Specific features users look for
const FEATURE_REQUESTS = [
  "with AI capabilities",
  "that has automation",
  "with good customer support",
  "that integrates with",
  "with cloud storage",
  "that works offline",
  "with collaboration features",
  "that's mobile-friendly",
  "with analytics and reporting",
  "that has templates",
  "with customization options",
  "that's easy to share",
  "with real-time updates",
  "that has good documentation",
  "with API access"
];

// Ways users ask for recommendations
const RECOMMENDATION_STYLES = [
  "can someone suggest",
  "what do you recommend",
  "help me find",
  "looking for recommendations on",
  "what's the best",
  "anyone know a good",
  "please suggest",
  "need advice on",
  "what should I use for",
  "which one is better for"
];

// Conversational fillers that make it natural
const CONVERSATIONAL_FILLERS = [
  "honestly",
  "to be honest",
  "preferably",
  "ideally",
  "if possible",
  "hopefully",
  "basically",
  "also",
  "and maybe",
  "or something similar"
];

/**
 * Generate a realistic conversational prompt
 */
function generateRealisticPrompt(brandInfo) {
  const { productDetails, brandName, industry } = brandInfo;

  // Pick a random persona
  const personaTypes = Object.keys(PERSONAS);
  const personaType = personaTypes[Math.floor(Math.random() * personaTypes.length)];
  const persona = PERSONAS[personaType];

  // Build the prompt parts
  const parts = [];

  // 1. Opening with persona context
  const starter = persona.starters[Math.floor(Math.random() * persona.starters.length)];
  parts.push(starter + " " + productDetails);

  // 2. Add specific pain point or need (70% of the time)
  if (Math.random() > 0.3) {
    const painPoint = PAIN_POINTS[Math.floor(Math.random() * PAIN_POINTS.length)];
    parts.push(", " + painPoint);
  }

  // 3. Add specific features needed (80% of the time)
  if (Math.random() > 0.2) {
    const numFeatures = Math.random() > 0.5 ? 2 : 1;
    const features = [];
    for (let i = 0; i < numFeatures; i++) {
      const feature = FEATURE_REQUESTS[Math.floor(Math.random() * FEATURE_REQUESTS.length)];
      if (!features.includes(feature)) {
        features.push(feature);
      }
    }

    if (features.length === 1) {
      parts.push(", I need something " + features[0]);
    } else {
      parts.push(", I need something " + features.join(" and "));
    }
  }

  // 4. Add persona-specific concern
  if (Math.random() > 0.4) {
    const concern = persona.concerns[Math.floor(Math.random() * persona.concerns.length)];
    const filler = Math.random() > 0.6
      ? CONVERSATIONAL_FILLERS[Math.floor(Math.random() * CONVERSATIONAL_FILLERS.length)]
      : "";
    parts.push(", " + filler + (filler ? " " : "") + concern);
  }

  // 5. End with recommendation request
  const recommendStyle = RECOMMENDATION_STYLES[Math.floor(Math.random() * RECOMMENDATION_STYLES.length)];
  parts.push(". " + recommendStyle.charAt(0).toUpperCase() + recommendStyle.slice(1) + " a good option?");

  return parts.join("");
}

/**
 * Generate problem-solution style prompt
 */
function generateProblemSolutionPrompt(brandInfo) {
  const { productDetails } = brandInfo;

  const problems = [
    `I'm struggling with ${productDetails}, everything I try seems too complicated. I just want something that works without a steep learning curve. Any suggestions for tools that are actually user-friendly?`,

    `Need help! I've been using generic ${productDetails} but it's not cutting it anymore. I need more advanced features, better performance, and reliable customer support. What are my best options here?`,

    `Looking for ${productDetails} that can handle my growing needs. Currently using something basic but I'm hitting limits. Need scalability, good integrations, and ideally not too expensive. What do you all recommend?`,

    `Anyone else frustrated with ${productDetails} that promise everything but deliver nothing? I need something that actually does what it says, with decent support and regular updates. Tired of switching tools every few months.`,

    `I run a small business and desperately need better ${productDetails}. Current setup is costing me too much time and money. Looking for something efficient, affordable, and that I can actually rely on. Help!`,

    `Can someone recommend ${productDetails} for a team of 5-10 people? We need collaboration features, easy onboarding, and something that doesn't require IT support to set up. Bonus if it's reasonably priced!`,

    `I'm researching ${productDetails} options for my company. We need enterprise-level features but without the enterprise price tag. Must have good security, API access, and excellent uptime. What should I look at?`,

    `Help me choose ${productDetails}! I'm comparing several options but overwhelmed with choices. Need something with great UX, powerful features, and that won't become obsolete in a year. What's actually worth it?`
  ];

  return problems[Math.floor(Math.random() * problems.length)];
}

/**
 * Generate use-case specific prompt
 */
function generateUseCasePrompt(brandInfo) {
  const { productDetails, industry } = brandInfo;

  const useCases = [
    `I want to ${productDetails} for my YouTube channel. I don't have technical skills and need something intuitive. Also looking for good templates and the ability to work quickly. What tools do content creators actually use?`,

    `Starting a new project that requires ${productDetails}. Never done this before, so need something with excellent tutorials and community support. Budget is limited but willing to pay for quality. Recommendations?`,

    `My team of 3 needs ${productDetails} for daily operations. It has to be collaborative, cloud-based, and mobile-friendly since we work remotely. We've tried free options but they're too limited. What's the sweet spot?`,

    `Looking for ${productDetails} to replace our current outdated system. Need modern features, easy migration, and training resources. It's for a 50-person company so needs to be scalable. What are the industry leaders using?`,

    `I'm a freelancer who needs reliable ${productDetails} to serve my clients better. Must be professional-looking, fast, and cost-effective since I'm paying out of pocket. What would you suggest for someone in my position?`,

    `Need ${productDetails} for an upcoming deadline. Time is super tight, so it needs to be quick to learn and produce results fast. Willing to pay premium if it saves me time. What's the fastest solution?`,

    `We're migrating from ${productDetails} to something better. Current tool is lacking features we need like automation, reporting, and integrations with Slack/Gmail. Budget is $500/month. What are our best options?`,

    `Personal project: I want to ${productDetails} as a hobby. Not looking for professional-grade but don't want toy tools either. Something in the middle - decent features, reasonable price, fun to use. Ideas?`
  ];

  return useCases[Math.floor(Math.random() * useCases.length)];
}

/**
 * Generate comparison-style prompt
 */
function generateComparisonPrompt(brandInfo) {
  const { productDetails } = brandInfo;

  const comparisons = [
    `Trying to decide between different ${productDetails} options. I need something with good automation, doesn't break the bank, and has responsive support. What are the pros and cons of the top tools in this space?`,

    `I've narrowed down to 3-4 ${productDetails} options but can't decide. All look similar on paper. What separates the good ones from the great ones? Looking for real user experiences here.`,

    `Comparing ${productDetails} tools and getting mixed reviews everywhere. Some say go premium, others say free options are enough. For a mid-sized business, what's actually worth the investment?`,

    `Need honest opinions on ${productDetails}. Marketing websites all claim to be #1, but what do actual users think? Especially interested in long-term satisfaction and whether features match promises.`,

    `Between free and paid ${productDetails}, is it worth upgrading? I'm managing fine with free tier but wondering if paid features would significantly improve my workflow. Anyone made this switch?`,

    `Looking at ${productDetails} landscape - so many options! What criteria should I use to evaluate? Feature set, pricing, support quality, or something else? Feeling paralyzed by choices here.`
  ];

  return comparisons[Math.floor(Math.random() * comparisons.length)];
}

/**
 * Generate location-based prompt
 */
function generateLocationPrompt(brandInfo) {
  const { productDetails, location } = brandInfo;

  if (!location) return null;

  const locationPrompts = [
    `Looking for ${productDetails} available in ${location}. Need local payment options, local currency support, and preferably customer service in my timezone. What works well here?`,

    `Anyone in ${location} using ${productDetails}? Wondering about shipping times, local support, and whether international options are worth the extra cost. What's your experience?`,

    `I'm in ${location} and need ${productDetails} that ships here without crazy fees. Also concerned about warranty and returns if something goes wrong. What are the reliable options for my region?`,

    `Recommendations for ${productDetails} in ${location}? Specifically need something with local presence, good delivery times, and support that understands regional needs. International brands or local better?`
  ];

  return locationPrompts[Math.floor(Math.random() * locationPrompts.length)];
}

/**
 * Generate specific scenario prompt
 */
function generateScenarioPrompt(brandInfo) {
  const { productDetails } = brandInfo;

  const scenarios = [
    `Here's my situation: I need ${productDetails} but have zero experience with this. I'm willing to learn but don't have weeks to spend on training. Need something I can get productive with in a day or two. Possible?`,

    `Context: Small startup, tight budget, big ambitions. We need ${productDetails} that can grow with us. Can't afford enterprise solutions yet but need more than basic consumer tools. What bridges that gap?`,

    `My use case: I work with ${productDetails} about 2-3 times a week, not daily. So I need something intuitive enough that I don't forget how to use it between sessions. Also not looking to spend $100/month for occasional use. Options?`,

    `Quick background: Been disappointed by ${productDetails} multiple times. Features look great in demos but real-world usage is clunky. This time I want to hear from long-term users - what actually lives up to the hype?`,

    `Specific need: ${productDetails} that integrates seamlessly with my existing workflow (Notion, Slack, Google Workspace). I've wasted too much time on tools that promise integration but it's half-baked. What actually works well?`,

    `Real talk: I need ${productDetails} for client work. It has to look professional, work flawlessly, and have zero learning curve for clients. Can't afford to look incompetent. What do pros actually use?`
  ];

  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

/**
 * Main function: Generate diverse realistic prompts
 */
export function generateRealisticPrompts(brandInfo, count = 100) {
  const prompts = [];

  // Distribution of prompt types
  const distribution = {
    realistic: 0.35,        // 35% - Realistic conversational
    problemSolution: 0.25,  // 25% - Problem-solution format
    useCase: 0.20,          // 20% - Use-case specific
    comparison: 0.10,       // 10% - Comparison queries
    location: 0.05,         // 5% - Location-based (if applicable)
    scenario: 0.05          // 5% - Specific scenarios
  };

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let prompt;

    if (rand < distribution.realistic) {
      prompt = generateRealisticPrompt(brandInfo);
    } else if (rand < distribution.realistic + distribution.problemSolution) {
      prompt = generateProblemSolutionPrompt(brandInfo);
    } else if (rand < distribution.realistic + distribution.problemSolution + distribution.useCase) {
      prompt = generateUseCasePrompt(brandInfo);
    } else if (rand < distribution.realistic + distribution.problemSolution + distribution.useCase + distribution.comparison) {
      prompt = generateComparisonPrompt(brandInfo);
    } else if (rand < 0.95 && brandInfo.location) {
      prompt = generateLocationPrompt(brandInfo);
      if (!prompt) prompt = generateScenarioPrompt(brandInfo); // Fallback if no location
    } else {
      prompt = generateScenarioPrompt(brandInfo);
    }

    // Add slight variations for uniqueness
    if (prompts.includes(prompt)) {
      // If duplicate, try generating again with different type
      prompt = generateRealisticPrompt(brandInfo);
    }

    prompts.push(prompt);
  }

  return prompts;
}

/**
 * Generate prompts with categories for analysis
 */
export function generateCategorizedRealisticPrompts(brandInfo, count = 100) {
  const allPrompts = generateRealisticPrompts(brandInfo, count);

  return {
    all: allPrompts,
    length: allPrompts.length,
    avgLength: Math.round(
      allPrompts.reduce((sum, p) => sum + p.length, 0) / allPrompts.length
    ),
    sample: allPrompts.slice(0, 5) // First 5 for preview
  };
}

export default {
  generateRealisticPrompts,
  generateCategorizedRealisticPrompts
};
