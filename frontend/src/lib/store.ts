// ============================================================================
// ZUSTAND STATE STORE
// ============================================================================

import { create } from 'zustand';
import type { Platform, Message, ContextAnalysis, GenerateResult, ConversationInput } from '@/types';

type InputMode = 'paste' | 'screenshot';
type AppStep = 'input' | 'analyzing' | 'intent' | 'generating' | 'result';

interface AppState {
  // Input
  inputMode: InputMode;
  rawText: string;
  screenshotBase64: string | null;
  platformHint: Platform | null;
  userNameHint: string;

  // Analysis
  parsedMessages: Message[];
  analysis: ContextAnalysis | null;

  // Intent
  userIntent: string;
  additionalContext: string;
  generateVariations: boolean;

  // Result
  result: GenerateResult | null;

  // UI
  step: AppStep;
  isLoading: boolean;
  error: string | null;

  // Actions
  setInputMode: (mode: InputMode) => void;
  setRawText: (text: string) => void;
  setScreenshot: (base64: string | null) => void;
  setPlatformHint: (platform: Platform | null) => void;
  setUserNameHint: (name: string) => void;
  setUserIntent: (intent: string) => void;
  setAdditionalContext: (context: string) => void;
  setGenerateVariations: (value: boolean) => void;
  setAnalysis: (messages: Message[], analysis: ContextAnalysis) => void;
  setResult: (result: GenerateResult) => void;
  setStep: (step: AppStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  getConversationInput: () => ConversationInput;
}

const initialState = {
  inputMode: 'paste' as InputMode,
  rawText: '',
  screenshotBase64: null,
  platformHint: null,
  userNameHint: '',
  parsedMessages: [],
  analysis: null,
  userIntent: '',
  additionalContext: '',
  generateVariations: false,
  result: null,
  step: 'input' as AppStep,
  isLoading: false,
  error: null,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  setInputMode: (mode) => set({ inputMode: mode }),
  setRawText: (text) => set({ rawText: text }),
  setScreenshot: (base64) => set({ screenshotBase64: base64 }),
  setPlatformHint: (platform) => set({ platformHint: platform }),
  setUserNameHint: (name) => set({ userNameHint: name }),
  setUserIntent: (intent) => set({ userIntent: intent }),
  setAdditionalContext: (context) => set({ additionalContext: context }),
  setGenerateVariations: (value) => set({ generateVariations: value }),

  setAnalysis: (messages, analysis) => set({
    parsedMessages: messages,
    analysis,
    step: 'intent',
  }),

  setResult: (result) => set({
    result,
    analysis: result.analysis,
    step: 'result',
  }),

  setStep: (step) => set({ step }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),

  getConversationInput: () => {
    const state = get();
    return {
      rawText: state.inputMode === 'paste' ? state.rawText : undefined,
      screenshotBase64: state.inputMode === 'screenshot' ? state.screenshotBase64 || undefined : undefined,
      platformHint: state.platformHint || undefined,
      userNameHint: state.userNameHint || undefined,
    };
  },
}));