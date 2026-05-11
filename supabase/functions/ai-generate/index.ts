import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/index.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GenerationSchema = z.object({
  type: z.enum(["caption", "hashtags", "hook", "cta", "rewrite", "best_time", "trending_topics"]),
  params: z.record(z.any()),
  userId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Validate Input
    const body = await req.json();
    const result = GenerationSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input", details: result.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, params, userId } = result.data;

    // 2. Check Rate Limit
    const { data: limitCheck, error: limitError } = await supabaseClient.rpc('check_rate_limit', {
      p_user_id: userId,
      p_provider: 'openrouter' // Check primary provider
    });

    if (limitError) throw limitError;
    if (!limitCheck) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded", code: "RATE_LIMIT" }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. AI Generation (OpenRouter primary)
    let aiResponse;
    let providerUsed = 'openrouter';
    let modelUsed = 'meta-llama/llama-3-8b-instruct'; // Default
    
    const OPENROUTER_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const HF_KEY = Deno.env.get('HUGGINGFACE_API_KEY');

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://socialflow.ai",
          "X-Title": "SocialFlow AI"
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [{ role: "user", content: JSON.stringify({ type, params }) }] // Simplified for demo
        })
      });

      if (!response.ok) throw new Error("OpenRouter failed");
      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    } catch (e) {
      // 4. Fallback to HuggingFace
      providerUsed = 'huggingface';
      modelUsed = 'microsoft/Phi-3-mini-4k-instruct';
      
      const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${modelUsed}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: `Type: ${type}, Params: ${JSON.stringify(params)}` })
      });
      
      if (!hfResponse.ok) throw new Error("Both providers failed");
      const hfData = await hfResponse.json();
      aiResponse = hfData[0]?.generated_text || hfData.generated_text;
    }

    // 5. Log to ai_generations
    await supabaseClient.from('ai_generations').insert({
      user_id: userId,
      type,
      prompt: JSON.stringify(params),
      result: aiResponse,
      provider: providerUsed,
      model_id: modelUsed,
      tokens_used: 0 // In real world, parse from response
    });

    return new Response(JSON.stringify({ success: true, data: aiResponse, provider: providerUsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
