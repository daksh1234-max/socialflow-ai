import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { BottomSheet } from '@/src/components/layout/BottomSheet';
import {
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit3,
  Instagram,
  Twitter,
  Linkedin,
  MessageCircle,
  MoreVertical
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/services/supabase/client';
import { useAuthStore } from '@/src/stores/authStore';
import { useToastStore } from '@/src/components/feedback/Toast';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from '@/src/lib/utils';
import * as Haptics from 'expo-haptics';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

type ScheduledPost = {
  id: string;
  content: string;
  status: string;
  scheduledFor: string;
  mediaUrl: string | null;
  platform: string;
};

export default function ScheduleManagementScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToastStore();
  const queryClient = useQueryClient();

  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  const { data: posts, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['allScheduledPosts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, status, scheduled_for, media_urls,
          post_platforms(platform)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      return data?.map((post: any) => ({
        id: post.id,
        content: post.content,
        status: post.status,
        scheduledFor: post.scheduled_for,
        mediaUrl: post.media_urls?.[0] || null,
        platform: post.post_platforms?.[0]?.platform || 'unknown',
      })) as ScheduledPost[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allScheduledPosts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      showToast('Post deleted', 'success');
      setShowOptionsSheet(false);
    },
    onError: () => {
      showToast('Failed to delete post', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ postId, newDate }: { postId: string, newDate: Date }) => {
      const { error } = await supabase
        .from('posts')
        .update({ scheduled_for: newDate.toISOString() })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allScheduledPosts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      showToast('Schedule updated', 'success');
      setShowDatePicker(false);
      setShowOptionsSheet(false);
    },
    onError: () => {
      showToast('Failed to update schedule', 'error');
    }
  });

  const handleDelete = (postId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteMutation.mutate(postId);
  };

  const handleEditTime = () => {
    if (selectedPost) {
      setEditDate(new Date(selectedPost.scheduledFor));
      setShowOptionsSheet(false);
      setShowDatePicker(true);
    }
  };

  const saveNewTime = () => {
    if (selectedPost) {
      updateMutation.mutate({ postId: selectedPost.id, newDate: editDate });
    }
  };

  const openOptions = (post: ScheduledPost) => {
    setSelectedPost(post);
    setShowOptionsSheet(true);
  };

  const renderPost = ({ item }: { item: ScheduledPost }) => {
    const Icon = PLATFORM_ICONS[item.platform.toLowerCase()] || MessageCircle;

    return (
      <GlassCard className="p-md mb-md border-white/10">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center bg-surfaceHighlight/50 px-2 py-1 rounded-md">
            <Icon size={12} color="#94A3B8" />
            <Text className="text-textSecondary text-[10px] ml-1 uppercase font-bold tracking-wider">
              {item.platform}
            </Text>
          </View>

          <TouchableOpacity onPress={() => openOptions(item)} className="p-1">
            <MoreVertical size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-x-md">
          {item.mediaUrl && (
            <Image
              source={{ uri: item.mediaUrl }}
              className="w-16 h-16 rounded-lg"
              resizeMode="cover"
            />
          )}
          <View className="flex-1">
            <Text className="text-textPrimary text-sm mb-3" numberOfLines={3}>
              {item.content}
            </Text>

            <View className="flex-row items-center mt-auto">
              <Clock size={12} color="#818CF8" />
              <Text className="text-indigo-400 font-medium text-xs ml-1">
                {format(new Date(item.scheduledFor), 'MMM d, yyyy • h:mm a')}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <ScreenWrapper className="bg-background">
      <Header
        title="Scheduled Posts"
        onBack={() => router.push('/(app)/dashboard')}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#818CF8" />
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#818CF8"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <GlassCard className="p-xl items-center border-dashed border-white/10 w-full">
                <CalendarIcon size={40} color="#475569" />
                <Text className="text-textPrimary font-bold text-lg mt-md">No Scheduled Posts</Text>
                <Text className="text-textSecondary text-center mt-sm mb-lg">
                  You don't have any posts scheduled for the future.
                </Text>
                <Button
                  onPress={() => router.push('/(app)/create')}
                  className="bg-indigo-600 w-full"
                >
                  Create New Post
                </Button>
              </GlassCard>
            </View>
          }
        />
      )}

      <BottomSheet visible={showOptionsSheet} onClose={() => setShowOptionsSheet(false)}>
        <View className="px-md pb-md">
          <Text className="text-white font-bold text-xl mb-6">Manage Post</Text>

          <View className="gap-y-3">
            <TouchableOpacity
              onPress={handleEditTime}
              className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl border border-white/5"
            >
              <Edit3 size={20} color="#818CF8" className="mr-3" />
              <Text className="text-textPrimary font-medium text-base">Change Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => selectedPost && handleDelete(selectedPost.id)}
              disabled={deleteMutation.isPending}
              className="flex-row items-center bg-error/10 p-4 rounded-xl border border-error/20"
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" className="mr-3" />
              ) : (
                <Trash2 size={20} color="#EF4444" className="mr-3" />
              )}
              <Text className="text-error font-medium text-base">Delete Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {(showDatePicker || (Platform.OS === 'ios' && showDatePicker)) && (
        <BottomSheet visible={showDatePicker} onClose={() => setShowDatePicker(false)}>
          <View className="px-md pb-xl">
            <Text className="text-white font-bold text-xl mb-4">Reschedule</Text>
            <View className="bg-surfaceHighlight rounded-xl mb-6 p-4">
              <DateTimePicker
                value={editDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setEditDate(selectedDate);
                }}
                themeVariant="dark"
                minimumDate={new Date()}
              />
            </View>
            <Button
              onPress={saveNewTime}
              loading={updateMutation.isPending}
              className="bg-emerald-600"
            >
              Save New Time
            </Button>
          </View>
        </BottomSheet>
      )}
    </ScreenWrapper>
  );
}