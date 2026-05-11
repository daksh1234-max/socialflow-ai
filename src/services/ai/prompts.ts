// src/services/ai/prompts.ts
/**
 * Prompt builders used by the AI service layer.
 * Each builder returns a string ready to be sent to the LLM.
 */

export interface CaptionPromptParams {
  topic: string;
  tone: 'professional' | 'friendly' | 'humorous' | 'inspirational' | string;
  platform: 'meta' | 'twitter' | 'linkedin' | string;
  length: 'short' | 'medium' | 'long';
  audience?: string;
  includeCTA?: boolean;
}

export function buildCaptionPrompt({
  topic,
  tone,
  platform,
  length,
  audience,
  includeCTA,
}: CaptionPromptParams): string {
  const audiencePart = audience ? `Target audience: ${audience}. ` : '';
  const ctaPart = includeCTA ? 'Include a clear call‑to‑action at the end.' : '';
  return `Write a ${length} social‑media caption for ${platform} about "${topic}". Tone: ${tone}. ${audiencePart}${ctaPart}`.trim();
}

export interface HashtagPromptParams {
  topic: string;
  count: number;
  niche?: string;
  trending?: boolean;
}

export function buildHashtagPrompt({ topic, count, niche, trending }: HashtagPromptParams): string {
  const nichePart = niche ? `Niche: ${niche}. ` : '';
  const trendPart = trending ? 'Prefer currently trending hashtags.' : '';
  return `Generate ${count} relevant hashtags for the topic "${topic}". ${nichePart}${trendPart}`.trim();
}

export interface HookPromptParams {
  topic: string;
  style: 'question' | 'statement' | 'story' | string;
}

export function buildHookPrompt({ topic, style }: HookPromptParams): string {
  return `Create a captivating ${style} hook for a social‑media post about "${topic}".`;
}

export interface CTAPromptParams {
  goal: string;
  tone: string;
  platform: string;
}

export function buildCTAPrompt({ goal, tone, platform }: CTAPromptParams): string {
  return `Write a short call‑to‑action for ${platform} to achieve the goal: "${goal}". Tone: ${tone}.`;
}

export interface RewritePromptParams {
  content: string;
  fromPlatform: string;
  toPlatform: string;
  tone?: string;
}

export function buildRewritePrompt({ content, fromPlatform, toPlatform, tone }: RewritePromptParams): string {
  const tonePart = tone ? ` Use a ${tone} tone.` : '';
  return `Rewrite the following content originally for ${fromPlatform} so it fits ${toPlatform}.${tonePart}\n\n${content}`;
}

export interface ImagePromptParams {
  caption: string;
  style?: string;
  mood?: string;
  colors?: string;
}

export function buildImagePrompt({ caption, style, mood, colors }: ImagePromptParams): string {
  const parts = [] as string[];
  if (style) parts.push(`Style: ${style}`);
  if (mood) parts.push(`Mood: ${mood}`);
  if (colors) parts.push(`Colors: ${colors}`);
  const descriptor = parts.length ? parts.join(', ') + '. ' : '';
  return `${descriptor}Create an image that visually represents the following caption: "${caption}"`;
}

export interface BestTimePromptParams {
  postHistory: string; // could be JSON string of past posts
  platform: string;
}

export function buildBestTimePrompt({ postHistory, platform }: BestTimePromptParams): string {
  return `Based on the following posting history for ${platform}: ${postHistory}. Suggest the best time(s) of day to schedule new posts to maximize engagement.`;
}

export interface TrendingPromptParams {
  niche: string;
  region?: string;
}

export function buildTrendingPrompt({ niche, region }: TrendingPromptParams): string {
  const regionPart = region ? ` in ${region}` : '';
  return `List the current trending topics for the niche "${niche}"${regionPart}. Provide short descriptions.`;
}
