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

    console.log('Starting social-schedule processing...')
    const now = new Date()

    // 1. Fetch scheduled and previously failed posts
    const { data: platforms, error: fetchError } = await supabase
      .from('post_platforms')
      .select(`
        id,
        platform,
        status,
        retry_count,
        next_retry_at,
        post_id,
        posts!inner(
          id,
          user_id,
          content,
          media_urls,
          scheduled_for
        )
      `)
      .in('status', ['scheduled', 'failed'])
      .lte('posts.scheduled_for', now.toISOString())

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError)
      throw fetchError
    }

    // Filter in memory for complex OR condition
    const duePlatforms = platforms?.filter(p => {
      if (p.status === 'scheduled') return true
      if (p.status === 'failed') {
        const retryCount = p.retry_count || 0
        if (retryCount >= 3) return false
        if (!p.next_retry_at) return false
        return new Date(p.next_retry_at) <= now
      }
      return false
    }) || []

    console.log(`Found ${duePlatforms.length} due posts (including retries).`)

    if (duePlatforms.length === 0) {
      return new Response(JSON.stringify({ message: 'No due posts found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []

    // 2. Process each post
    for (const item of duePlatforms) {
      const post = item.posts
      const platform = item.platform.toLowerCase()
      const userId = post.user_id

      console.log(`Processing post ${post.id} for ${platform} (Attempt ${item.retry_count || 0})...`)

      // 3. Fetch social account token
      const { data: accounts, error: accountError } = await supabase
        .from('social_accounts')
        .select('access_token, refresh_token, platform_user_id')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single()

      if (accountError || !accounts) {
        console.error(`No connected account found for user ${userId} on ${platform}`)
        await markPermanentlyFailed(supabase, item, post.id, 'No connected account')
        results.push({ id: item.id, status: 'failed_permanent', error: 'No connected account' })
        continue
      }

      // 4. Call platform API
      const result = await publishToPlatform(platform, post, accounts)

      // 5. Handle Response
      if (result.success) {
        await supabase.from('post_platforms').update({ 
          status: 'published',
          last_error: null 
        }).eq('id', item.id)
        
        await supabase.from('posts').update({ status: 'published' }).eq('id', post.id)
        
        console.log(`Successfully published post ${post.id} to ${platform}`)
        results.push({ id: item.id, status: 'published' })
      } else {
        console.error(`Failed to publish post ${post.id} to ${platform}:`, result.error)
        
        const currentRetry = item.retry_count || 0
        
        if (result.retryable && currentRetry < 3) {
          // Exponential backoff: 5m, 10m, 20m
          const nextRetryMins = Math.pow(2, currentRetry) * 5
          const nextRetryAt = new Date(Date.now() + nextRetryMins * 60000).toISOString()
          
          await supabase.from('post_platforms').update({ 
            status: 'failed',
            retry_count: currentRetry + 1,
            next_retry_at: nextRetryAt,
            last_error: result.error
          }).eq('id', item.id)
          
          console.log(`Scheduled retry ${currentRetry + 1}/3 for post ${post.id} at ${nextRetryAt}`)
          results.push({ id: item.id, status: 'failed_retryable', next_retry_at: nextRetryAt })
        } else {
          await markPermanentlyFailed(supabase, item, post.id, result.error || 'Unknown error')
          console.log(`Permanently failed post ${post.id}`)
          results.push({ id: item.id, status: 'failed_permanent', error: result.error })
        }
      }
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Fatal error in social-schedule:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function markPermanentlyFailed(supabase: any, item: any, postId: string, reason: string) {
  await supabase.from('post_platforms').update({ 
    status: 'failed',
    retry_count: item.retry_count || 0,
    next_retry_at: null,
    last_error: reason
  }).eq('id', item.id)
  
  await supabase.from('posts').update({ status: 'failed' }).eq('id', postId)
}

async function publishToPlatform(platform: string, post: any, accounts: any): Promise<{ success: boolean, retryable: boolean, error?: string }> {
  const token = accounts.access_token

  try {
    if (platform === 'twitter') {
      let mediaIds: string[] = []
      
      // Upload media to Twitter first if any
      if (post.media_urls && post.media_urls.length > 0) {
        for (const url of post.media_urls) {
          const imageRes = await fetch(url)
          if (imageRes.ok) {
            const blob = await imageRes.blob()
            const formData = new FormData()
            formData.append('media', blob)
            
            const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            })
            
            if (uploadRes.ok) {
              const data = await uploadRes.json()
              mediaIds.push(data.media_id_string)
            } else {
              console.error('Twitter media upload failed:', await uploadRes.text())
            }
          }
        }
      }

      const payload: any = { text: post.content }
      if (mediaIds.length > 0) {
        payload.media = { media_ids: mediaIds }
      }

      const resp = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!resp.ok) {
        const isRetryable = resp.status === 429 || resp.status >= 500 || resp.status === 408
        return { success: false, retryable: isRetryable, error: `Twitter error ${resp.status}: ${await resp.text()}` }
      }
      return { success: true, retryable: false }
    } 
    else if (platform === 'linkedin') {
      let mediaUrn: string | null = null
      
      if (post.media_urls && post.media_urls.length > 0) {
        // LinkedIn requires registering the upload, then uploading the binary
        const imageUrl = post.media_urls[0];
        const registerResp = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              owner: `urn:li:person:${accounts.platform_user_id}`,
              serviceRelationships: [{
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent"
              }]
            }
          })
        });
        
        if (registerResp.ok) {
          const regData = await registerResp.json();
          const uploadMechanism = regData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
          mediaUrn = regData.value.asset;
          
          // Download the image and PUT it to LinkedIn's provided URL
          const imageRes = await fetch(imageUrl);
          if (imageRes.ok) {
            const blob = await imageRes.blob();
            await fetch(uploadMechanism.uploadUrl, {
              method: 'PUT',
              headers: { 
                'Authorization': `Bearer ${token}` 
              },
              body: blob
            });
          }
        } else {
          console.error('LinkedIn media register failed:', await registerResp.text());
        }
      }

      const urn = `urn:li:person:${accounts.platform_user_id}`
      const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: urn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: post.content },
              shareMediaCategory: mediaUrn ? 'IMAGE' : 'NONE',
              media: mediaUrn ? [{
                status: 'READY',
                description: { text: 'Image attached' },
                media: mediaUrn
              }] : undefined
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      })
      if (!resp.ok) {
        const isRetryable = resp.status === 429 || resp.status >= 500 || resp.status === 408
        return { success: false, retryable: isRetryable, error: `LinkedIn error ${resp.status}: ${await resp.text()}` }
      }
      return { success: true, retryable: false }
    }
    else if (platform === 'facebook' || platform === 'meta') {
      const pageId = accounts.platform_user_id
      const hasImage = post.media_urls && post.media_urls.length > 0;
      
      const endpoint = hasImage 
        ? `https://graph.facebook.com/v18.0/${pageId}/photos`
        : `https://graph.facebook.com/v18.0/${pageId}/feed`;
        
      const payload: any = {
        access_token: token
      };
      
      if (hasImage) {
        payload.url = post.media_urls[0]; // Meta allows providing public URL directly
        payload.caption = post.content;
      } else {
        payload.message = post.content;
      }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) {
        const isRetryable = resp.status === 429 || resp.status >= 500 || resp.status === 408 || resp.status === 2 || resp.status === 1
        return { success: false, retryable: isRetryable, error: `Meta error ${resp.status}: ${await resp.text()}` }
      }
      return { success: true, retryable: false }
    }
    
    return { success: false, retryable: false, error: `Unsupported platform: ${platform}` }
    
  } catch (err: any) {
    // Network errors like ETIMEDOUT, DNS failures
    const isRetryable = err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('timeout')
    return { success: false, retryable: isRetryable, error: err.message }
  }
}
