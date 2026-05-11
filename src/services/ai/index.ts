// src/services/ai/index.ts
import { generateWithFallback, generateText } from './openrouter';
import { generateHFText } from './huggingface';
import { generateImage } from './pollinations';
import * as Prompts from './prompts';
import { AIResult } from './openrouter';

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
  return generateWithFallback(prompt);
}

/** Generate hashtags for a post */
export async function generateHashtags(params: {
  topic: string;
  count: number;
  niche: string;
  trending?: boolean;
}): Promise<AIResult> {
  const prompt = Prompts.buildHashtagPrompt(params);
  return generateWithFallback(prompt);
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

/** Generate an image URL using Pollinations */
export async function generateSocialImage(params: {
  caption: string;
  style: string;
  mood: string;
  colors?: string;
  size: 'SQUARE' | 'PORTRAIT' | 'STORY' | 'LANDSCAPE';
}): Promise<string> {
  const prompt = Prompts.buildImagePrompt(params);
  // Map size enum to dimensions
  const dimensions = {
    SQUARE: { width: 1080, height: 1080 },
    PORTRAIT: { width: 1080, height: 1350 },
    STORY: { width: 1080, height: 1920 },
    LANDSCAPE: { width: 1200, height: 628 },
  }[params.size];
  return generateImage(prompt, { width: dimensions.width, height: dimensions.height });
}

/** Placeholder for best posting times – implementation TBD */
export async function getBestPostingTimes(_params: { postHistory: any; platform: string }): Promise<any> {
  // Future implementation could analyse postHistory with a model.
  throw new Error('Not implemented yet');
}

/** Placeholder for trending topics – implementation TBD */
export async function getTrendingTopics(_params: { niche: string; region?: string }): Promise<any> {
  throw new Error('Not implemented yet');
}
