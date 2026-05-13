import * as AuthSession from 'expo-auth-session';
import { supabase } from '../supabase/client';

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REDIRECT_URI = 'https://rfilxmrtqcrvfjlsawdj.supabase.co/auth/v1/callback';

const discovery = {
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
};

export interface LinkedInAccount {
  id: string;
  user_id: string;
  platform: 'linkedin';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  handle?: string;
  urn?: string;
}

export async function connectLinkedIn(): Promise<LinkedInAccount> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User must be authenticated');

    const request = new AuthSession.AuthRequest({
      clientId: LINKEDIN_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error('LinkedIn authentication failed or was cancelled');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: LINKEDIN_CLIENT_ID,
        clientSecret: LINKEDIN_CLIENT_SECRET,
        code: result.params.code,
        redirectUri: REDIRECT_URI,
      },
      discovery
    );

    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });
    const profileData = await profileResponse.json();
    const urn = `urn:li:person:${profileData.id}`;
    const fullName = `${profileData.localizedFirstName} ${profileData.localizedLastName}`;

    const expiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString()
      : null;

    const { data: account, error } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: userData.user.id,
        platform: 'linkedin',
        platform_account_id: profileData.id,
        handle: fullName,
        access_token: tokenResponse.accessToken,
        token_expires_at: expiresAt,
        metadata: {
          urn: urn,
          first_name: profileData.localizedFirstName,
          last_name: profileData.localizedLastName
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, platform'
      })
      .select()
      .single();

    if (error) throw error;
    return account as LinkedInAccount;

  } catch (error) {
    console.error('LinkedIn connection error:', error);
    throw error;
  }
}

export async function getLinkedInAccount(userId: string): Promise<LinkedInAccount | null> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'linkedin')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching LinkedIn account:', error);
    return null;
  }

  return data as LinkedInAccount;
}

export async function disconnectLinkedIn(userId: string): Promise<void> {
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'linkedin');

  if (error) throw error;
}

export async function publishLinkedInPost(
  userId: string,
  content: string,
  mediaUrls?: string[]
): Promise<{ success: boolean; postId?: string }> {
  try {
    const account = await getLinkedInAccount(userId);
    if (!account) throw new Error('LinkedIn account not connected');

    const urn = (account as any).metadata?.urn;
    if (!urn) throw new Error('LinkedIn URN missing');

    const body: any = {
      author: urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (mediaUrls && mediaUrls.length > 0) {
      body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      body.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: mediaUrls[0],
          description: {
            text: 'Post image',
          },
          title: {
            text: 'SocialFlow AI Image',
          },
        },
      ];
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to post to LinkedIn');
    }

    return {
      success: true,
      postId: result.id,
    };

  } catch (error) {
    console.error('Error publishing to LinkedIn:', error);
    return { success: false };
  }
}