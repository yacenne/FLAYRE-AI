// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Platform =
  | 'whatsapp'
  | 'imessage'
  | 'linkedin'
  | 'twitter'
  | 'instagram'
  | 'discord'
  | 'reddit'
  | 'slack'
  | 'telegram'
  | 'email'
  | 'unknown';

export type RelationshipType =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'romantic_interest'
  | 'partner'
  | 'family'
  | 'colleague'
  | 'boss'
  | 'subordinate'
  | 'client'
  | 'unknown';

export type ConversationMood =
  | 'casual'
  | 'serious'
  | 'tense'
  | 'playful'
  | 'professional'
  | 'intimate'
  | 'confrontational';

export type VisualContentType = 'image' | 'gif' | 'meme' | 'sticker' | 'emoji_combo' | 'none';

// Input Types
export interface Message {
  sender: string;
  content: string;
  isUser: boolean;
}

export interface ConversationInput {
  rawText?: string;
  screenshotBase64?: string;
  platformHint?: Platform;
  userNameHint?: string;
}

export interface GenerateRequest {
  conversation: ConversationInput;
  userIntent: string;
  additionalContext?: string;
  generateVariations?: boolean;
}

// Analysis Types
export interface ParticipantAnalysis {
  name: string;
  apparentMood: string;
  communicationStyle: string;
  currentStance: string;
}

export interface ContextAnalysis {
  detectedPlatform: Platform;
  platformConfidence: number;
  participants: ParticipantAnalysis[];
  userIdentified: boolean;
  userName?: string;
  relationshipType: RelationshipType;
  relationshipConfidence: number;
  powerDynamic: string;
  conversationMood: ConversationMood;
  emotionalTemperature: string;
  lastMessageIntent: string;
  subtext: string;
  criticalFactors: string[];
  potentialLandmines: string[];
  opportunities: string[];
}

// Visual Types
export interface GIFSuggestion {
  url: string;
  previewUrl: string;
  title: string;
  source: 'giphy' | 'tenor';
  relevanceExplanation: string;
  emotionalMatch: string;
  riskLevel: 'safe' | 'moderate' | 'risky';
}

export interface EmojiSuggestion {
  emojis: string;
  placement: 'standalone' | 'end_of_message' | 'reaction';
  meaning: string;
}

export interface VisualSuggestions {
  recommendedType: VisualContentType;
  recommendationReason: string;
  gifSuggestions?: GIFSuggestion[];
  emojiSuggestions?: EmojiSuggestion[];
  visualOnly: boolean;
  suggestedTextWithVisual?: string;
}

// Output Types
export interface GeneratedResponse {
  responseText: string;
  reasoning: string;
  toneDescription: string;
  expectedOutcome: string;
  visualSuggestions?: VisualSuggestions;
}

export interface ResponseVariation {
  responseText: string;
  approach: string;
  tradeOff: string;
}

export interface GenerateResult {
  analysis: ContextAnalysis;
  primaryResponse: GeneratedResponse;
  variations?: ResponseVariation[];
  processingTimeMs: number;
}

// Screenshot Types
export interface ScreenshotPage {
    imageBase64: string;
    pageNumber: number;
  }
  
  export interface DetectedVisual {
    type: string;
    description: string;
    position: string;
    sender?: string;
    emotionalTone: string;
    memeTemplate?: string;
    textInImage?: string;
  }
  
  export interface ScreenshotAnalysisResult {
    extractedText: string;
    detectedVisuals: DetectedVisual[];
    pageCount: number;
    confidence: number;
  }