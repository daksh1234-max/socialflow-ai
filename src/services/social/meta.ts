import * as AuthSession from 'expo-auth-session';
import { supabase } from '../supabase/client';

const META_APP_ID = process.env.EXPO_PUBLIC_META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const REDIRECT_URI = 'https://rfilxmrtqcrvfjlsawdj.supabase.co/auth/v1/callback';

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

export interface MetaAccount {
  id: string;
  user_id: string;
  platform: 'meta';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  handle?: string;
  page_id?: string;
  page_access_token?: string;
}

export async function connectMeta(): Promise<MetaAccount> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User must be authenticated');

    const request = new AuthSession.AuthRequest({
      clientId: META_APP_ID,
      redirectUri: REDIRECT_URI,
      scopes: ['public_profile', 'email', 'pages_read_engagement', 'pages_manage_posts', 'publish_video'],
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error('Meta authentication failed or was cancelled');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: META_APP_ID,
        clientSecret: META_APP_SECRET,
        code: result.params.code,
        redirectUri: REDIRECT_URI,
      },
      discovery
    );

    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenResponse.accessToken}`
    );
    const longLivedTokenData = await longLivedTokenResponse.json();
    const longLivedToken = longLivedTokenData.access_token;

    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${longLivedToken}`);
    const userDataFb = await userResponse.json();

    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`);
    const pagesData = await pagesResponse.json();

    const page = pagesData.data?.[0];
    const pageId = page?.id;
    const pageAccessToken = page?.access_token;

    const expiresAt = longLivedTokenData.expires_in
      ? new Date(Date.now() + longLivedTokenData.expires_in * 1000).toISOString()
      : null;

    const { data: account, error } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: userData.user.id,
        platform: 'meta',
        platform_account_id: userDataFb.id,
        handle: userDataFb.name,
        access_token: longLivedToken,
        token_expires_at: expiresAt,
        metadata: {
          page_id: pageId,
          page_access_token: pageAccessToken,
          user_name: userDataFb.name
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, platform'
      })
      .select()
      .single();

    if (error) throw error;
    return account as MetaAccount;

  } catch (error) {
    console.error('Meta connection error:', error);
    throw error;
  }
}

export async function getMetaAccount(userId: string): Promise<MetaAccount | null> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'meta')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching Meta account:', error);
    return null;
  }

  return data as MetaAccount;
}

export async function disconnectMeta(userId: string): Promise<void> {
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'meta');

  if (error) throw error;
}

export async function publishToFacebook(
  userId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ success: boolean; postId?: string }> {
  try {
    const account = await getMetaAccount(userId);
    if (!account) throw new Error('Meta account not connected');

    const metadata = (account as any).metadata || {};
    const pageId = metadata.page_id;
    const pageAccessToken = metadata.page_access_token;

    if (!pageId || !pageAccessToken) {
      throw new Error('No Facebook Page found associated with this account');
    }

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let body: any = {
      message: content,
      access_token: pageAccessToken,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      body = {
        caption: content,
        url: mediaUrls[0],
        access_token: pageAccessToken,
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to post to Facebook');
    }

    return {
      success: true,
      postId: result.id || result.post_id,
    };

  } catch (error) {
    console.error('Error publishing to Facebook:', error);
    return { success: false };
  }
}