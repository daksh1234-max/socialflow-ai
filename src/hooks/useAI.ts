import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAIStore } from '../stores/aiStore';
import * as AIService from '../services/ai';
import { AIResult } from '../services/ai/openrouter';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export type AIGenerationType = 
  | 'caption' 
  | 'hashtags' 
  | 'hook' 
  | 'cta' 
  | 'rewrite' 
  | 'image' 
  | 'best_time' 
  | 'trending_topics';

interface UseAIReturn {
  generate: (type: AIGenerationType, params: any) => Promise<AIResult | string>;
  regenerate: () => Promise<AIResult | string>;
  isLoading: boolean;
  isGenerating: boolean;
  progress: number;
  error: Error | null;
  lastResult: AIResult | string | null;
  history: (AIResult | string)[];
  clearHistory: () => void;
  cancel: () => void;
}

export function useAI(): UseAIReturn {
  const { 
    history, 
    lastResult, 
    isLoading, 
    isGenerating, 
    setLoading, 
    setGenerating, 
    addToHistory, 
    clearHistory 
  } = useAIStore();
  
  const { user } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCallRef = useRef<{ type: AIGenerationType, params: any } | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setGenerating(false);
      setLoading(false);
    }
  }, [setGenerating, setLoading]);

  const saveToSupabase = async (type: AIGenerationType, prompt: string, result: any, modelUsed?: string, tokensUsed?: number) => {
    if (!user) return;

    try {
      const { error: dbError } = await supabase.from('ai_generations').insert({
        user_id: user.id,
        type,
        prompt,
        result: typeof result === 'string' ? result : result.text,
        model_used: modelUsed || (typeof result === 'object' ? result.modelUsed : 'pollinations'),
        tokens_used: tokensUsed || (typeof result === 'object' ? result.tokensUsed : 0),
        metadata: typeof result === 'object' ? result : {},
      });

      if (dbError) console.error('Error saving AI generation:', dbError);
    } catch (e) {
      console.error('Failed to save AI generation:', e);
    }
  };

  const generate = async (type: AIGenerationType, params: any): Promise<AIResult | string> => {
    cancel();
    setError(null);
    setGenerating(true);
    setProgress(0);
    lastCallRef.current = { type, params };
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Simulation of progress for images
    let progressInterval: NodeJS.Timeout | null = null;
    if (type === 'image') {
      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 95));
      }, 500);
    }

    try {
      let result: AIResult | string;

      switch (type) {
        case 'caption':
          result = await AIService.generateCaption(params);
          break;
        case 'hashtags':
          result = await AIService.generateHashtags(params);
          break;
        case 'hook':
          result = await AIService.generateHook(params);
          break;
        case 'cta':
          result = await AIService.generateCTA(params);
          break;
        case 'rewrite':
          result = await AIService.rewriteForPlatform(params);
          break;
        case 'image':
          result = await AIService.generateSocialImage(params);
          break;
        case 'best_time':
          result = await AIService.getBestPostingTimes(params);
          break;
        case 'trending_topics':
          result = await AIService.getTrendingTopics(params);
          break;
        default:
          throw new Error(`Unsupported generation type: ${type}`);
      }

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      // Auto-save to Supabase
      // Note: We'd ideally want the actual prompt string from the service, 
      // but for now we'll pass the params as metadata.
      await saveToSupabase(type, JSON.stringify(params), result);

      addToHistory(result as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return '';
      }
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('AI Generation Failed', err.message || 'An unexpected error occurred.');
      throw err;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const regenerate = useCallback(() => {
    if (lastCallRef.current) {
      return generate(lastCallRef.current.type, lastCallRef.current.params);
    }
    return Promise.reject(new Error('No previous generation to repeat'));
  }, [generate]);

  return {
    generate,
    regenerate,
    isLoading,
    isGenerating,
    progress,
    error,
    lastResult,
    history,
    clearHistory,
    cancel,
  };
}
