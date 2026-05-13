import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { AIGeneratorCard } from '@/src/components/ai/AIGeneratorCard';
import { AIImageGenerator } from '@/src/components/ai/AIImageGenerator';
import { ArrowLeft, History, ChevronRight } from 'lucide-react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { AIHistoryList } from '@/src/components/ai/AIHistoryList';

export default function DynamicGeneratorScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  const title = {
    caption: 'Generate Caption',
    hashtags: 'Hashtag Generator',
    hook: 'Hook Builder',
    cta: 'Call-to-Action',
    rewrite: 'Platform Rewriter',
    image: 'AI Image Studio',
    best_time: 'Post Timing',
    trending_topics: 'Trend Analysis',
    video_script: 'Video Script Writer',
    bio: 'Smart Bio Optimizer'
  }[type as string] || 'AI Generator';

  return (
    <ScreenWrapper className="bg-background">
      <View className="flex-row items-center justify-between px-lg py-md">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-surfaceHighlight rounded-full">
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">{title}</Text>
        <TouchableOpacity 
          onPress={() => setShowHistory(!showHistory)} 
          className={showHistory ? 'p-2 bg-primary rounded-full' : 'p-2 bg-surfaceHighlight rounded-full'}
        >
          <History size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {type === 'image' ? (
            <AIImageGenerator />
          ) : (
            <AIGeneratorCard type={type as any} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {showHistory && (
        <Animated.View 
          entering={SlideInRight} 
          exiting={SlideOutRight}
          className="absolute top-0 right-0 bottom-0 w-[85%] bg-background border-l border-white/10 pt-20 z-50 shadow-2xl"
        >
          <View className="flex-row items-center px-lg mb-6">
            <TouchableOpacity onPress={() => setShowHistory(false)} className="mr-3">
              <ChevronRight size={24} color="#818CF8" />
            </TouchableOpacity>
            <Text className="text-white font-bold text-xl">History</Text>
          </View>
          <AIHistoryList />
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}
