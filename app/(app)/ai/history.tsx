import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { AIHistoryList } from '@/src/components/ai/AIHistoryList';
import { useAIStore } from '@/src/stores/aiStore';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { 
  BarChart3, 
  Heart, 
  Sparkles, 
  Trash2, 
  Download 
} from 'lucide-react-native';

export default function AIHistoryScreen() {
  const { history, clearHistory } = useAIStore();

  const stats = [
    { label: 'Total', value: history.length, icon: Sparkles, color: '#818CF8' },
    { label: 'Favorites', value: 0, icon: Heart, color: '#EF4444' }, // Placeholder
    { label: 'Saved', value: 0, icon: Download, color: '#10B981' }, // Placeholder
  ];

  return (
    <ScreenWrapper className="bg-background">
      <Header title="Generation History" />
      
      <View className="px-lg py-md mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {stats.map((stat, i) => (
            <GlassCard key={i} className="mr-4 w-32 p-4 items-center">
              <View className="bg-surfaceHighlight p-2 rounded-lg mb-2">
                <stat.icon size={20} color={stat.color} />
              </View>
              <Text className="text-white font-bold text-lg">{stat.value}</Text>
              <Text className="text-textSecondary text-[10px] uppercase tracking-tighter">{stat.label}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <AIHistoryList />
      </View>

      {history.length > 0 && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity 
            onPress={() => clearHistory()}
            className="flex-row items-center bg-error/10 px-6 py-3 rounded-full border border-error/20"
          >
            <Trash2 size={16} color="#EF4444" className="mr-2" />
            <Text className="text-error font-bold text-sm">Clear History</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenWrapper>
  );
}
