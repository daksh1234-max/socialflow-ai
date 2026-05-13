import * as AuthSession from 'expo-auth-session';
import { supabase } from '../supabase/client';

const TWITTER_CLIENT_ID = process.env.EXPO_PUBLIC_TWITTER_API_KEY || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_API_SECRET || '';
const REDIRECT_URI = 'socialflow-ai://callback';

const discovery = {
  authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
  tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
};

export interface TwitterAccount {
  id: string;
  user_id: string;
  platform: 'twitter';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  handle?: string;
}

export async function connectTwitter(): Promise<TwitterAccount> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User must be authenticated');

    const request = new AuthSession.AuthRequest({
      clientId: TWITTER_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      usePKCE: true,
      state: Math.random().toString(36).substring(7),
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error('Twitter authentication failed or was cancelled');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: TWITTER_CLIENT_ID,
        clientSecret: TWITTER_CLIENT_SECRET,
        code: result.params.code,
        redirectUri: REDIRECT_URI,
        extraParams: {
          code_verifier: request.codeVerifier || '',
        },
      },
      discovery
    );

    const userProfileResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });
    const userProfile = await userProfileResponse.json();
    const handle = userProfile?.data?.username || 'twitter_user';

    const expiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString()
      : null;

    const { data: account, error } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: userData.user.id,
        platform: 'twitter',
        platform_account_id: userProfile?.data?.id || handle,
        handle: handle,
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, platform'
      })
      .select()
      .single();

    if (error) throw error;
    return account as TwitterAccount;

  } catch (error) {
    console.error('Twitter connection error:', error);
    throw error;
  }
}

export async function getTwitterAccount(userId: string): Promise<TwitterAccount | null> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'twitter')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching Twitter account:', error);
    return null;
  }

  return data as TwitterAccount;
}

export async function disconnectTwitter(userId: string): Promise<void> {
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'twitter');

  if (error) throw error;
}

export async function publishTweet(
  userId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ success: boolean; tweetId?: string }> {
  try {
    const account = await getTwitterAccount(userId);
    if (!account) throw new Error('Twitter account not connected');

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || 'Failed to post tweet');
    }

    return {
      success: true,
      tweetId: result.data.id,
    };

  } catch (error) {
    console.error('Error publishing tweet:', error);
    return { success: false };
  }
}