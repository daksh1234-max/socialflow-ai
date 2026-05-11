import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseService } from '@/src/services/supabase/database';
import { useAuthStore } from '@/src/stores/authStore';

export function useCreatePost() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, platform, scheduledFor }: { content: string, platform: string, scheduledFor: Date | null }) => {
      if (!user) throw new Error("Not logged in");
      return DatabaseService.createPost(user.id, content, platform, scheduledFor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentPosts', user?.id] });
    }
  });
}
