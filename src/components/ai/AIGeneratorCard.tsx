import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Clipboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useAI, AIGenerationType } from '@/src/hooks/useAI';
import { AIStreamingText } from './AIStreamingText';
import { usePostStore } from '@/src/stores/postStore';
import { useRouter } from 'expo-router';

const PLATFORMS = [
  { id: 'instagram', icon: 'photo-camera', label: 'Instagram' },
  { id: 'facebook', icon: 'facebook', label: 'Facebook' },
  { id: 'linkedin', icon: 'business-center', label: 'LinkedIn' },
  { id: 'twitter', icon: 'chat-bubble', label: 'Twitter' },
];

const TONES = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Bold'];
const LENGTHS = ['Short', 'Medium', 'Long'];

interface AIGeneratorCardProps {
  type?: AIGenerationType;
}

const LENGTH_CONFIG: Record<string, string> = {
  'Short': 'short-text',
  'Medium': 'subject',
  'Long': 'notes',
};

const TONE_CONFIG: Record<string, string> = {
  'Professional': 'business-center',
  'Casual': 'mood',
  'Witty': 'emoji-emotions',
  'Inspirational': 'wb-sunny',
  'Bold': 'flash-on',
};

export function AIGeneratorCard({ type = 'caption' }: AIGeneratorCardProps) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [showResult, setShowResult] = useState(false);

  const { generate, regenerate, isGenerating, lastResult, error, cancel } = useAI();
  const { setDraft } = usePostStore();
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowResult(true);
    
    try {
      let params: any = { topic };
      
      if (type === 'caption') {
        params = { topic, tone: tone.toLowerCase(), platform, length: length.toLowerCase(), includeCTA: true };
      } else if (type === 'hashtags') {
        params = { topic, count: 15, niche: topic, trending: true };
      } else if (type === 'hook') {
        params = { topic, style: tone.toLowerCase() };
      } else if (type === 'cta') {
        params = { goal: topic, tone: tone.toLowerCase(), platform };
      } else if (type === 'rewrite') {
        params = { content: topic, fromPlatform: 'any', toPlatform: platform, tone: tone.toLowerCase() };
      } else if (type === 'video_script') {
        params = { topic, duration: length === 'Short' ? '15s' : length === 'Medium' ? '30s' : '60s', style: tone === 'Professional' ? 'educational' : 'entertaining' };
      } else if (type === 'bio') {
        params = { name: 'User', niche: topic, keywords: topic, platform };
      } else if (type === 'best_time' || type === 'trending_topics') {
        params = { niche: topic, platform, postHistory: [] };
      }

      await generate(type, params);
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

  const handleUse = () => {
    const text = typeof lastResult === 'string' ? lastResult : lastResult?.text;
    if (text) {
      setDraft({ 
        content: text, 
        platform: ['caption', 'cta', 'rewrite', 'bio'].includes(type) ? platform : 'Twitter' 
      });
      router.push('/(app)/create');
    }
  };

  const showPlatform = ['caption', 'cta', 'rewrite', 'bio'].includes(type);
  const showTone = ['caption', 'hook', 'cta', 'rewrite', 'video_script'].includes(type);
  const showLength = ['caption', 'video_script'].includes(type);

  const getTopicLabel = () => {
    switch(type) {
      case 'rewrite': return 'Paste content to rewrite';
      case 'hashtags': return 'What is your niche or topic?';
      case 'cta': return 'What is your goal? (e.g. Sign up, Buy now)';
      case 'bio': return 'Describe yourself or your business';
      case 'video_script': return 'What is the video about?';
      default: return "What's the topic?";
    }
  };

  return (
    <GlassCard className="m-4 backdrop-blur-xl" style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
      <View className="mb-4">
        <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">{getTopicLabel()}</Text>
        <TextInput
          className="text-textPrimary p-4 rounded-2xl border border-white/5 min-h-[100px]"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
          placeholder="Enter details here..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
          value={topic}
          onChangeText={setTopic}
          textAlignVertical="top"
        />
      </View>

      {showPlatform && (
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
                platform === p.id ? 'border-primary' : 'border-white/5'
              )}
              style={{ backgroundColor: platform === p.id ? 'rgba(129, 140, 248, 0.2)' : 'rgba(15, 23, 42, 0.3)' }}
            >
              <MaterialIcons 
                name={p.icon as any} 
                size={20} 
                color={platform === p.id ? '#818CF8' : '#94A3B8'} 
              />
            </TouchableOpacity>
          ))}
          </View>
        </View>
      )}

      {showTone && (
        <View className="mb-4">
          <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">Tone / Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" style={{ backgroundColor: 'transparent' }}>
          {TONES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setTone(t);
                Haptics.selectionAsync();
              }}
              className={cn(
                'px-4 py-2 rounded-full mr-2 border flex-row items-center gap-2',
                tone === t ? 'bg-primary border-primary' : 'border-white/5'
              )}
              style={{ backgroundColor: tone === t ? undefined : 'rgba(15, 23, 42, 0.3)' }}
            >
              <MaterialIcons 
                name={TONE_CONFIG[t] as any} 
                size={16} 
                color={tone === t ? '#fff' : '#94A3B8'} 
              />
              <Text className={cn('text-xs font-medium', tone === t ? 'text-white' : 'text-textSecondary')}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>
      )}

      {showLength && (
        <View className="mb-6">
          <Text className="text-textSecondary text-xs font-bold uppercase mb-2 ml-1">Length</Text>
          <View className="flex-row rounded-xl p-1 border border-white/5" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
          {LENGTHS.map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => {
                setLength(l);
                Haptics.selectionAsync();
              }}
              className={cn(
                'flex-1 py-2 rounded-lg items-center flex-row justify-center gap-2',
                length === l ? 'bg-surfaceHighlight' : ''
              )}
              style={length === l ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}}
            >
              <MaterialIcons 
                name={LENGTH_CONFIG[l] as any} 
                size={16} 
                color={length === l ? '#818CF8' : '#94A3B8'} 
              />
              <Text className={cn('text-xs font-medium', length === l ? 'text-textPrimary' : 'text-textSecondary')}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>
      )}

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
            <View 
              className="border p-4 rounded-2xl flex-row items-center"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <MaterialIcons name="error-outline" size={20} color="#EF4444" className="mr-3" />
              <View className="flex-1">
                <Text className="text-error font-bold text-sm">Generation Failed</Text>
                <Text className="text-error/80 text-xs">{error.message}</Text>
              </View>
              <TouchableOpacity onPress={handleGenerate} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <MaterialIcons name="refresh" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="p-4 rounded-2xl border border-white/5 mb-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
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
                      <MaterialIcons name="content-copy" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <MaterialIcons name="edit" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => regenerate()} className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <MaterialIcons name="refresh" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="p-2 bg-surfaceHighlight rounded-lg border border-white/10">
                      <MaterialIcons name="favorite-border" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <Button size="sm" className="bg-indigo-600 px-4" icon={<MaterialIcons name="send" size={14} color="#fff" />} onPress={handleUse}>
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
