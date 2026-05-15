// src/services/ai/huggingface.ts
import { storage } from '@/src/lib/storage';
import CryptoJS from 'crypto-js';
import * as Haptics from 'expo-haptics';

export interface AIResult {
  text: string;
  modelUsed: string;
  tokensUsed?: number;
  generationTime: number;
  cached: boolean;
}

interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

// storage is now imported from '@/src/lib/storage'
const MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const BASE_URL = `https://router.huggingface.co/v1/chat/completions`;
const API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

async function hashPrompt(prompt: string): Promise<string> {
  const data = `${MODEL}:${prompt}`;
  return CryptoJS.SHA256(data).toString();
}

async function callHF(prompt: string, options?: GenerateOptions): Promise<AIResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  const messages = [];
  if (options?.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      model: MODEL,
      messages: messages,
      max_tokens: options?.maxTokens ?? 1024, 
      temperature: options?.temperature ?? 0.7 
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF error ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  
  // Parse OpenAI compatible response format
  let text = data?.choices?.[0]?.message?.content ?? '';

  return { text, modelUsed: MODEL, generationTime: 0, cached: false };
}

export async function generateHFText(prompt: string, options?: GenerateOptions): Promise<AIResult> {
  // Check cache first
  const key = await hashPrompt(prompt);
  const cached = storage.getString(key);
  if (cached) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return { text: cached, modelUsed: MODEL, generationTime: 0, cached: true };
  }
  const result = await callHF(prompt, options);
  storage.set(key, result.text);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return result;
}
