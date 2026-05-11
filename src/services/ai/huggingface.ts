// src/services/ai/huggingface.ts
import { MMKV } from 'react-native-mmkv';
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
  maxTokens?: number;
  temperature?: number;
}

const mmkv = new MMKV();
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

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: options?.maxTokens ?? 1024, temperature: options?.temperature ?? 0.7 } }),
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
  const cached = mmkv.getString(key);
  if (cached) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return { text: cached, modelUsed: MODEL, generationTime: 0, cached: true };
  }
  const result = await callHF(prompt, options);
  mmkv.set(key, result.text);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return result;
}
