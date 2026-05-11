import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Plus,
  Hash,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  MoreVertical,
  ChevronDown
} from 'lucide-react-native';
import { useCreatePost } from '@/src/hooks/api/usePostMutations';
import { useToastStore } from '@/src/components/feedback/Toast';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '@/src/components/layout/BottomSheet';
import { useAI } from '@/src/hooks/useAI';
import * as Haptics from 'expo-haptics';

const PLATFORMS = [
  { name: 'Instagram', max: 2200, opt: '150-200' },
  { name: 'Twitter', max: 280, opt: '70-120' },
  { name: 'LinkedIn', max: 3000, opt: '200-400' }
];

const SUGGESTIONS = [
  { label: 'Add hook 🪝', type: 'hook' },
  { label: 'Add CTA 👆', type: 'cta' },
  { label: 'Make it shorter ✂️', type: 'rewrite', params: { tone: 'shorter' } },
  { label: 'Make it longer 📏', type: 'rewrite', params: { tone: 'longer' } },
];

export default function CreateScreen() {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [postingPlatform, setPostingPlatform] = useState('Twitter');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);

  const createPostMutation = useCreatePost();
  const { showToast } = useToastStore();
  const router = useRouter();
  const { generate } = useAI();

  const activePlatform = PLATFORMS.find(p => p.name === postingPlatform) || PLATFORMS[1];
  const charCount = generatedContent.length;
  const isOverLimit = charCount > activePlatform.max;

  const handleAiAction = async (type: string, extraParams: any = {}) => {
    setShowAiSheet(false);
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await generate(type as any, {
        topic: prompt || generatedContent,
        platform: postingPlatform.toLowerCase(),
        content: generatedContent,
        ...extraParams
      });
      
      const newContent = typeof result === 'string' ? result : result.text;
      setGeneratedContent(prev => prev ? `${prev}\n\n${newContent}` : newContent);
      setStep(3);
      showToast('AI magic applied!', 'success');
    } catch (e: any) {
      showToast('AI assist failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateInitial = async () => {
    if (!prompt) return showToast('Please enter a prompt', 'error');
    setIsGenerating(true);
    try {
      const result = await generate('caption', {
        topic: prompt,
        platform: postingPlatform.toLowerCase(),
        tone: 'professional',
        length: 'medium'
      });
      setGeneratedContent(typeof result === 'string' ? result : result.text);
      setStep(3);
    } catch (e: any) {
      showToast('Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!generatedContent) return;
    try {
      await createPostMutation.mutateAsync({
        content: generatedContent,
        platform: postingPlatform.toLowerCase(),
        scheduledFor: date,
      });
      showToast('Post scheduled successfully!', 'success');
      setStep(1);
      setPrompt('');
      setGeneratedContent('');
      router.push('/(app)/dashboard');
    } catch (e: any) {
      showToast('Error scheduling post: ' + e.message, 'error');
    }
  };

  return (
    <ScreenWrapper scrollable>
      <Header title="Create Content" />
      
      <View className="p-lg gap-y-xl pb-32">
        {/* Step 1: Prompt */}
        <View className={`gap-y-md ${step !== 1 && 'opacity-50'}`}>
          <Text className="text-xl font-bold text-textPrimary">1. What's on your mind?</Text>
          <Input 
            placeholder="E.g. Write a post announcing our new AI features for startups..."
            multiline
            numberOfLines={4}
            className="h-32 pt-sm"
            value={prompt}
            onChangeText={setPrompt}
            textAlignVertical="top"
          />
          
          <Text className="text-textSecondary mb-xs">Select Platform</Text>
          <View className="flex-row gap-x-sm mb-md">
            {PLATFORMS.map((p) => (
              <TouchableOpacity 
                key={p.name} 
                onPress={() => setPostingPlatform(p.name)}
                className={`flex-1 py-sm rounded-lg border items-center ${postingPlatform === p.name ? 'bg-primary/20 border-primary' : 'bg-surface border-white/5'}`}
              >
                <Text className={postingPlatform === p.name ? 'text-primary font-semibold' : 'text-textSecondary'}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {step === 1 && (
            <Button 
              icon={<Sparkles size={18} color="#fff" />} 
              onPress={handleGenerateInitial} 
              loading={isGenerating}
              className="bg-indigo-600"
            >
              Generate with AI
            </Button>
          )}
        </View>

        {/* Editor Area */}
        {step >= 3 && (
          <View className="gap-y-md">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-textPrimary">2. Review & Edit</Text>
              <View className="items-end">
                <Text className={cn("text-[10px] font-bold", isOverLimit ? "text-error" : "text-emerald-400")}>
                  {charCount} / {activePlatform.max}
                </Text>
                <Text className="text-textSecondary text-[8px] uppercase">
                  Optimal: {activePlatform.opt}
                </Text>
              </View>
            </View>

            <View className="mb-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => handleAiAction(s.type, s.params)}
                    className="bg-surfaceHighlight/50 border border-white/10 px-3 py-1.5 rounded-full mr-2"
                  >
                    <Text className="text-textPrimary text-xs">{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <GlassCard>
              <TextInput
                multiline
                className="text-textPrimary text-base min-h-[150px]"
                value={generatedContent}
                onChangeText={setGeneratedContent}
                textAlignVertical="top"
              />
            </GlassCard>
          </View>
        )}

        {/* Scheduling */}
        {step >= 3 && (
          <View className="gap-y-md">
            <Text className="text-xl font-bold text-textPrimary">3. Schedule</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between bg-surface p-md rounded-xl border border-white/5"
            >
              <View className="flex-row items-center">
                <CalendarIcon size={20} color="#94A3B8" />
                <Text className="text-textPrimary ml-sm text-lg">
                  {date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              </View>
              <Text className="text-primary font-medium">Edit</Text>
            </TouchableOpacity>

            {(showDatePicker || Platform.OS === 'ios') && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
                themeVariant="dark"
              />
            )}

            <Button 
              icon={<CheckCircle2 size={18} color="#fff" />} 
              onPress={handleSchedule}
              className="mt-lg bg-emerald-600"
              loading={createPostMutation.isPending}
            >
              Schedule Post
            </Button>
          </View>
        )}
      </View>

      <TouchableOpacity 
        onPress={() => setShowAiSheet(true)}
        className="absolute bottom-8 right-8 w-16 h-16 bg-indigo-600 rounded-full items-center justify-center shadow-lg shadow-indigo-500/50"
        style={{ elevation: 10 }}
      >
        <Sparkles size={28} color="#fff" />
      </TouchableOpacity>

      <BottomSheet visible={showAiSheet} onClose={() => setShowAiSheet(false)}>
        <Text className="text-white font-bold text-xl mb-4">AI Assist</Text>
        <View className="gap-y-3">
          <TouchableOpacity 
            onPress={() => handleAiAction('caption')}
            className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl"
          >
            <Sparkles size={20} color="#818CF8" className="mr-3" />
            <Text className="text-textPrimary font-medium">Generate New Caption</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAiAction('hashtags')}
            className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl"
          >
            <Hash size={20} color="#818CF8" className="mr-3" />
            <Text className="text-textPrimary font-medium">Add Hashtags</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAiAction('rewrite')}
            className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl"
          >
            <RefreshCw size={20} color="#818CF8" className="mr-3" />
            <Text className="text-textPrimary font-medium">Rewrite for Platform</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAiAction('image')}
            className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl"
          >
            <ImageIcon size={20} color="#818CF8" className="mr-3" />
            <Text className="text-textPrimary font-medium">Generate AI Image</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </ScreenWrapper>
  );
}
