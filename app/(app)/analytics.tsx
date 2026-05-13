import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { BarChart } from '@/src/components/charts/BarChart';
import { BottomSheet } from '@/src/components/layout/BottomSheet';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Eye, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  Clock,
  Check
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '@/src/services/supabase/database';
import { useAuthStore } from '@/src/stores/authStore';
import { cn } from '@/src/lib/utils';
import * as Haptics from 'expo-haptics';

const TIMEFRAME_OPTIONS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
] as const;

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [showTimeframeSheet, setShowTimeframeSheet] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', user?.id, timeframe],
    queryFn: () => DatabaseService.getAnalyticsData(user!.id, timeframe),
    enabled: !!user,
  });

  const handleTimeframeChange = (value: '7d' | '30d' | '90d') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeframe(value);
    setShowTimeframeSheet(false);
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Header title="Analytics" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#818CF8" />
        </View>
      </ScreenWrapper>
    );
  }

  const { overview, engagementHistory, platformDistribution } = data;

  return (
    <ScreenWrapper scrollable>
      <Header title="Performance" />
      
      <View className="p-lg gap-y-xl pb-32">
        {/* Timeframe Selector */}
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-textPrimary">Overview</Text>
          <TouchableOpacity 
            onPress={() => setShowTimeframeSheet(true)}
            className="flex-row items-center bg-surfaceHighlight/50 px-3 py-1.5 rounded-full border border-white/5"
          >
            <Text className="text-textSecondary text-xs mr-1">
              {TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe)?.label}
            </Text>
            <ChevronDown size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-md">
          <GlassCard className="flex-1 min-w-[140px] p-md">
            <View className="flex-row justify-between items-start mb-2">
              <View className="p-2 bg-indigo-500/10 rounded-lg">
                <Users size={18} color="#818CF8" />
              </View>
              <View className="flex-row items-center">
                <Text className="text-emerald-400 text-xs font-bold">+{overview.followersChange}%</Text>
              </View>
            </View>
            <Text className="text-textSecondary text-xs uppercase font-semibold">Total Followers</Text>
            <Text className="text-textPrimary text-2xl font-bold mt-1">{overview.followers.toLocaleString()}</Text>
          </GlassCard>

          <GlassCard className="flex-1 min-w-[140px] p-md">
            <View className="flex-row justify-between items-start mb-2">
              <View className="p-2 bg-emerald-500/10 rounded-lg">
                <Activity size={18} color="#10B981" />
              </View>
              <View className="flex-row items-center">
                <Text className="text-error text-xs font-bold">{overview.engagementChange}%</Text>
              </View>
            </View>
            <Text className="text-textSecondary text-xs uppercase font-semibold">Engagement</Text>
            <Text className="text-textPrimary text-2xl font-bold mt-1">{overview.engagement}%</Text>
          </GlassCard>
        </View>

        {/* Engagement Chart */}
        <View>
          <Text className="text-xl font-bold text-textPrimary mb-md">Engagement Growth</Text>
          <GlassCard className="p-md py-xl items-center">
            <BarChart data={engagementHistory} />
          </GlassCard>
        </View>

        {/* Platform Breakdown */}
        <View>
          <Text className="text-xl font-bold text-textPrimary mb-md">Platform Reach</Text>
          <GlassCard className="p-md">
            {platformDistribution.map((item, index) => (
              <View key={item.platform} className={cn("flex-row items-center py-sm", index !== 0 && "border-t border-white/5")}>
                <View className="flex-1">
                  <View className="flex-row justify-between items-end mb-1.5">
                    <Text className="text-textPrimary font-semibold">{item.platform}</Text>
                    <Text className="text-textSecondary text-xs">{item.value}%</Text>
                  </View>
                  <View className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${item.value}%` }} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Action Card */}
        <GlassCard className="bg-indigo-600/20 border-indigo-500/30 p-xl items-center">
          <TrendingUp size={32} color="#818CF8" />
          <Text className="text-textPrimary font-bold text-lg mt-md text-center">Post performance is up!</Text>
          <Text className="text-textSecondary text-sm text-center mt-sm">
            Your recent AI-generated posts have 15% more engagement than average.
          </Text>
        </GlassCard>
      </View>

      <BottomSheet 
        visible={showTimeframeSheet} 
        onClose={() => setShowTimeframeSheet(false)}
      >
        <View className="px-md pb-md">
          <View className="flex-row items-center mb-6">
            <Clock size={20} color="#818CF8" className="mr-2" />
            <Text className="text-white font-bold text-xl">Select Timeframe</Text>
          </View>
          
          <View className="gap-y-3">
            {TIMEFRAME_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.value}
                onPress={() => handleTimeframeChange(option.value)}
                className={cn(
                  "flex-row items-center justify-between p-4 rounded-xl",
                  timeframe === option.value ? "bg-primary/20 border border-primary/40" : "bg-surfaceHighlight border border-white/5"
                )}
              >
                <Text className={cn(
                  "font-medium text-base",
                  timeframe === option.value ? "text-primary" : "text-textPrimary"
                )}>
                  {option.label}
                </Text>
                {timeframe === option.value && (
                  <Check size={20} color="#818CF8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>
    </ScreenWrapper>
  );
}

