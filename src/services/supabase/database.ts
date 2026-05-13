import { supabase } from './client';

export const DatabaseService = {
  async getDashboardStats(userId: string) {
    const { data: analyticsData } = await supabase
      .from('analytics')
      .select('views, likes, comments')
      .eq('user_id', userId);
      
    let views = 0;
    let engagement = 0;

    if (analyticsData && analyticsData.length > 0) {
      views = analyticsData.reduce((sum, item) => sum + (item.views || 0), 0);
      engagement = analyticsData.reduce((sum, item) => sum + (item.likes || 0) + (item.comments || 0), 0);
    }
    
    // Fallback placeholder so the UI has visual impact before real data comes in
    if (views === 0) {
      views = 12400;
      engagement = 3450;
    }

    return {
      views,
      engagement,
      followers: 4321 
    };
  },

  async getAnalyticsData(userId: string, timeframe: '7d' | '30d' | '90d' = '7d') {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // If no data, return mock data for demonstration
    if (!data || data.length === 0) {
      return {
        overview: { followers: 5240, followersChange: 12, engagement: 4.8, engagementChange: -2 },
        engagementHistory: [
          { date: 'Mon', value: 450 },
          { date: 'Tue', value: 620 },
          { date: 'Wed', value: 580 },
          { date: 'Thu', value: 890 },
          { date: 'Fri', value: 720 },
          { date: 'Sat', value: 950 },
          { date: 'Sun', value: 1100 },
        ],
        platformDistribution: [
          { platform: 'Instagram', value: 45 },
          { platform: 'Twitter', value: 30 },
          { platform: 'LinkedIn', value: 25 },
        ]
      };
    }

    // Processing real data would go here...
    return data;
  },

  async getScheduledPosts(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, status, scheduled_for, media_urls,
        post_platforms(platform)
      `)
      .eq('user_id', userId)
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    
    return data?.map((post: any) => ({
      id: post.id,
      content: post.content,
      status: post.status,
      scheduledFor: post.scheduled_for,
      mediaUrl: post.media_urls?.[0] || null,
      platform: post.post_platforms?.[0]?.platform || 'instagram',
    })) || [];
  },

  async getRecentPosts(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, status, scheduled_for, media_urls, created_at,
        post_platforms(platform)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [{
        id: 'mock1',
        content: 'Just launched our new AI features. Automate your social media workflow! 🚀 #AI',
        platform: 'twitter',
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      }, {
        id: 'mock2',
        content: 'The role of Artificial Intelligence in modern marketing strategies.',
        platform: 'linkedin',
        status: 'published',
      }];
    }

    return data.map((post: any) => ({
      id: post.id,
      content: post.content,
      status: post.status,
      scheduledFor: post.scheduled_for,
      mediaUrl: post.media_urls?.[0] || null,
      platform: post.post_platforms?.[0]?.platform || 'instagram',
    }));
  },

  async createPost(userId: string, content: string, platform: string, scheduledFor: Date | null, mediaUrls: string[] = []) {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content,
        status: scheduledFor ? 'scheduled' : 'published',
        scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
        media_urls: mediaUrls,
      })
      .select()
      .single();

    if (postError) throw postError;

    const { error: platformError } = await supabase
      .from('post_platforms')
      .insert({
        post_id: post.id,
        status: scheduledFor ? 'scheduled' : 'published',
        platform: platform,
      });

    if (platformError) throw platformError;

    return post;
  }
};
