import { create } from 'zustand';
import { AIResult } from '../services/ai/openrouter';

interface AIState {
  history: AIResult[];
  lastResult: AIResult | null;
  isLoading: boolean;
  isGenerating: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  addToHistory: (result: AIResult) => void;
  setLastResult: (result: AIResult | null) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  history: [],
  lastResult: null,
  isLoading: false,
  isGenerating: false,

  setLoading: (loading) => set({ isLoading: loading }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  addToHistory: (result) => set((state) => ({ 
    history: [result, ...state.history].slice(0, 50), // Keep last 50
    lastResult: result 
  })),
  setLastResult: (result) => set({ lastResult: result }),
  clearHistory: () => set({ history: [], lastResult: null }),
}));
