// src/services/ai/huggingface.ts
import { storage } from '@/src/lib/storage';
import * as Crypto from 'expo-crypto';
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
const MODEL = 'microsoft/Phi-3-mini-4k-instruct';
const BASE_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
const API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

async function hashPrompt(prompt: string): Promise<string> {
  const data = `${MODEL}:${prompt}`;
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return digest;
}

async function callHF(prompt: string, options?: GenerateOptions): Promise<AIResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  const finalPrompt = options?.systemPrompt ? `System: ${options.systemPrompt}\n\nUser: ${prompt}` : prompt;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: finalPrompt, parameters: { max_new_tokens: options?.maxTokens ?? 1024, temperature: options?.temperature ?? 0.7 } }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`HuggingFace error ${response.status}: ${txt}`);
  }
  const data = await response.json();
  const text = typeof data === 'string' ? data : data?.generated_text ?? '';
  return { text, modelUsed: MODEL, generationTime: 0, cached: false };
}

export async function generateWithFallback(prompt: string, options?: GenerateOptions): Promise<AIResult> {
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
