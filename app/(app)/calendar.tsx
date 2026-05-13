import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Badge } from '@/src/components/ui/Badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  Instagram,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '@/src/services/supabase/database';
import { useAuthStore } from '@/src/stores/authStore';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { useRouter } from 'expo-router';

const PLATFORM_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

export default function CalendarScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate 14 days starting from the beginning of current week
  const days = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 14 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['scheduledPosts', user?.id, selectedDate.toDateString()],
    queryFn: () => DatabaseService.getScheduledPosts(user!.id, selectedDate),
    enabled: !!user,
  });

  return (
    <ScreenWrapper scrollable>
      <Header title="Content Calendar" />
      
      <View className="py-md">
        {/* Horizontal Day Picker */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-lg flex-row gap-x-sm mb-lg"
          contentContainerStyle={{ paddingRight: 40 }}
        >
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <TouchableOpacity 
                key={i}
                onPress={() => setSelectedDate(day)}
                className={cn(
                  "items-center justify-center w-16 h-20 rounded-2xl border",
                  isSelected ? "bg-indigo-600 border-indigo-400" : "bg-surface border-white/5",
                  isToday && !isSelected && "border-indigo-500/50"
                )}
              >
                <Text className={cn("text-xs font-medium uppercase", isSelected ? "text-white/70" : "text-textSecondary")}>
                  {format(day, 'EEE')}
                </Text>
                <Text className={cn("text-xl font-bold mt-1", isSelected ? "text-white" : "text-textPrimary")}>
                  {format(day, 'd')}
                </Text>
                {isToday && !isSelected && <View className="w-1 h-1 bg-indigo-500 rounded-full mt-1" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View className="px-lg pb-32">
          <View className="flex-row justify-between items-center mb-md">
            <Text className="text-xl font-bold text-textPrimary">
              {isSameDay(selectedDate, new Date()) ? "Today's Schedule" : format(selectedDate, 'MMMM d')}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
              <Text className="text-primary font-medium text-xs">Jump to Today</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#818CF8" className="mt-xl" />
          ) : posts && posts.length > 0 ? (
            <View className="gap-y-md">
              {posts.map((post) => {
                const Icon = PLATFORM_ICONS[post.platform.toLowerCase()] || MessageCircle;
                return (
                  <GlassCard key={post.id} className="p-md">
                    <View className="flex-row gap-x-md">
                      {post.mediaUrl && (
                        <Image 
                          source={{ uri: post.mediaUrl }} 
                          className="w-20 h-20 rounded-lg" 
                        />
                      )}
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-row items-center bg-surfaceHighlight/50 px-2 py-1 rounded-md mb-2">
                            <Icon size={12} color="#94A3B8" />
                            <Text className="text-textSecondary text-[10px] ml-1 uppercase font-bold tracking-wider">
                              {post.platform}
                            </Text>
                          </View>
                          <Badge variant={post.status === 'published' ? 'success' : 'info'}>
                            {post.status}
                          </Badge>
                        </View>
                        
                        <Text className="text-textPrimary text-sm mb-2" numberOfLines={2}>
                          {post.content}
                        </Text>
                        
                        <View className="flex-row items-center">
                          <Clock size={12} color="#94A3B8" />
                          <Text className="text-textSecondary text-xs ml-1">
                            {format(new Date(post.scheduledFor), 'h:mm a')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          ) : (
            <GlassCard className="p-xl items-center border-dashed border-white/10">
              <CalendarIcon size={32} color="#475569" />
              <Text className="text-textSecondary mt-md text-center">No posts scheduled for this day</Text>
              <TouchableOpacity 
                onPress={() => router.push('/(app)/create')}
                className="mt-lg bg-indigo-600/20 px-4 py-2 rounded-full"
              >
                <Text className="text-indigo-400 font-bold text-xs">+ Schedule Post</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/(app)/create')}
        className="absolute bottom-8 right-8 w-16 h-16 bg-emerald-600 rounded-full items-center justify-center shadow-lg shadow-emerald-500/50"
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
