import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Maximize, 
  Download, 
  Share2, 
  Send, 
  RefreshCw,
  Layout,
  Palette
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useAI } from '@/src/hooks/useAI';

const STYLES = [
  { id: 'modern', label: 'Modern', color: 'bg-blue-500' },
  { id: 'minimal', label: 'Minimal', color: 'bg-zinc-500' },
  { id: 'bold', label: 'Bold', color: 'bg-orange-500' },
  { id: 'professional', label: 'Professional', color: 'bg-indigo-500' },
  { id: 'artistic', label: 'Artistic', color: 'bg-rose-500' },
];

const SIZES = [
  { id: 'SQUARE', label: '1:1', sub: 'Post' },
  { id: 'PORTRAIT', label: '4:5', sub: 'Portrait' },
  { id: 'STORY', label: '9:16', sub: 'Story' },
  { id: 'LANDSCAPE', label: '1.91:1', sub: 'Landscape' },
];

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedSize, setSelectedSize] = useState('SQUARE');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const { generate, isGenerating, progress } = useAI();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const result = await generate('image', {
        caption: prompt,
        style: selectedStyle,
        size: selectedSize
      });
      if (typeof result === 'string') {
        setImageUrl(result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Prompt enhancement logic
      const result = await generate('rewrite', {
        content: `Expand this image prompt for a high-quality, professional ${selectedStyle} image: ${prompt}`,
        fromPlatform: 'simple prompt',
        toPlatform: 'detailed AI image prompt'
      });
      const enhancedText = typeof result === 'string' ? result : result.text;
      setPrompt(enhancedText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <View className="p-4">
      <GlassCard className="mb-6 bg-surface/70">
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-textSecondary text-xs font-bold uppercase ml-1">Describe your vision</Text>
            <TouchableOpacity 
              onPress={handleEnhance} 
              disabled={isEnhancing || !prompt.trim()}
              className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
            >
              {isEnhancing ? (
                <ActivityIndicator size="small" color="#818CF8" />
              ) : (
                <>
                  <Sparkles size={14} color="#818CF8" className="mr-1" />
                  <Text className="text-primary text-[10px] font-bold">ENHANCE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-background/50 text-textPrimary p-4 rounded-2xl border border-white/5 min-h-[80px]"
            placeholder="A futuristic city with neon lights..."
            placeholderTextColor="#64748b"
            multiline
            value={prompt}
            onChangeText={setPrompt}
            textAlignVertical="top"
          />
        </View>

        <View className="mb-4">
          <View className="flex-row items-center mb-2 ml-1">
            <Palette size={14} color="#94A3B8" className="mr-2" />
            <Text className="text-textSecondary text-xs font-bold uppercase">Style</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedStyle(s.id)}
                className={cn(
                  'mr-3 items-center',
                  selectedStyle === s.id ? 'opacity-100' : 'opacity-50'
                )}
              >
                <View className={cn('w-14 h-14 rounded-2xl mb-1 border-2', s.color, selectedStyle === s.id ? 'border-primary' : 'border-transparent')} />
                <Text className="text-textSecondary text-[10px] font-medium">{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center mb-2 ml-1">
            <Layout size={14} color="#94A3B8" className="mr-2" />
            <Text className="text-textSecondary text-xs font-bold uppercase">Size</Text>
          </View>
          <View className="flex-row justify-between">
            {SIZES.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSize(s.id)}
                className={cn(
                  'p-3 rounded-xl items-center justify-center border w-[22%]',
                  selectedSize === s.id ? 'bg-primary/20 border-primary' : 'bg-background/30 border-white/5'
                )}
              >
                <Text className={cn('text-xs font-bold', selectedSize === s.id ? 'text-primary' : 'text-textSecondary')}>
                  {s.label}
                </Text>
                <Text className="text-textSecondary text-[8px] uppercase">{s.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          onPress={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          className="bg-violet-600 h-14 shadow-lg shadow-violet-500/30"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {isGenerating ? `Creating masterpiece... ${progress}%` : 'Generate Image'}
        </Button>
      </GlassCard>

      {imageUrl && !isGenerating && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <GlassCard className="p-2 mb-6">
            <View className="aspect-square rounded-xl overflow-hidden bg-background">
              <Image 
                source={{ uri: imageUrl }} 
                className="w-full h-full"
                resizeMode="cover"
              />
              <TouchableOpacity className="absolute top-4 right-4 bg-black/40 p-2 rounded-full backdrop-blur-md">
                <Maximize size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-between p-4">
              <View className="flex-row gap-2">
                <TouchableOpacity className="p-3 bg-surfaceHighlight rounded-xl border border-white/10">
                  <Download size={20} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity className="p-3 bg-surfaceHighlight rounded-xl border border-white/10">
                  <Share2 size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={handleGenerate} className="p-3 bg-surfaceHighlight rounded-xl border border-white/10">
                  <RefreshCw size={20} color="#94A3B8" />
                </TouchableOpacity>
                <Button className="bg-violet-600 px-6" icon={<Send size={16} color="#fff" />}>
                  Use
                </Button>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {isGenerating && (
        <View className="items-center justify-center py-10">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="text-textSecondary mt-4 animate-pulse">Generating your creative vision...</Text>
        </View>
      )}
    </View>
  );
}
