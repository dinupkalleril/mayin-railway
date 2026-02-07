// Prompt Generator Service
// Generates diverse prompts to test brand visibility

export function generatePrompts(brandInfo, count = 100) {
  const { brandName, productDetails, location } = brandInfo;

  const prompts = [];

  // Template categories
  const templates = [
    // Direct recommendation queries
    `What are the best ${productDetails} brands?`,
    `Which ${productDetails} brand should I choose?`,
    `Top ${productDetails} companies to consider`,
    `Best ${productDetails} brands for quality`,
    `Recommended ${productDetails} brands`,

    // Comparison queries
    `Compare top ${productDetails} brands`,
    `Which ${productDetails} brand offers best value?`,
    `${productDetails} brand comparison`,
    `Best ${productDetails} brands vs competitors`,

    // Use case specific
    `Best ${productDetails} for beginners`,
    `Professional ${productDetails} brands`,
    `Affordable ${productDetails} brands`,
    `Premium ${productDetails} brands`,
    `Budget-friendly ${productDetails} options`,

    // Location-based (if provided)
    ...(location ? [
      `Best ${productDetails} brands in ${location}`,
      `Top ${productDetails} companies in ${location}`,
      `${productDetails} brands available in ${location}`,
      `Which ${productDetails} brand to buy in ${location}`,
      `Popular ${productDetails} brands in ${location}`
    ] : []),

    // Problem-solving queries
    `Which ${productDetails} brand is most reliable?`,
    `Durable ${productDetails} brands`,
    `Long-lasting ${productDetails} options`,
    `Best reviewed ${productDetails} brands`,
    `Trusted ${productDetails} manufacturers`,

    // Shopping intent
    `Where to buy ${productDetails}?`,
    `Best place to purchase ${productDetails}`,
    `${productDetails} shopping guide`,
    `How to choose ${productDetails}`,

    // Feature-based
    `${productDetails} with best features`,
    `Most innovative ${productDetails} brands`,
    `${productDetails} with latest technology`,
    `High-performance ${productDetails} brands`,

    // Reviews and ratings
    `Highest rated ${productDetails} brands`,
    `${productDetails} customer reviews`,
    `Best ${productDetails} according to experts`,
    `Top-rated ${productDetails} companies`,

    // Price-based
    `${productDetails} price comparison`,
    `Affordable yet quality ${productDetails}`,
    `Best value ${productDetails} brands`,
    `${productDetails} for different budgets`,

    // Year/trend based
    `Best ${productDetails} in 2024`,
    `Trending ${productDetails} brands`,
    `Latest ${productDetails} releases`,
    `Popular ${productDetails} this year`,

    // Specific use cases
    `${productDetails} for daily use`,
    `Commercial ${productDetails} brands`,
    `${productDetails} for small businesses`,
    `${productDetails} for personal use`,

    // Alternative queries
    `Alternatives to popular ${productDetails}`,
    `Lesser-known ${productDetails} brands`,
    `Emerging ${productDetails} companies`,
    `New ${productDetails} brands to watch`
  ];

  // Add variations with slight modifications
  const variations = [];

  templates.forEach(template => {
    variations.push(template);
    variations.push(template + '?');
    variations.push(template.replace('best', 'top'));
    variations.push(template.replace('brand', 'company'));
    variations.push(template.replace('brands', 'companies'));
  });

  // Remove duplicates
  const uniquePrompts = [...new Set(variations)];

  // Shuffle array
  for (let i = uniquePrompts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniquePrompts[i], uniquePrompts[j]] = [uniquePrompts[j], uniquePrompts[i]];
  }

  // If we need more prompts, add slight variations
  while (uniquePrompts.length < count) {
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const variation = randomTemplate
      .replace('best', ['top', 'leading', 'premier', 'excellent'][Math.floor(Math.random() * 4)])
      .replace('brands', ['companies', 'manufacturers', 'providers'][Math.floor(Math.random() * 3)]);

    if (!uniquePrompts.includes(variation)) {
      uniquePrompts.push(variation);
    }
  }

  // Return exact count requested
  return uniquePrompts.slice(0, count);
}

// Generate prompts with different intent types
export function generateCategorizedPrompts(brandInfo, count = 100) {
  const prompts = generatePrompts(brandInfo, count);

  // Categorize prompts
  const categorized = {
    recommendation: [],
    comparison: [],
    review: [],
    purchase: [],
    feature: [],
    location: []
  };

  prompts.forEach(prompt => {
    const lower = prompt.toLowerCase();

    if (lower.includes('recommend') || lower.includes('should i') || lower.includes('which')) {
      categorized.recommendation.push(prompt);
    } else if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
      categorized.comparison.push(prompt);
    } else if (lower.includes('review') || lower.includes('rated') || lower.includes('rating')) {
      categorized.review.push(prompt);
    } else if (lower.includes('buy') || lower.includes('purchase') || lower.includes('where')) {
      categorized.purchase.push(prompt);
    } else if (lower.includes('feature') || lower.includes('technology') || lower.includes('performance')) {
      categorized.feature.push(prompt);
    } else if (brandInfo.location && lower.includes(brandInfo.location.toLowerCase())) {
      categorized.location.push(prompt);
    } else {
      categorized.recommendation.push(prompt); // default category
    }
  });

  return categorized;
}

export default { generatePrompts, generateCategorizedPrompts };
