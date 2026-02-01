/**
 * API Client for flayre.ai backend
 */

import type {
    AnalyzeRequest,
    AnalyzeResponse,
    UsageInfo,
    APIError,
    AuthTokens,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flayre-ai.onrender.com';

class APIClient {
    private baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    private async getAccessToken(): Promise<string | null> {
        const result = await browser.storage.local.get('flayre_access_token');
        return (result.flayre_access_token as string) || null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const accessToken = await this.getAccessToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const url = `${this.baseURL}${endpoint}`;

        console.log(`[API] ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const error: APIError = await response.json().catch(() => ({
                    detail: `HTTP Error ${response.status}`,
                    status: response.status,
                }));
                throw new Error(error.detail || `Request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[API] Request failed:', error);
            throw error;
        }
    }

    async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
        return this.request<AnalyzeResponse>('/api/v1/analyze', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    async getUsage(): Promise<UsageInfo> {
        try {
            return await this.request<UsageInfo>('/api/v1/analyze/usage');
        } catch (error: any) {
            // Check for authentication errors (401/403)
            if (error.status === 401 || error.status === 403 || error.message?.includes('401') || error.message?.includes('403')) {
                console.warn('[API] Not authenticated, returning default usage');
                return {
                    analyses_used: 0,
                    analyses_limit: 10,
                    analyses_remaining: 10,
                    is_pro: false,
                    plan_type: 'free',
                    reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                };
            }
            // Rethrow other errors
            console.error('[API] Failed to get usage:', error);
            throw error;
        }
    }

    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        return this.request<AuthTokens>('/api/v1/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }
}

export const api = new APIClient();
export default api;
