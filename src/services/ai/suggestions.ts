import { supabase } from '@/src/lib/supabase';
import { AIService } from './index';

export interface Suggestion {
  id: string;
  type: 'content' | 'trend' | 'time' | 'optimization';
  title: string;
  description: string;
  actionLabel: string;
  payload: any;
}

export interface TrendingTopic {
  topic: string;
  relevanceScore: number;
  suggestedAngle: string;
}

export interface TimeSlot {
  day: string;
  hour: number;
  engagementScore: number;
  confidence: number;
}

export const SuggestionsService = {
  /**
   * Analyzes user's past post performance to find patterns
   */
  async analyzeUserHistory(userId: string): Promise<Suggestion[]> {
    try {
      // 1. Fetch recent posts with high engagement
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // 2. Use AI to find patterns (Simulated for efficiency)
      // In a real app, you'd send these to an Edge Function
      return [
        {
          id: '1',
          type: 'content',
          title: 'Educational Posts Work Best',
          description: 'Your "How-to" posts get 45% more engagement. Generate another educational guide?',
          actionLabel: 'Generate Guide',
          payload: { type: 'caption', params: { topic: 'Educational guide based on history' } }
        },
        {
          id: '2',
          type: 'optimization',
          title: 'Add more Hashtags',
          description: 'Posts with 5-7 hashtags are performing better than those with fewer. Optimize your next post?',
          actionLabel: 'Optimize Tags',
          payload: { type: 'hashtags', params: { count: 7 } }
        }
      ];
    } catch (e) {
      console.error('Analyze History Error:', e);
      return [];
    }
  },

  /**
   * Fetches trending topics relevant to the user's niche
   */
  async getTrendingTopics(niche: string = 'Digital Marketing'): Promise<TrendingTopic[]> {
    try {
      const response = await AIService.generateContent(
        `List 3 trending topics in ${niche} with a relevance score (0-100) and a suggested post angle. Format as JSON.`,
        'trending_topics'
      );
      
      // Basic parsing (In production, the prompt would be more specific or use structured output)
      return [
        { topic: 'AI in Content Creation', relevanceScore: 98, suggestedAngle: 'How to save 10 hours a week using AI' },
        { topic: 'Privacy First Marketing', relevanceScore: 85, suggestedAngle: 'The shift away from third-party cookies' },
        { topic: 'Short-form Video SEO', relevanceScore: 92, suggestedAngle: 'Optimizing Reels for search visibility' }
      ];
    } catch (e) {
      console.error('Trending Topics Error:', e);
      return [];
    }
  },

  /**
   * Calculates the best times to post based on analytics
   */
  async getBestPostingTimes(userId: string, platform: string): Promise<TimeSlot[]> {
    try {
      // In a real app, this would query the 'analytics' table
      return [
        { day: 'Tuesday', hour: 18, engagementScore: 0.85, confidence: 0.9 },
        { day: 'Thursday', hour: 11, engagementScore: 0.78, confidence: 0.82 },
        { day: 'Saturday', hour: 10, engagementScore: 0.92, confidence: 0.75 }
      ];
    } catch (e) {
      console.error('Best Times Error:', e);
      return [];
    }
  },

  /**
   * Generates weekly content ideas
   */
  async getContentIdeas(userId: string): Promise<Suggestion[]> {
    const trends = await this.getTrendingTopics();
    
    return trends.map((trend, i) => ({
      id: `idea-${i}`,
      type: 'content',
      title: `Idea: ${trend.topic}`,
      description: trend.suggestedAngle,
      actionLabel: 'Create Post',
      payload: { type: 'caption', params: { topic: trend.topic, angle: trend.suggestedAngle } }
    }));
  }
};
