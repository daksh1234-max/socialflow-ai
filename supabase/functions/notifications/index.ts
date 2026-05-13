import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    console.log("Received notification payload:", JSON.stringify(payload))

    // payload from Postgres trigger typically has:
    // { type: 'UPDATE', table: 'post_platforms', record: { ... }, old_record: { ... } }
    const newRecord = payload.record
    const oldRecord = payload.old_record

    // Only process if status actually changed to published or failed
    if (!newRecord || !oldRecord || newRecord.status === oldRecord.status) {
      return new Response(JSON.stringify({ message: "No status change" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (newRecord.status !== 'published' && newRecord.status !== 'failed') {
      return new Response(JSON.stringify({ message: "Ignored status" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch the post to get the user_id
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, content')
      .eq('id', newRecord.post_id)
      .single()

    if (postError || !post) {
      throw new Error(`Could not find post ${newRecord.post_id}`)
    }

    // Fetch the user's push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', post.user_id)
      .single()

    if (profileError || !profile || !profile.expo_push_token) {
      console.log(`No push token for user ${post.user_id}`)
      return new Response(JSON.stringify({ message: "No push token" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pushToken = profile.expo_push_token
    const platformName = newRecord.platform ? newRecord.platform.charAt(0).toUpperCase() + newRecord.platform.slice(1) : 'Platform'
    
    let message = ''
    if (newRecord.status === 'published') {
      message = `✅ Your post is now live on ${platformName}!`
    } else {
      message = `❌ Failed to publish to ${platformName}. Tap to retry.`
    }

    // Send push notification via Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: 'SocialFlow AI',
        body: message,
        data: { postId: newRecord.post_id, platform: newRecord.platform, status: newRecord.status }
      }),
    })

    const result = await response.json()
    console.log("Expo Push response:", JSON.stringify(result))

    // Handle invalid tokens (Expo returns DeviceNotRegistered)
    const expoError = result.data?.[0]?.details?.error
    if (expoError === 'DeviceNotRegistered') {
      console.log(`Removing invalid push token for user ${post.user_id}`)
      await supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('id', post.user_id)
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Fatal error in notifications function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
