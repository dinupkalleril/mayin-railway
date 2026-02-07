// Core Types for AI Optimization Tool

export type AIModel = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'grok';

export interface LicenseData {
  licenseKey: string;
  isValid: boolean;
  activatedAt: string | null;
}

export interface UserAuth {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface APIKeys {
  chatgpt?: string;
  claude?: string;
  gemini?: string;
  perplexity?: string;
  grok?: string;
}

export interface BrandInfo {
  id: string;
  brandName: string;
  tagline?: string;
  productDetails: string;
  websiteUrl: string;
  location: string;
}

export interface VisibilityScanResult {
  id: string;
  aiModel: AIModel;
  brandInfo: BrandInfo;
  score: number;
  totalPrompts: number;
  mentionedCount: number;
  competitors: CompetitorMention[];
  prompts: PromptResult[];
  createdAt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface CompetitorMention {
  name: string;
  mentions: number;
}

export interface PromptResult {
  prompt: string;
  answer: string;
  mentioned: boolean;
}

export interface WebsiteScanResult {
  id: string;
  websiteUrl: string;
  isAIFriendly: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  recommendedContent: string;
  createdAt: string;
}

export interface SentimentAnalysisResult {
  id: string;
  brandName: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  positiveAspects: string[];
  negativeAspects: string[];
  competitorComparison: string[];
  improvementStrategies: string[];
  webPresenceScore: number;
  createdAt: string;
}

export interface SetupState {
  licenseActivated: boolean;
  userCreated: boolean;
  apiKeysConfigured: boolean;
  isComplete: boolean;
}
