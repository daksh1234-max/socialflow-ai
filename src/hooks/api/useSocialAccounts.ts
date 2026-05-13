import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase/client';
import { useAuthStore } from '@/src/stores/authStore';
import { connectTwitter } from '@/src/services/social/twitter';
import { connectMeta } from '@/src/services/social/meta';
import { connectLinkedIn } from '@/src/services/social/linkedin';

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  platform_account_id: string;
  handle: string;
  avatar_url?: string;
  created_at: string;
}

export function useSocialAccounts() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['socialAccounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!user) throw new Error('Not logged in');

      switch (platform.toLowerCase()) {
        case 'twitter':
          return await connectTwitter();
        case 'meta':
          return await connectMeta();
        case 'linkedin':
          return await connectLinkedIn();
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts', user?.id] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts', user?.id] });
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    connect: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
}
