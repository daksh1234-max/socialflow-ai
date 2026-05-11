import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '@/src/services/supabase/database';
import { useAuthStore } from '@/src/stores/authStore';

export function useDashboardStats() {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: () => DatabaseService.getDashboardStats(user!.id),
    enabled: !!user?.id,
  });
}

export function useRecentPosts(limit: number = 10) {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['recentPosts', user?.id, limit],
    queryFn: () => DatabaseService.getRecentPosts(user!.id, limit),
    enabled: !!user?.id,
  });
}
