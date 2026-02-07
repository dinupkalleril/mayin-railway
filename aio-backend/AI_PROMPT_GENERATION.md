# AI-Powered Prompt Generation

## The Problem with Old Prompts

### ❌ **What Was Wrong:**

```
OLD PROMPT: "What are the best Descript alternatives?"
          ↑ MENTIONS BRAND NAME - No real user asks this!

OLD PROMPT: "Looking for Descript AI video editing software..."
          ↑ MENTIONS BRAND NAME - Totally unrealistic!
```

**Real users DON'T know your brand yet** - they're searching for solutions to their problems!

## ✅ **The New Approach: AI-Generated Prompts**

### **How It Works:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. YOUR BRAND INFO                                         │
│     - Product: AI video editing software                     │
│     - Industry: SaaS                                         │
│     - Tagline: Video editing as easy as editing documents   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GPT-4o GENERATES REALISTIC QUERIES                      │
│     (Without mentioning your brand name!)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. TEST ALL AI MODELS                                      │
│     - ChatGPT, Claude, Gemini, Perplexity                   │
│     - Each model responds to the realistic query             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CHECK IF YOUR BRAND IS MENTIONED                        │
│     - Did the AI naturally recommend your brand?             │
│     - This is TRUE visibility!                               │
└─────────────────────────────────────────────────────────────┘
```

### **Example AI-Generated Prompts:**

```
✅ "I need video editing software for my YouTube channel. I don't have
   technical skills and want something with AI automation for captions
   and cuts. Also need templates and ability to work quickly. Budget
   is around $50/month. What do content creators actually use?"

✅ "Looking for video editing tool that's beginner-friendly. Current
   setup is too complicated - takes me hours to edit a 10-minute video.
   Need something fast with AI features and good tutorials. Running a
   small business so can't afford enterprise pricing. Suggestions?"

✅ "Help! I'm a freelancer doing video editing for clients. Need
   professional-looking software that's fast, reliable, and has
   collaboration features. Must be easy for clients to review and
   approve. What tools do pros actually use without breaking the bank?"
```

**Notice:** ❌ NO brand name mentioned! These are real user queries!

## Why This Is Better

### **Old Approach Problems:**

| Issue | Impact |
|-------|--------|
| ❌ Brand name in prompt | Unrealistic - users don't search this way |
| ❌ Short, robotic queries | AI responses are generic |
| ❌ No context | Doesn't match real user behavior |
| ❌ Template-based | Same patterns every time |

### **New Approach Benefits:**

| Feature | Impact |
|---------|--------|
| ✅ AI-generated | Truly realistic queries |
| ✅ No brand mentions | Tests natural recommendations |
| ✅ Conversational | Matches real user language |
| ✅ Context-rich | Includes pain points, needs, budget |
| ✅ Varied personas | Beginners, pros, businesses, etc. |
| ✅ Consistent | Same quality across all scans |

## How It Works in Your Scans

### **Before (Old Method):**

```javascript
Prompt: "Best AI video editing software brands"
        ↓
ChatGPT: "Here are top video editing tools:
          1. Adobe Premiere Pro
          2. Final Cut Pro
          3. DaVinci Resolve
          ..."
        ↓
Your Brand: Not mentioned ❌
Visibility Score: Low (even if your product is great!)
```

### **After (AI-Generated):**

```javascript
Prompt: "I'm a YouTuber looking for video editing software.
         I want AI automation for captions, easy interface,
         and templates. Budget $50/month. Recommendations?"
        ↓
ChatGPT: "Based on your needs, I'd suggest:
          1. Descript - Great AI features, podcast-to-video...
          2. Runway - Creative AI tools...
          ..."
        ↓
Your Brand: Mentioned! ✅
Visibility Score: Higher (reflects real visibility!)
```

## Setup

### **1. API Key Required**

The system uses your **OpenAI API key** to generate prompts with GPT-4o.

```env
# Add to your .env file
OPENAI_API_KEY=sk-...
```

**Why GPT-4o?**
- Most advanced model for natural language
- Generates truly realistic queries
- Understands user behavior patterns
- Consistent quality

### **2. How Prompts Are Generated**

```javascript
// In visibilityScanner.js
const prompts = await generatePromptsWithAI(
  brandInfo,     // Your brand details
  100,          // Number of prompts
  chatgptApiKey // Your OpenAI API key
);

// Validates prompts don't mention brand
const validPrompts = validatePrompts(prompts, brandName);
```

### **3. Fallback System**

If AI generation fails (API issues, rate limits, etc.), system automatically falls back to static realistic prompts.

```
AI Generation (GPT-4o) → Success ✓
           ↓
       Use AI prompts

AI Generation → Failed ✗
           ↓
    Fallback to static prompts
    (Still better than old templates!)
```

## Testing the New Prompts

### **Quick Test:**

```bash
node test-ai-prompts.js
```

**What it shows:**
- 10 sample AI-generated prompts
- Verification that no brand names appear
- Length statistics
- Quality indicators

**Example output:**
```
1. I need video editing software for my startup. We're creating
   promotional videos weekly and current tool is too slow. Need
   AI automation, templates, and team collaboration. Budget-conscious
   but willing to pay for quality. What's good for small teams?

   Length: 187 chars
   ✓ No brand mention (good!)
```

## Cost Considerations

### **Prompt Generation Cost:**

- **Model:** GPT-4o
- **Per 100 prompts:** ~$0.15 - $0.30
- **Frequency:** Once per scan (cached for 1 hour)

**Example:**
- 1 scan/day with 100 prompts = $9/month
- 5 scans/day with 100 prompts = $45/month

**Worth it?** ✅ **YES!**
- Much more accurate visibility scores
- Reflects real-world brand awareness
- One-time cost per scan (results cached)
- Validates if marketing is working

### **Optimization:**

```javascript
// Prompts are cached for 1 hour
generatePromptsWithAICached(brandInfo, count, apiKey)

// Multiple scans in same hour = reuse prompts
// No extra API cost!
```

## How Caching Works

```
First Scan (10 AM):
├─ Generate prompts with GPT-4o ($0.20)
├─ Cache prompts
└─ Run visibility scan

Second Scan (10:30 AM):
├─ Use cached prompts ($0.00) ✓
└─ Run visibility scan

Third Scan (11:15 AM):
├─ Cache expired (>1 hour)
├─ Generate new prompts ($0.20)
└─ Run visibility scan
```

## Advanced: Customizing Prompt Generation

### **Adjust Temperature:**

```javascript
// In aiPromptGenerator.js
temperature: 0.9  // Higher = more variety
temperature: 0.7  // Lower = more consistent
```

### **Change Model:**

```javascript
model: 'gpt-4o'      // Best quality
model: 'gpt-4-turbo' // Faster, cheaper
model: 'gpt-4o-mini' // Cheapest
```

### **Batch Size:**

```javascript
const batchSize = 20  // Generate 20 prompts at once
const batchSize = 50  // More prompts per request (faster)
```

## Validation

Every prompt is validated to ensure:

1. ✅ **No brand name mentioned**
2. ✅ **Minimum length (30 characters)**
3. ✅ **Natural language**
4. ✅ **Conversational tone**

**Automatic filtering:**
```javascript
const validPrompts = validatePrompts(prompts, brandName);
// Removes any prompts mentioning the brand
```

## Why This Matters

### **Real Visibility = Brand Mentioned Naturally**

```
User asks: "I need project management software for remote teams"
AI responds: "I recommend Asana, Monday.com, ClickUp..."
```

**If your brand appears in that response → TRUE VISIBILITY ✅**

**If your brand doesn't appear → LOW VISIBILITY ❌**

This is what matters for your marketing:
- Are people finding you organically?
- Do AI models recommend you?
- Is your SEO/content working?

## Summary

### **Old Method:**
- ❌ Unrealistic prompts
- ❌ Mentioned brand name
- ❌ Low-quality results
- ❌ Didn't reflect reality

### **New Method (AI-Generated):**
- ✅ Realistic user queries
- ✅ No brand mentions
- ✅ Tests natural recommendations
- ✅ Accurate visibility scores
- ✅ Generated by GPT-4o
- ✅ Cached for performance
- ✅ Validates quality

**Cost:** ~$0.20 per 100 prompts (cached for 1 hour)

**Result:** True measure of your brand's AI visibility! 🎯
