// src/services/ai/index.ts
import { generateText } from './openrouter';
import { generateHFText } from './huggingface';
import { generateGeminiContent } from './gemini';
import { AIResult } from './openrouter';
import { generateCraiyonImage } from './craiyon';
import { generateGeminiImage } from './gemini-image';
import * as Prompts from './prompts';
import { aiQueue } from './queue';
import * as Haptics from 'expo-haptics';

const PLATFORM_PROFILES: Record<string, { systemPrompt: string, maxTokens: number, temperature: number }> = {
  twitter: {
    systemPrompt: "You are a viral Twitter content creator. Write concise, punchy posts under 280 characters. Use hooks, thread markers (1/3, 2/3) if needed, trending hashtags, and strong CTAs. Avoid corporate jargon.",
    maxTokens: 150,
    temperature: 0.8
  },
  facebook: {
    systemPrompt: "You are an engaging Facebook community manager. Write warm, conversational posts that spark discussion. Use emojis naturally, ask questions, and include a clear call-to-action. Length: 1-3 short paragraphs.",
    maxTokens: 300,
    temperature: 0.7
  },
  linkedin: {
    systemPrompt: "You are a senior LinkedIn thought leader. Write professional, insightful posts with a strong opening hook. Use line breaks for readability, include data or personal experience, and end with a thoughtful question. Length: 3-8 paragraphs. Tone: authoritative but approachable.",
    maxTokens: 800,
    temperature: 0.6
  }
};

/**
 * Generate a social media caption using the AI service.
 * Utilizes the prompt builder and fallback routing.
 */
export async function generateCaption(params: {
  topic: string;
  tone: string;
  platform: string;
  length: 'short' | 'medium' | 'long';
  audience?: string;
  includeCTA?: boolean;
}): Promise<AIResult> {
  const prompt = Prompts.buildCaptionPrompt(params);
  const profile = PLATFORM_PROFILES[params.platform.toLowerCase()] || {
    systemPrompt: "You are a helpful social media manager.",
    maxTokens: 500,
    temperature: 0.7
  };

  return aiQueue.add(() => generateWithFallback(prompt, profile));
}

/** Generate hashtags for a post */
export async function generateHashtags(params: {
  topic: string;
  count: number;
  niche: string;
  trending?: boolean;
}): Promise<AIResult> {
  const prompt = Prompts.buildHashtagPrompt(params);
  return aiQueue.add(() => generateWithFallback(prompt));
}

/** Generate a hook (opening line) */
export async function generateHook(params: { topic: string; style: string }): Promise<AIResult> {
  const prompt = Prompts.buildHookPrompt(params);
  return generateWithFallback(prompt);
}

/** Generate a Call‑To‑Action */
export async function generateCTA(params: { goal: string; tone: string; platform: string }): Promise<AIResult> {
  const prompt = Prompts.buildCTAPrompt(params);
  return generateWithFallback(prompt);
}

/** Rewrite content for a different platform */
export async function rewriteForPlatform(params: {
  content: string;
  fromPlatform: string;
  toPlatform: string;
  tone?: string;
}): Promise<AIResult> {
  const prompt = Prompts.buildRewritePrompt(params);
  return generateWithFallback(prompt);
}

/**
 * Generate an image using Pollinations AI based on a user prompt.
 * Returns a direct URL to the generated image.
 */
export async function generateImage(prompt: string): Promise<string> {
  // Validate prompt
  if (!prompt || prompt.trim() === '') {
    throw new Error('Please enter a prompt');
  }
  
  // Encode prompt for URL
  const encodedPrompt = encodeURIComponent(prompt.trim());
  
  // Generate unique seed for different images each time
  const seed = Date.now();
  
  // Pollinations returns image directly from URL
  // Returning instantly without verification to save time and API calls
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
}



/** TEMPORARY: Placeholder image generator for testing (bypassing failing AI APIs) */
export async function generateSocialImage(params: {
  caption?: string;
  topic?: string;
  style?: string;
  mood?: string;
  colors?: string;
  size?: 'SQUARE' | 'PORTRAIT' | 'STORY' | 'LANDSCAPE';
  userId?: string;
}): Promise<string> {
  return generateImage(params.caption || params.topic || 'Social media post');
}


/** Placeholder for best posting times – implementation TBD */
export async function getBestPostingTimes(params: { postHistory: any[]; platform: string }): Promise<AIResult> {
  // Convert history to string for the prompt
  const historyString = JSON.stringify(params.postHistory.slice(-10)); // Last 10 posts for context
  const prompt = Prompts.buildBestTimePrompt({ postHistory: historyString, platform: params.platform });
  return aiQueue.add(() => generateWithFallback(prompt));
}

/** Placeholder for trending topics – implementation TBD */
export async function getTrendingTopics(params: { niche: string; region?: string }): Promise<AIResult> {
  const prompt = Prompts.buildTrendingPrompt(params);
  return generateWithFallback(prompt);
}

/** Generate a video script */
export async function generateVideoScript(params: {
  topic: string;
  duration: '15s' | '30s' | '60s';
  style: 'educational' | 'entertaining' | 'storytelling';
}): Promise<AIResult> {
  const prompt = Prompts.buildVideoScriptPrompt(params);
  return generateWithFallback(prompt);
}

/** Generate social media bios */
export async function generateBio(params: {
  name: string;
  niche: string;
  keywords: string;
  platform: string;
}): Promise<AIResult> {
  const prompt = Prompts.buildBioPrompt(params);
  return generateWithFallback(prompt);
}

/** 
 * Master fallback generation chain: Gemini -> OpenRouter -> HuggingFace 
 */
export async function generateWithFallback(prompt: string, options?: any): Promise<AIResult> {
  try {
    // 1. Try Gemini First (Primary Provider)
    const geminiText = await generateGeminiContent(options?.systemPrompt ? `System: ${options.systemPrompt}\n\nUser: ${prompt}` : prompt);
    return {
      text: geminiText,
      modelUsed: 'gemini-2.0-flash',
      generationTime: 0,
      cached: false
    };
  } catch (geminiError) {
    console.warn('Gemini failed, falling back to OpenRouter...', geminiError);
    try {
      // 2. Try OpenRouter
      return await generateText(prompt, options);
    } catch (orError) {
      console.warn('OpenRouter failed, falling back to HuggingFace...', orError);
      // 3. Ultimate Fallback to HuggingFace
      return await generateHFText(prompt, options);
    }
  }
}

/** Unified AIService object for easier imports in other services */
export const AIService = {
  generateCaption,
  generateHashtags,
  generateHook,
  generateCTA,
  rewriteForPlatform,
  generateImage,
  generateSocialImage,

  getBestPostingTimes,
  getTrendingTopics,
  generateVideoScript,
  generateBio,
  generateHFText,
  generateText,
  generateGeminiContent,
  generateWithFallback,
  generateContent: generateWithFallback // Alias for generic content generation
};
