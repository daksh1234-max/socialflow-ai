// src/services/ai/pollinations.ts
import * as Haptics from 'expo-haptics';

export type ImageSize = 'SQUARE' | 'PORTRAIT' | 'STORY' | 'LANDSCAPE';

const SIZE_DIMENSIONS: Record<ImageSize, { width: number; height: number }> = {
  SQUARE: { width: 1080, height: 1080 },
  PORTRAIT: { width: 1080, height: 1350 },
  STORY: { width: 1080, height: 1920 },
  LANDSCAPE: { width: 1200, height: 628 },
};

export interface GenerateImageOptions {
  size?: ImageSize;
  seed?: string; // optional seed for reproducibility
}

/**
 * Generate an image URL via Pollinations AI.
 * No API key required.
 */
export async function generateImage(prompt: string, options?: GenerateImageOptions): Promise<string> {
  const size = options?.size ?? 'SQUARE';
  const { width, height } = SIZE_DIMENSIONS[size];
  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    enhance: 'true',
  });
  if (options?.seed) {
    params.append('seed', options.seed);
  }
  const url = `https://gen.pollinations.ai/image/${encodedPrompt}?${params.toString()}`;
  
  // Provide a quick haptic feedback that request was sent
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  try {
    // Test the URL to make sure the service is up
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status}`);
    }
  } catch (error) {
    console.error('[Pollinations] Error verifying image:', error);
    throw new Error('Failed to generate image from Pollinations');
  }

  // Return the URL directly. The CreateScreen handles downloading and uploading to Supabase.
  return url;
}
