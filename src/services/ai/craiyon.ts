import { StorageService } from '../supabase/storage';

export async function generateCraiyonImage(prompt: string, userId: string): Promise<string> {
  console.log('[Craiyon] Requesting image for prompt:', prompt);
  
  try {
    const response = await fetch('https://api.craiyon.com/v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: "",
        model: "art"
      }),
    });

    if (!response.ok) {
      throw new Error(`Craiyon error: ${response.status}`);
    }

    const data = await response.json();
    
    // data.images is an array of base64 strings
    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from Craiyon');
    }
    
    const base64Image = data.images[0];
    
    // Upload to Supabase Storage
    const permanentUrl = await StorageService.uploadBase64(
      userId, 
      base64Image, 
      `craiyon_${Date.now()}.png`
    );
    
    return permanentUrl;
  } catch (error) {
    console.error('[Craiyon] Generation failed:', error);
    throw error;
  }
}
