import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Share, Clipboard } from 'react-native';
import { 
  Copy, 
  Edit3, 
  RefreshCw, 
  Heart, 
  Share2, 
  Send, 
  Maximize2,
  Check,
  Instagram,
  Facebook,
  Linkedin,
  Twitter
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

interface AIResultCardProps {
  result: string;
  type: string;
  platform?: string;
  onRegenerate?: () => void;
  onFavorite?: () => void;
  onUseInPost?: (content: string) => void;
  className?: string;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

export function AIResultCard({ 
  result, 
  type, 
  platform = 'instagram', 
  onRegenerate, 
  onFavorite, 
  onUseInPost,
  className 
}: AIResultCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(result);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const rotation = useSharedValue(0);

  const charCount = editedContent.length;
  const getCharCountColor = () => {
    if (charCount > 2000) return 'text-error';
    if (charCount > 1500) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const handleCopy = () => {
    Clipboard.setString(editedContent);
    setIsCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: editedContent });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegenerate = () => {
    rotation.value = withTiming(rotation.value + 360, { duration: 500 });
    onRegenerate?.();
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFavorite?.();
  };

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const PlatformIcon = PLATFORM_ICONS[platform.toLowerCase()] || Instagram;

  return (
    <GlassCard className={cn('mb-4 overflow-hidden', className)}>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-primary/20 p-2 rounded-lg mr-3">
            <PlatformIcon size={16} color="#818CF8" />
          </View>
          <View>
            <Text className="text-textPrimary font-bold text-sm capitalize">{type}</Text>
            <Text className="text-textSecondary text-[10px] uppercase tracking-widest">{platform}</Text>
          </View>
        </View>
        <Badge variant="secondary" className="bg-surfaceHighlight/50">
          <Text className={cn('text-[10px] font-bold', getCharCountColor())}>
            {charCount} chars
          </Text>
        </Badge>
      </View>

      <View className="bg-background/40 rounded-2xl p-4 border border-white/5 mb-4">
        {isEditing ? (
          <TextInput
            className="text-textPrimary text-base leading-relaxed"
            multiline
            value={editedContent}
            onChangeText={setEditedContent}
            autoFocus
          />
        ) : (
          <Text className="text-textPrimary text-base leading-relaxed">
            {editedContent}
          </Text>
        )}
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-2">
          <TouchableOpacity 
            onPress={handleCopy}
            className="p-2.5 bg-surfaceHighlight rounded-xl border border-white/10"
          >
            {isCopied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#94A3B8" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            className={cn(
              'p-2.5 rounded-xl border',
              isEditing ? 'bg-primary border-primary' : 'bg-surfaceHighlight border-white/10'
            )}
          >
            <Edit3 size={18} color={isEditing ? '#fff' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleRegenerate}
            className="p-2.5 bg-surfaceHighlight rounded-xl border border-white/10"
          >
            <Animated.View style={animatedRotateStyle}>
              <RefreshCw size={18} color="#94A3B8" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity 
            onPress={handleFavorite}
            className="p-2.5 bg-surfaceHighlight rounded-xl border border-white/10"
          >
            <Heart size={18} color={isFavorited ? '#EF4444' : '#94A3B8'} fill={isFavorited ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleShare}
            className="p-2.5 bg-surfaceHighlight rounded-xl border border-white/10"
          >
            <Share2 size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUseInPost?.(editedContent)}
            className="bg-indigo-600 px-4 rounded-xl flex-row items-center"
            style={{ backgroundColor: '#4F46E5' }}
          >
            <Send size={16} color="#fff" className="mr-2" />
            <Text className="text-white font-bold text-sm">Use</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}
