// ============================================================================
// API CLIENT - Communicates with backend
// ============================================================================

import type { GenerateRequest, GenerateResult, ConversationInput, ContextAnalysis, Message } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIClient {
  private baseUrl = API_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    // Transform camelCase to snake_case for API
    const payload = {
      conversation: {
        raw_text: request.conversation.rawText,
        screenshot_base64: request.conversation.screenshotBase64,
        platform_hint: request.conversation.platformHint,
        user_name_hint: request.conversation.userNameHint,
      },
      user_intent: request.userIntent,
      additional_context: request.additionalContext,
      generate_variations: request.generateVariations,
    };

    const result = await this.request<any>('/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return this.transformResult(result);
  }

  async analyzeOnly(conversation: ConversationInput): Promise<{
    messages: Message[];
    analysis: ContextAnalysis;
  }> {
    const payload = {
      raw_text: conversation.rawText,
      screenshot_base64: conversation.screenshotBase64,
      platform_hint: conversation.platformHint,
      user_name_hint: conversation.userNameHint,
    };

    const result = await this.request<any>('/generate/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      messages: result.messages.map((m: any) => ({
        sender: m.sender,
        content: m.content,
        isUser: m.is_user,
      })),
      analysis: this.transformAnalysis(result.analysis),
    };
  }

  private transformResult(result: any): GenerateResult {
    return {
      analysis: this.transformAnalysis(result.analysis),
      primaryResponse: {
        responseText: result.primary_response.response_text,
        reasoning: result.primary_response.reasoning,
        toneDescription: result.primary_response.tone_description,
        expectedOutcome: result.primary_response.expected_outcome,
        visualSuggestions: result.primary_response.visual_suggestions
          ? {
              recommendedType: result.primary_response.visual_suggestions.recommended_type,
              recommendationReason: result.primary_response.visual_suggestions.recommendation_reason,
              gifSuggestions: result.primary_response.visual_suggestions.gif_suggestions?.map((g: any) => ({
                url: g.url,
                previewUrl: g.preview_url,
                title: g.title,
                source: g.source,
                relevanceExplanation: g.relevance_explanation,
                emotionalMatch: g.emotional_match,
                riskLevel: g.risk_level,
              })),
              emojiSuggestions: result.primary_response.visual_suggestions.emoji_suggestions?.map((e: any) => ({
                emojis: e.emojis,
                placement: e.placement,
                meaning: e.meaning,
              })),
              visualOnly: result.primary_response.visual_suggestions.visual_only,
              suggestedTextWithVisual: result.primary_response.visual_suggestions.suggested_text_with_visual,
            }
          : undefined,
      },
      variations: result.variations?.map((v: any) => ({
        responseText: v.response_text,
        approach: v.approach,
        tradeOff: v.trade_off,
      })),
      processingTimeMs: result.processing_time_ms,
    };
  }

  private transformAnalysis(analysis: any): ContextAnalysis {
    return {
      detectedPlatform: analysis.detected_platform,
      platformConfidence: analysis.platform_confidence,
      participants: analysis.participants?.map((p: any) => ({
        name: p.name,
        apparentMood: p.apparent_mood,
        communicationStyle: p.communication_style,
        currentStance: p.current_stance,
      })) || [],
      userIdentified: analysis.user_identified,
      userName: analysis.user_name,
      relationshipType: analysis.relationship_type,
      relationshipConfidence: analysis.relationship_confidence,
      powerDynamic: analysis.power_dynamic,
      conversationMood: analysis.conversation_mood,
      emotionalTemperature: analysis.emotional_temperature,
      lastMessageIntent: analysis.last_message_intent,
      subtext: analysis.subtext,
      criticalFactors: analysis.critical_factors || [],
      potentialLandmines: analysis.potential_landmines || [],
      opportunities: analysis.opportunities || [],
    };
  }

    // Add to APIClient class:

    async analyzeScreenshots(
        pages: { imageBase64: string; pageNumber: number }[],
        platformHint?: string,
        userNameHint?: string
      ): Promise<any> {
        const payload = {
          pages: pages.map(p => ({
            image_base64: p.imageBase64,
            page_number: p.pageNumber
          })),
          platform_hint: platformHint,
          user_name_hint: userNameHint
        };
    
        return this.request('/screenshot/analyze', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    
      async generateFromScreenshots(
        pages: { imageBase64: string; pageNumber: number }[],
        userIntent: string,
        options?: {
          platformHint?: string;
          userNameHint?: string;
          additionalContext?: string;
          generateVariations?: boolean;
        }
      ): Promise<GenerateResult & { screenshotInfo?: any }> {
        const payload = {
          pages: pages.map(p => ({
            image_base64: p.imageBase64,
            page_number: p.pageNumber
          })),
          platform_hint: options?.platformHint,
          user_name_hint: options?.userNameHint
        };
    
        const params = new URLSearchParams({
          user_intent: userIntent,
          additional_context: options?.additionalContext || '',
          generate_variations: String(options?.generateVariations || false)
        });
    
        const result = await this.request<any>(`/screenshot/generate?${params}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
    
        return {
          ...this.transformResult(result),
          screenshotInfo: result.screenshot_info
        };
      }

      // Screenshot capture methods
  
    async createCaptureSession(): Promise<{ session_id: string }> {
        return this.request('/screenshot/session/create', {
        method: 'POST',
        });
    }

    async uploadFrame(
        sessionId: string,
        frameNumber: number,
        imageBase64: string,
        metadata?: {
        viewportHeight?: number;
        scrollPosition?: number;
        }
    ): Promise<any> {
        return this.request('/screenshot/frame', {
        method: 'POST',
        body: JSON.stringify({
            session_id: sessionId,
            frame_number: frameNumber,
            image_base64: imageBase64,
            viewport_height: metadata?.viewportHeight || 0,
            scroll_position: metadata?.scrollPosition || 0,
            timestamp: Date.now(),
        }),
        });
    }

    async completeCapture(
        sessionId: string,
        metadata: {
        totalFrames: number;
        platform: string;
        url: string;
        analyze?: boolean;
        }
    ): Promise<any> {
        return this.request('/screenshot/complete', {
        method: 'POST',
        body: JSON.stringify({
            session_id: sessionId,
            total_frames: metadata.totalFrames,
            platform: metadata.platform,
            url: metadata.url,
            analyze: metadata.analyze || false,
        }),
        });
    }

    getViewerUrl(threadId: string): string {
        return `/viewer/${threadId}`;
    }

    getTileUrl(threadId: string): string {
        return `${this.baseUrl}/screenshot/tiles/${threadId}/thread.dzi`;
    }
}

export const api = new APIClient();

