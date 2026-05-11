import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { StatCard } from '@/src/components/dashboard/StatCard';
import { PostCard } from '@/src/components/posts/PostCard';
import { Users, Eye, MousePointerClick, Bell, Sparkles, Zap, ArrowRight, TrendingUp } from 'lucide-react-native';
import { Avatar } from '@/src/components/ui/Avatar';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useDashboardStats, useRecentPosts } from '@/src/hooks/api/useDashboard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { SuggestionsService, Suggestion } from '@/src/services/ai/suggestions';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: posts, isLoading: postsLoading } = useRecentPosts();

  useEffect(() => {
    async function loadSuggestions() {
      if (user?.id) {
        const data = await SuggestionsService.analyzeUserHistory(user.id);
        setSuggestions(data);
        setIsSuggestionsLoading(false);
      }
    }
    loadSuggestions();
  }, [user?.id]);

  const metrics = stats ? [
    { id: '1', title: 'Total Views', value: stats.views.toLocaleString(), icon: Eye, trend: { value: '12%', isPositive: true } },
    { id: '2', title: 'Followers', value: stats.followers.toLocaleString(), icon: Users, trend: { value: '4%', isPositive: true } },
    { id: '3', title: 'Engagement', value: stats.engagement.toLocaleString(), icon: MousePointerClick, trend: { value: '2%', isPositive: false } },
  ] : [];

  const renderHeader = () => (
    <View className="mb-lg">
      <View className="mb-xl">
        <Text className="text-3xl font-bold text-textPrimary mb-xs">
          Hi, {user?.user_metadata?.full_name?.split(' ')[0] || 'There'} 👋
        </Text>
        <Text className="text-textSecondary text-base">Here's your social performance</Text>
      </View>

      <Text className="text-lg font-semibold text-textPrimary mb-md">Overview</Text>
      <View className="flex-row">
        {statsLoading ? (
          <View className="flex-row gap-x-md">
            <Skeleton className="w-[200px] h-32" />
            <Skeleton className="w-[200px] h-32" />
          </View>
        ) : (
          <FlatList
            data={metrics}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="mr-md w-[80vw] max-w-[200px]">
                <StatCard {...item} />
              </View>
            )}
          />
        )}
      </View>

      {/* AI Insights Section */}
      <View className="mt-xl">
        <View className="flex-row items-center justify-between mb-md">
          <View className="flex-row items-center">
            <Sparkles size={20} color="#818CF8" className="mr-2" />
            <Text className="text-lg font-semibold text-textPrimary">AI Insights</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/ai')}>
            <Text className="text-primary font-medium text-xs">AI Studio</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-2 px-2">
          {isSuggestionsLoading ? (
            [1, 2].map((i) => <Skeleton key={i} className="w-64 h-32 rounded-2xl mr-4" />)
          ) : (
            suggestions.map((suggestion, index) => (
              <Animated.View key={suggestion.id} entering={FadeInRight.delay(index * 100)}>
                <GlassCard className="w-72 mr-4 p-4 border-primary/20 bg-primary/5">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-primary/20 p-1.5 rounded-lg mr-2">
                      {suggestion.type === 'content' ? <Zap size={14} color="#818CF8" /> : <TrendingUp size={14} color="#818CF8" />}
                    </View>
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>{suggestion.title}</Text>
                  </View>
                  <Text className="text-textSecondary text-xs mb-4 h-8" numberOfLines={2}>
                    {suggestion.description}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => router.push({
                      pathname: '/(app)/create',
                      params: { ...suggestion.payload.params, aiAction: suggestion.payload.type }
                    })}
                    className="flex-row items-center justify-end"
                  >
                    <Text className="text-primary text-xs font-bold mr-1">{suggestion.actionLabel}</Text>
                    <ArrowRight size={12} color="#818CF8" />
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>
      
      <View className="flex-row items-center justify-between mt-xl mb-md">
        <Text className="text-lg font-semibold text-textPrimary">Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/calendar')}>
          <Text className="text-primary font-medium">View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper scrollable={false} withBottomInset={false}>
      <Header 
        title="SocialFlow" 
        rightElement={
          <View className="flex-row items-center space-x-md">
            <TouchableOpacity className="relative bg-surfaceHighlight p-2 rounded-full mr-sm">
              <Bell color="#F8FAFC" size={20} />
              <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
              <Avatar fallback={user?.user_metadata?.full_name || 'U'} size="sm" />
            </TouchableOpacity>
          </View>
        } 
      />
      
      {postsLoading ? (
        <View className="p-xl gap-y-md">
          {renderHeader()}
          <Skeleton className="w-full h-40 mb-md" />
          <Skeleton className="w-full h-40 mb-md" />
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item as any} />}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-textSecondary text-center py-xl">No posts found. Create one!</Text>
          }
        />
      )}
    </ScreenWrapper>
  );
}
