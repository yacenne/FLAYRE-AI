// ============================================================================
// flayre.ai - Type Definitions
// ============================================================================

export type Platform =
  | 'whatsapp'
  | 'instagram'
  | 'discord'
  | 'telegram'
  | 'imessage'
  | 'other';

export type ToneType = 'warm' | 'direct' | 'playful';

// Analysis Types
export interface AnalysisContext {
  summary: string;
  tone: string;
  relationship_type?: string;
  key_topics?: string[];
  emotional_state?: string;
  urgency_level?: string;
}

export interface AIResponse {
  id: string;
  tone: string;
  content: string;
  character_count: number;
  was_copied?: boolean;
}

export interface AnalyzeRequest {
  screenshot: string; // Base64 encoded screenshot without data URL prefix
  platform?: Platform | string;
  context?: string;
}

export interface AnalyzeResponse {
  id: string;
  platform: Platform | string;
  context: AnalysisContext;
  responses: AIResponse[];
  created_at: string;
}

export interface UsageInfo {
  analyses_used: number;
  analyses_limit: number;
  analyses_remaining: number;
}

// Conversation History Types
export interface Conversation {
  id: string;
  platform: string;
  context_summary?: string;
  detected_tone?: string;
  relationship_type?: string;
  created_at: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
  page: number;
  per_page: number;
  total_pages?: number;
  has_more?: boolean;
}

// Billing & Subscription Types
export interface SubscriptionInfo {
  plan_type: string;
  is_pro: boolean;
  usage: UsageInfo;
}

export interface CreateOrderRequest {
  plan: 'pro' | string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  plan: string;
  note?: string;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}