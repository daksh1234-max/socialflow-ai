import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Clipboard } from 'react-native';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Copy, 
  Edit2, 
  RefreshCw, 
  Heart, 
  Send,
  AlertCircle
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useAI } from '@/src/hooks/useAI';
import { AIStreamingText } from './AIStreamingText';

const PLATFORMS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram' },
  { id: 'facebook', icon: Facebook, label: 'Facebook' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { id: 'twitter', icon: Twitter, label: 'Twitter' },
];

const TONES = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Bold'];
const LENGTHS = ['Short', 'Medium', 'Long'];

export function AIGeneratorCard() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [showResult, setShowResult] = useState(false);

  const { generate, regenerate, isGenerating, lastResult, error, cancel } = useAI();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowResult(true);
    
    try {
      await generate('caption', {
        topic,
        tone: tone.toLowerCase(),
        platform,
        length: length.toLowerCase(),
        includeCTA: true
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    const text = typeof lastResult === 'string' ? lastResult : lastResult?.text;
    if (text) {
      Clipboard.setString(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <GlassCard className="m-4 bg-surface/70 backdrop-blur-xl">
      <View className="mb-4">
        <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">What's the topic?</Text>
        <TextInput
          className="bg-background/50 text-textPrimary p-4 rounded-2xl border border-white/5 min-h-[100px]"
          placeholder="Enter a topic or describe your post..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
          value={topic}
          onChangeText={setTopic}
          textAlignVertical="top"
        />
      </View>

      <View className="mb-4">
        <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">Platform</Text>
        <View className="flex-row justify-between">
          {PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                setPlatform(p.id);
                Haptics.selectionAsync();
              }}
              className={cn(
                'p-3 rounded-xl items-center justify-center border w-[22%]',
                platform === p.id ? 'bg-primary/20 border-primary' : 'bg-background/30 border-white/5'
              )}
            >
              <p.icon size={20} color={platform === p.id ? '#818CF8' : '#94A3B8'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">Tone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {TONES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setTone(t);
                Haptics.selectionAsync();
              }}
              className={cn(
                'px-4 py-2 rounded-full mr-2 border',
                tone === t ? 'bg-primary border-primary' : 'bg-background/30 border-white/5'
              )}
            >
              <Text className={cn('text-xs font-medium', tone === t ? 'text-white' : 'text-textSecondary')}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="mb-6">
        <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">Length</Text>
        <View className="flex-row bg-background/30 rounded-xl p-1 border border-white/5">
          {LENGTHS.map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => {
                setLength(l);
                Haptics.selectionAsync();
              }}
              className={cn(
                'flex-1 py-2 rounded-lg items-center',
                length === l ? 'bg-surfaceHighlight shadow-sm' : ''
              )}
            >
              <Text className={cn('text-xs font-medium', length === l ? 'text-textPrimary' : 'text-textSecondary')}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button
        onPress={handleGenerate}
        disabled={!topic.trim() || isGenerating}
        loading={isGenerating}
        className="bg-indigo-600 h-14"
        style={{ backgroundColor: '#4F46E5' }} // Ensure indigo
      >
        Generate Masterpiece
      </Button>

      {showResult && (lastResult || isGenerating || error) && (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut} className="mt-6 border-t border-white/10 pt-6">
          {error ? (
            <View className="bg-error/10 border border-error/20 p-4 rounded-2xl flex-row items-center">
              <AlertCircle size={20} color="#EF4444" className="mr-3" />
              <View className="flex-1">
                <Text className="text-error font-bold text-sm">Generation Failed</Text>
                <Text className="text-error/80 text-xs">{error.message}</Text>
              </View>
              <TouchableOpacity onPress={handleGenerate} className="bg-error/20 p-2 rounded-lg">
                <RefreshCw size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="bg-background/40 p-4 rounded-2xl border border-white/5 mb-4">
                {isGenerating ? (
                  <View className="h-24 items-center justify-center">
                    <Text className="text-textSecondary text-sm italic">AI is thinking...</Text>
                  </View>
                ) : (
                  <AIStreamingText 
                    text={typeof lastResult === 'string' ? lastResult : lastResult?.text || ''} 
                  />
                )}
              </View>

              {!isGenerating && lastResult && (
                <View className="flex-row justify-between">
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handleCopy} className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <Copy size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <Edit2 size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => regenerate()} className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <RefreshCw size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <Heart size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <Button size="sm" className="bg-indigo-600 px-4" icon={<Send size={14} color="#fff" />}>
                      Use
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      )}
    </GlassCard>
  );
}
