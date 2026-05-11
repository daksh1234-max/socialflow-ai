import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { AIFeatureGrid } from '@/src/components/ai/AIFeatureGrid';
import { AIResultCard } from '@/src/components/ai/AIResultCard';
import { useAIStore } from '@/src/stores/aiStore';
import { useRouter } from 'expo-router';
import { 
  Sparkles, 
  Plus, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Zap,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '@/src/components/ui/GlassCard';

export default function AIHubScreen() {
  const { history } = useAIStore();
  const router = useRouter();

  const recentGenerations = history.slice(0, 5);

  const QUICK_ACTIONS = [
    { id: 'caption', label: 'New Caption', icon: MessageSquare, color: 'text-indigo-400' },
    { id: 'image', label: 'New Image', icon: ImageIcon, color: 'text-violet-400' },
    { id: 'trending_topics', label: 'Trending', icon: TrendingUp, color: 'text-rose-400' },
  ];

  return (
    <ScreenWrapper scrollable className="bg-background">
      <View className="px-lg py-md">
        <Text className="text-3xl font-bold text-white mb-2">
          AI <Text className="text-primary">Studio</Text>
        </Text>
        <Text className="text-textSecondary text-sm mb-6">
          Unleash your creativity with professional AI tools
        </Text>
      </View>

      <AIFeatureGrid 
        onFeatureSelect={(type) => router.push(`/ai/generate/${type}`)}
        className="mb-8"
      />

      {recentGenerations.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-lg mb-4">
            <Text className="text-white font-bold text-lg">Recent Creations</Text>
            <TouchableOpacity onPress={() => router.push('/ai/history')} className="flex-row items-center">
              <Text className="text-primary text-xs font-medium mr-1">See All</Text>
              <ArrowRight size={14} color="#818CF8" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 12 }}
          >
            {recentGenerations.map((item, index) => (
              <View key={index} className="w-64 mr-4">
                <AIResultCard 
                  result={typeof item === 'string' ? item : item.text}
                  type="Caption"
                  platform="Instagram"
                  className="mb-0 h-48"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="px-lg mb-8">
        <Text className="text-white font-bold text-lg mb-4">Quick Actions</Text>
        <View className="flex-row gap-x-4">
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity 
              key={action.id}
              onPress={() => router.push(`/ai/generate/${action.id}`)}
              className="flex-1 bg-surfaceHighlight/50 border border-white/5 p-4 rounded-2xl items-center"
            >
              <action.icon size={24} color={action.id === 'image' ? '#A78BFA' : action.id === 'caption' ? '#818CF8' : '#FB7185'} />
              <Text className="text-textPrimary text-[10px] font-bold mt-2 text-center uppercase tracking-wider">
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="px-lg mb-32">
        <GlassCard className="bg-primary/10 border-primary/20 p-6">
          <View className="flex-row items-center mb-4">
            <Zap size={20} color="#F59E0B" fill="#F59E0B" className="mr-2" />
            <Text className="text-white font-bold">Smart Suggestions</Text>
          </View>
          <View className="gap-y-4">
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-3" />
              <Text className="text-textPrimary text-sm flex-1">
                "Digital Marketing" is trending in your niche. Generate a post about it?
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 mr-3" />
              <Text className="text-textPrimary text-sm flex-1">
                Best time to post today: <Text className="font-bold text-emerald-400">6:00 PM</Text> for maximum engagement.
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <TouchableOpacity 
        className="absolute bottom-8 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40"
        style={{ elevation: 10 }}
        onPress={() => router.push('/ai/generate/caption')}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
