// ============================================================================
// flayre.ai - API Client
// Communicates with the FastAPI backend with typed methods and auth handling.
// ============================================================================

import { getAccessToken } from '@/context/AuthContext';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  UsageInfo,
  Conversation,
  ConversationListResponse,
  SubscriptionInfo,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    let errorBody: any = null;
    try {
      errorBody = await response.json();
      errorDetail = errorBody.detail || errorBody.message || errorDetail;
    } catch {
      // Non-JSON response
    }
    throw new APIError(errorDetail, response.status, errorBody);
  }

  return response.json();
}

export const api = {
  analyze: {
    analyzeScreenshot: (data: AnalyzeRequest): Promise<AnalyzeResponse> =>
      request<AnalyzeResponse>('/api/v1/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getUsage: (): Promise<UsageInfo> =>
      request<UsageInfo>('/api/v1/analyze/usage'),
  },

  conversations: {
    list: (page = 1, perPage = 10): Promise<ConversationListResponse> =>
      request<ConversationListResponse>(`/api/v1/conversations?page=${page}&per_page=${perPage}`),

    get: (id: string): Promise<Conversation> =>
      request<Conversation>(`/api/v1/conversations/${id}`),

    delete: (id: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(`/api/v1/conversations/${id}`, {
        method: 'DELETE',
      }),
  },

  billing: {
    getSubscription: (): Promise<SubscriptionInfo> =>
      request<SubscriptionInfo>('/api/v1/billing/subscription'),

    createOrder: (plan = 'pro'): Promise<CreateOrderResponse> =>
      request<CreateOrderResponse>('/api/v1/billing/create-order', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),

    verifyPayment: (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> =>
      request<VerifyPaymentResponse>('/api/v1/billing/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export { APIError };
