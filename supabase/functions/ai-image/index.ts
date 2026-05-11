import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, width = 1024, height = 1024, style = 'modern', userId } = await req.json();

    if (!prompt || !userId) {
      throw new Error("Missing prompt or userId");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt + ' ' + style)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    // 1. Fetch image from provider
    const response = await fetch(pollinationsUrl);
    if (!response.ok) throw new Error("Image generation failed");
    
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();

    // 2. Cache in Supabase Storage
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_${seed}.png`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('ai-generated-images')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('ai-generated-images')
      .getPublicUrl(fileName);

    // 4. Log to DB
    await supabaseClient.from('ai_generations').insert({
      user_id: userId,
      type: 'image',
      prompt: JSON.stringify({ prompt, width, height, style, seed }),
      result: publicUrl,
      provider: 'pollinations',
      model_id: 'flux'
    });

    return new Response(JSON.stringify({ success: true, url: publicUrl, fileName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
