import { StorageService } from '../supabase/storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`;

export async function generateGeminiImage(prompt: string, userId: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate an image: ${prompt}` }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        // Not JSON
      }
      throw new Error(`Gemini Image API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // Robust parsing of parts to find the image
    let base64Data = null;
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Data = part.inlineData.data;
        break;
      }
    }

    if (!base64Data) {
      console.error('[GeminiImage] No inlineData found in parts:', JSON.stringify(data));
      throw new Error('No image data returned from Gemini');
    }

    // Upload to Supabase for permanent storage
    const permanentUrl = await StorageService.uploadBase64(
      userId, 
      base64Data, 
      `gemini_${Date.now()}.png`
    );
    
    return permanentUrl;
  } catch (error) {
    console.error('[GeminiImage] Generation failed:', error);
    throw error;
  }
}
