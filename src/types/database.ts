export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_generations: {
        Row: {
          id: string
          user_id: string | null
          prompt: string
          result: string
          generation_type: string
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          prompt: string
          result: string
          generation_type: string
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          prompt?: string
          result?: string
          generation_type?: string
          model_used?: string | null
          created_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: string
          user_id: string | null
          platform: string
          platform_account_id: string
          handle: string | null
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          platform: string
          platform_account_id: string
          handle?: string | null
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          platform?: string
          platform_account_id?: string
          handle?: string | null
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string | null
          content: string
          media_urls: string[] | null
          status: string | null
          scheduled_for: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          content: string
          media_urls?: string[] | null
          status?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          content?: string
          media_urls?: string[] | null
          status?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_platforms: {
        Row: {
          id: string
          post_id: string | null
          social_account_id: string | null
          status: string | null
          external_post_id: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          social_account_id?: string | null
          status?: string | null
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          social_account_id?: string | null
          status?: string | null
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string | null
          post_id: string | null
          social_account_id: string | null
          likes: number | null
          comments: number | null
          shares: number | null
          views: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          post_id?: string | null
          social_account_id?: string | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          views?: number | null
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          post_id?: string | null
          social_account_id?: string | null
          likes?: number | null
          comments?: number | null
          shares?: number | null
          views?: number | null
          recorded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          message: string
          read: boolean | null
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          message: string
          read?: boolean | null
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string
          message?: string
          read?: boolean | null
          action_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      schedule_post: {
        Args: {
          p_post_id: string
          p_run_at: string
        }
        Returns: boolean
      }
      get_best_posting_times: {
        Args: {
          p_user_id: string
          p_platform: string
        }
        Returns: Json
      }
      get_trending_hashtags: {
        Args: {
          p_platform: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
