/**
 * TypeScript types for flayre.ai extension
 */

export enum Platform {
    WHATSAPP = 'whatsapp',
    INSTAGRAM = 'instagram',
    DISCORD = 'discord',
    UNKNOWN = 'unknown',
}

export enum ToneType {
    CASUAL = 'casual',
    PROFESSIONAL = 'professional',
    FRIENDLY = 'friendly',
    DIRECT = 'direct',
    CONFIDENT = 'confident',
}

export interface AnalyzeRequest {
    screenshot: string;
    platform?: Platform;
    context?: string;
}

export interface AnalysisContext {
    summary: string;
    tone: string;
    relationship_type: string;
    key_topics: string[];
    emotional_state: string;
    urgency_level: string;
}

export interface Participant {
    name: string;
    role: string;
}

export interface VisualElement {
    type: string;
    description: string;
    emotional_impact: string;
}

export interface AIResponse {
    id: string;
    tone: ToneType;
    content: string;
    character_count: number;
    was_copied: boolean;
}

export interface AnalyzeResponse {
    id: string;
    platform: Platform;
    context: AnalysisContext;
    visual_elements: VisualElement[];
    participants: Participant[];
    responses: AIResponse[];
    created_at: string;
}

export interface UsageInfo {
    analyses_used: number;
    analyses_limit: number;
    analyses_remaining: number;
    is_pro: boolean;
    plan_type: string;
    reset_date: string;
}

export class APIError extends Error {
    detail: string;
    status?: number;

    constructor(detail: string, status?: number) {
        super(detail);
        this.name = 'APIError';
        this.detail = detail;
        this.status = status;
    }
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}
