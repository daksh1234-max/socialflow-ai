import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Image, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';


import * as ImagePicker from 'expo-image-picker';
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
  ChevronDown,
  X
} from 'lucide-react-native';
import { useCreatePost } from '@/src/hooks/api/usePostMutations';
import { useToastStore } from '@/src/components/feedback/Toast';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '@/src/components/layout/BottomSheet';
import { StorageService } from '@/src/services/supabase/storage';
import { useAI } from '@/src/hooks/useAI';
import { cn } from '@/src/lib/utils';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { PostPreview } from '@/src/components/previews/PostPreview';

const PLATFORMS = [
  { name: 'Twitter', max: 280, opt: '70-120', icon: 'chat-bubble' },
  { name: 'Facebook', max: 63206, opt: '40-80', icon: 'facebook' },
  { name: 'Instagram', max: 2200, opt: '150-300', icon: 'photo-camera' },
  { name: 'LinkedIn', max: 3000, opt: '200-400', icon: 'business-center' }
];


const SUGGESTIONS = [
  { label: 'Add hook 🪝', type: 'hook' },
  { label: 'Add CTA 👆', type: 'cta' },
  { label: 'Make it shorter ✂️', type: 'rewrite', params: { tone: 'shorter' } },
  { label: 'Make it longer 📏', type: 'rewrite', params: { tone: 'longer' } },
];

const createPostSchema = z.object({
  content: z.string().min(1, 'Caption is required'),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'instagram']),
});

export default function CreateScreen() {
  const { width } = Dimensions.get('window');
  const { user, profile } = useAuthStore();
  const { draft, setDraft } = usePostStore();
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [postingPlatform, setPostingPlatform] = useState(draft.platform || 'Twitter');
  const [generatedContent, setGeneratedContent] = useState(draft.content || '');
  const [imageUri, setImageUri] = useState(draft.imageUri || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [date, setDate] = useState(draft.scheduledFor || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ content?: string; platform?: string }>({});


  useEffect(() => {
    // Sync local state to store whenever it changes
    setDraft({
      content: generatedContent,
      platform: postingPlatform,
      scheduledFor: date,
      imageUri: imageUri
    });
  }, [generatedContent, postingPlatform, date, imageUri]);

  const createPostMutation = useCreatePost();
  const { showToast } = useToastStore();
  const router = useRouter();
  const { generate } = useAI();

  const activePlatform = PLATFORMS.find(p => p.name.toLowerCase() === postingPlatform.toLowerCase()) || PLATFORMS[1];
  const charCount = generatedContent.length;
  const isOverLimit = charCount > activePlatform.max;
  const isNearLimit = charCount >= activePlatform.max * 0.9;

  const handleAiAction = async (type: string, extraParams: any = {}) => {
    setShowAiSheet(false);
    
    if (type === 'image') {
      setImagePrompt(generatedContent || prompt || '');
      setTempImageUrl(null);
      setIsImageModalVisible(true);
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const safeTopic = prompt || generatedContent || "Social media post";
      
      const result = await generate(type as any, {
        topic: safeTopic,
        platform: postingPlatform.toLowerCase(),
        content: generatedContent,
        ...extraParams
      });
      
      const newContent = typeof result === 'string' ? result : result.text;
      setGeneratedContent(prev => prev ? `${prev}\n\n${newContent}` : newContent);
      setStep(3);
      showToast('AI magic applied!', 'success');
    } catch (e: any) {
      console.error('[CreateScreen] AI assist failed:', e);
      showToast('AI assist failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const performImageGeneration = async () => {
    if (!imagePrompt || imagePrompt.trim().length === 0) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('[CreateScreen] Generating AI image with prompt:', imagePrompt);
      const result = await generate('image', {
        caption: imagePrompt.trim(),
        platform: postingPlatform.toLowerCase()
      });
      
      const imageUrl = typeof result === 'string' ? result : (result as any).url;
      setTempImageUrl(imageUrl);
      showToast('Image generated!', 'success');
    } catch (error: any) {
      // Error is already handled by useAI hook's Alert, but we can add more if needed
      console.error('[CreateScreen] Image generation failed:', error);
    }
  };


  const handleUseImage = async () => {
    if (!tempImageUrl) return;
    
    // Pollinations URLs are direct and public, no need to upload to Supabase
    setImageUri(tempImageUrl);
    setIsImageModalVisible(false);
    setStep(3);
    showToast('AI Image applied!', 'success');
  };



  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      setIsGenerating(true);
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'upload.jpg';
        const permanentUrl = await StorageService.uploadLocalFile(user!.id, localUri, filename);
        setImageUri(permanentUrl);
        setStep(3);
        showToast('Image uploaded!', 'success');
      } catch (e) {
        showToast('Upload failed', 'error');
      } finally {
        setIsGenerating(false);
      }
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
    const validation = createPostSchema.safeParse({
      content: generatedContent,
      platform: postingPlatform.toLowerCase(),
    });

    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.errors.forEach(err => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      showToast('Please fix the errors', 'error');
      return;
    }

    setErrors({});
    try {
      await createPostMutation.mutateAsync({
        content: generatedContent,
        platform: postingPlatform.toLowerCase(),
        scheduledFor: date,
        mediaUrl: imageUri,
      });
      showToast('Post scheduled successfully!', 'success');
      setGeneratedContent('');
      setImageUri(null);
      setPrompt('');
      setStep(1);
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
        <View className={cn("gap-y-md", step !== 1 && "opacity-50")}>
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-textPrimary">1. What's on your mind?</Text>
            {user && (profile?.ai_credits || 0) > 0 && (
              <View className={cn("px-3 py-1 rounded-full", (profile?.ai_credits || 0) < 5 ? "bg-red-500/20" : "bg-indigo-500/20")}>
                <Text className={cn("text-xs font-bold", (profile?.ai_credits || 0) < 5 ? "text-red-400" : "text-indigo-400")}>
                  🤖 {profile?.ai_credits || 0} credits left
                </Text>
              </View>
            )}
          </View>
          <Input 
            placeholder="E.g. Write a post announcing our new AI features for startups..."
            multiline
            numberOfLines={4}
            className="h-32 pt-sm"
            value={prompt}
            onChangeText={setPrompt}
            textAlignVertical="top"
          />
          
          <View className="mb-md">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {PLATFORMS.map((p) => (
                <TouchableOpacity 
                  key={p.name} 
                  onPress={() => {
                    setPostingPlatform(p.name);
                    Haptics.selectionAsync();
                  }}
                  style={{ width: width / 3.5 }}
                  className={cn(
                    "py-sm rounded-xl border items-center mr-sm", 
                    postingPlatform === p.name ? 'bg-primary/20 border-primary' : 'bg-surface border-white/5'
                  )}
                >
                  <MaterialIcons 
                    name={p.icon as any} 
                    size={20} 
                    color={postingPlatform === p.name ? '#A78BFA' : '#94A3B8'} 
                    style={{ marginBottom: 4 }}
                  />
                  <Text className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    postingPlatform === p.name ? 'text-primary' : 'text-textSecondary'
                  )}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-bold text-textPrimary">2. Review & Edit</Text>
              
              <View className="flex-row bg-surfaceHighlight/50 rounded-lg p-1">
                <TouchableOpacity 
                  onPress={() => setActiveTab('edit')}
                  className={cn("px-4 py-1.5 rounded-md", activeTab === 'edit' && "bg-indigo-600")}
                >
                  <Text className={cn("text-xs font-bold", activeTab === 'edit' ? "text-white" : "text-textSecondary")}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setActiveTab('preview')}
                  className={cn("px-4 py-1.5 rounded-md", activeTab === 'preview' && "bg-indigo-600")}
                >
                  <Text className={cn("text-xs font-bold", activeTab === 'preview' ? "text-white" : "text-textSecondary")}>Preview</Text>
                </TouchableOpacity>
              </View>
            </View>

            {errors.content && <Text className="text-error text-xs">{errors.content}</Text>}

            {activeTab === 'edit' ? (
              <>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-textSecondary text-xs">AI Suggestions:</Text>
                  <View className="items-end">
                    <Text className={cn(
                      "text-[10px] font-bold", 
                      isOverLimit ? "text-error" : isNearLimit ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {charCount} / {activePlatform.max} chars
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
                  {imageUri && (
                    <View className="mb-4 relative">
                      <Image 
                        source={{ uri: imageUri }} 
                        className="w-full h-48 rounded-lg" 
                        resizeMode="cover" 
                      />
                      <TouchableOpacity 
                        onPress={() => setImageUri(null)}
                        className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    multiline
                    className="text-textPrimary text-base min-h-[150px]"
                    value={generatedContent}
                    onChangeText={(val) => {
                      setGeneratedContent(val);
                      if (errors.content) setErrors(prev => ({ ...prev, content: undefined }));
                    }}
                    textAlignVertical="top"
                  />
                </GlassCard>
              </>
            ) : (
              <PostPreview 
                content={generatedContent} 
                mediaUrl={imageUri} 
                platform={postingPlatform}
                userName={user?.email?.split('@')[0] || "User"}
                userHandle={`@${user?.email?.split('@')[0] || "user"}`}
              />
            )}
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
          <TouchableOpacity 
            onPress={handlePickImage}
            className="flex-row items-center bg-surfaceHighlight p-4 rounded-xl"
          >
            <Plus size={20} color="#818CF8" className="mr-3" />
            <Text className="text-textPrimary font-medium">Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
      <Modal
        visible={isImageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <View className="bg-surface rounded-t-3xl p-xl gap-y-lg border-t border-white/10">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-bold text-2xl">AI Image Studio</Text>
                <TouchableOpacity onPress={() => setIsImageModalVisible(false)} className="bg-white/10 p-2 rounded-full">
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {tempImageUrl ? (
                <View className="gap-y-lg">
                  <View className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                    <Image 
                      source={{ uri: tempImageUrl }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {isGenerating && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <ActivityIndicator size="large" color="#818CF8" />
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-x-md">
                    <TouchableOpacity 
                      onPress={performImageGeneration}
                      disabled={isGenerating}
                      className="flex-1 bg-surfaceHighlight py-4 rounded-xl items-center border border-white/5"
                    >
                      <View className="flex-row items-center">
                        <RefreshCw size={18} color="#fff" className="mr-2" />
                        <Text className="text-white font-bold">Regenerate</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleUseImage}
                      disabled={isGenerating}
                      className="flex-1 bg-indigo-600 py-4 rounded-xl items-center shadow-lg shadow-indigo-500/30"
                    >
                      <View className="flex-row items-center">
                        <CheckCircle2 size={18} color="#fff" className="mr-2" />
                        <Text className="text-white font-bold">Use This Image</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="gap-y-lg">
                  <Text className="text-textSecondary">Describe the image you want to generate for your post.</Text>
                  
                  <View className="bg-black/20 rounded-xl border border-white/10 p-md">
                    <TextInput
                      multiline
                      numberOfLines={4}
                      placeholder="e.g. A futuristic city with flying cars in cyberpunk style..."
                      placeholderTextColor="#64748B"
                      className="text-white text-base h-24"
                      value={imagePrompt}
                      onChangeText={setImagePrompt}
                      textAlignVertical="top"
                    />
                  </View>

                  <Button 
                    onPress={performImageGeneration}
                    loading={isGenerating}
                    disabled={!imagePrompt.trim()}
                    icon={<Sparkles size={18} color="#fff" />}
                    className="bg-indigo-600"
                  >
                    Generate AI Image
                  </Button>

                  <TouchableOpacity 
                    onPress={() => setIsImageModalVisible(false)}
                    className="py-2 items-center"
                  >
                    <Text className="text-textSecondary">Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenWrapper>

  );
}
