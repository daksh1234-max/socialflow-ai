// src/services/ai/openrouter.ts
import { storage } from '@/src/lib/storage';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';

// Types
export interface AIResult {
  text: string;
  modelUsed: string;
  tokensUsed?: number;
  generationTime: number; // ms
  cached: boolean;
}

interface GenerateOptions {
  /** Optional abort signal */
  signal?: AbortSignal;
  /** Platform-specific system prompt */
  systemPrompt?: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Generation temperature */
  temperature?: number;
}

// Rate limiter: token bucket allowing 20 requests per minute
class TokenBucket {
  private capacity: number = 20;
  private tokens: number = this.capacity;
  private refillInterval: number = 60000; // 1 minute ms
  private lastRefill: number = Date.now();
  private queue: (() => void)[] = [];

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillInterval) {
      const refillCount = Math.floor(elapsed / this.refillInterval);
      this.tokens = Math.min(this.capacity, this.tokens + refillCount * this.capacity);
      this.lastRefill = now;
      this.processQueue();
    }
  }

  private processQueue() {
    while (this.tokens > 0 && this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        this.tokens--;
        resolve();
      }
    }
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }
}

const bucket = new TokenBucket();
// storage is now imported from '@/src/lib/storage'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_PRIORITY = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
];

export async function generateText(
  prompt: string,
  options?: GenerateOptions,
): Promise<AIResult> {
  // Haptic feedback start
  Haptics.selectionAsync();

  // Compute cache key
  const cacheKeyRaw = `${prompt}`;
  const cacheKeyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    cacheKeyRaw,
  );
  const cachedData = storage.getString(cacheKeyHash);
  if (cachedData) {
    const parsed: AIResult = JSON.parse(cachedData);
    // Check TTL (24h)
    if (Date.now() - parsed.generationTime < 24 * 60 * 60 * 1000) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { ...parsed, cached: true };
    }
  }

  await bucket.acquire();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  const signal = options?.signal ?? controller.signal;

  const messages = [];
  if (options?.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: MODELS_PRIORITY[0], // primary model
    messages,
  };
  if (options?.temperature !== undefined) body.temperature = options.temperature;
  if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://socialflow.app',
  } as Record<string, string>;

  let attempt = 0;
  const maxAttempts = 3;
  const backoff = [1000, 2000, 4000];
  let lastError: any;
  const startTime = Date.now();
  while (attempt < maxAttempts) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) {
        throw new Error(`OpenRouter error: ${response.status}`);
      }
      const data = await response.json();
      const result: AIResult = {
        text: data?.choices?.[0]?.message?.content ?? '',
        modelUsed: MODELS_PRIORITY[0],
        generationTime: Date.now() - startTime,
        cached: false,
      };
      storage.set(cacheKeyHash, JSON.stringify({ ...result, generationTime: Date.now() }));
      clearTimeout(timeoutId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return result;
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoff[attempt - 1]));
      }
    }
  }
  clearTimeout(timeoutId);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  throw lastError;
}

export async function generateWithFallback(
  prompt: string,
  options?: GenerateOptions,
): Promise<AIResult> {
  try {
    return await generateText(prompt, options);
  } catch (err) {
    // Fallback to HuggingFace implementation (import inside to avoid circular deps)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateHFText } = require('./huggingface');
    return await generateHFText(prompt, options);
  }
}
