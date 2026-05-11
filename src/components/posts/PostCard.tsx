import React from 'react';
import { View, Text, Image } from 'react-native';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { Calendar, Hash, Instagram, Linkedin, Twitter } from 'lucide-react-native';
import { format } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    platform: 'instagram' | 'twitter' | 'linkedin';
    status: 'draft' | 'scheduled' | 'published';
    scheduledFor?: string;
    mediaUrl?: string;
  };
}

const StatusColor = {
  draft: 'secondary',
  scheduled: 'warning',
  published: 'success',
} as const;

export function PostCard({ post }: PostCardProps) {
  const PlatformIcon = {
    instagram: <Instagram size={16} color="#E1306C" />,
    twitter: <Twitter size={16} color="#1DA1F2" />,
    linkedin: <Linkedin size={16} color="#0077b5" />,
  };

  return (
    <GlassCard className="mb-md">
      <View className="flex-row justify-between items-start mb-md">
        <View className="flex-row items-center space-x-2">
          {PlatformIcon[post.platform]}
          <Text className="text-textPrimary font-semibold capitalize ml-2">{post.platform}</Text>
        </View>
        <Badge label={post.status} variant={StatusColor[post.status]} />
      </View>

      <Text className="text-textSecondary mb-md line-clamp-2" numberOfLines={2}>
        {post.content}
      </Text>

      {post.mediaUrl && (
        <Image 
          source={{ uri: post.mediaUrl }} 
          className="w-full h-32 rounded-lg mb-md bg-surfaceHighlight" 
          resizeMode="cover" 
        />
      )}

      <View className="flex-row items-center pt-sm border-t border-white/5 justify-between">
        <View className="flex-row items-center">
          <Calendar size={14} color="#94A3B8" />
          <Text className="text-xs text-textMuted ml-sm">
            {post.scheduledFor ? format(new Date(post.scheduledFor), 'MMM d, h:mm a') : 'No schedule set'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Hash size={14} color="#A78BFA" />
          <Text className="text-xs text-primaryGlow ml-1">AI Generated</Text>
        </View>
      </View>
    </GlassCard>
  );
}
