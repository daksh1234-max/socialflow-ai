import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, LayoutAnimation } from 'react-native';
import { 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Share, 
  ThumbsUp, 
  MessageSquare, 
  Forward,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react-native';
import { cn } from '@/src/lib/utils';

interface PostPreviewProps {
  content: string;
  mediaUrl: string | null;
  platform: string; // 'twitter' | 'facebook' | 'linkedin' | 'instagram'
  userName?: string;
  userHandle?: string;
  avatarUrl?: string;
}

export function PostPreview({ 
  content, 
  mediaUrl, 
  platform,
  userName = "Social Explorer",
  userHandle = "@socialexplorer",
  avatarUrl = "https://ui-avatars.com/api/?name=Social+Explorer&background=818CF8&color=fff"
}: PostPreviewProps) {
  const [showMoreLinkedIn, setShowMoreLinkedIn] = useState(false);
  
  const renderTwitter = () => {
    const isOverLimit = content.length > 280;
    
    return (
      <View className="bg-background border border-white/10 rounded-xl p-4 w-full">
        <View className="flex-row justify-between">
          <View className="flex-row flex-1">
            <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full mr-3" />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-bold mr-1">{userName}</Text>
                <CheckCircle2 size={14} color="#1DA1F2" />
                <Text className="text-slate-400 text-sm ml-1">{userHandle} • 1m</Text>
              </View>
              
              <Text className="text-white text-base mt-1 leading-6">
                {isOverLimit ? content.substring(0, 280) : content}
                {isOverLimit && <Text className="text-slate-500">...</Text>}
              </Text>

              {mediaUrl && (
                <View className="mt-3 w-full rounded-2xl overflow-hidden border border-white/10">
                  <Image source={{ uri: mediaUrl }} className="w-full h-48" resizeMode="cover" />
                </View>
              )}

              <View className="flex-row justify-between items-center mt-4 pr-6">
                <View className="flex-row items-center"><MessageCircle size={18} color="#64748b" /><Text className="text-slate-500 text-xs ml-2">12</Text></View>
                <View className="flex-row items-center"><Repeat2 size={18} color="#64748b" /><Text className="text-slate-500 text-xs ml-2">4</Text></View>
                <View className="flex-row items-center"><Heart size={18} color="#64748b" /><Text className="text-slate-500 text-xs ml-2">48</Text></View>
                <View className="flex-row items-center"><Share size={18} color="#64748b" /></View>
              </View>
            </View>
          </View>
          <MoreHorizontal size={20} color="#64748b" />
        </View>
        
        {isOverLimit && (
          <View className="bg-red-500/20 px-3 py-2 rounded-lg mt-4 flex-row items-center">
            <Text className="text-red-400 text-xs font-medium">Warning: Exceeds 280 character limit (currently {content.length})</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFacebook = () => {
    return (
      <View className="bg-background border border-white/10 rounded-xl w-full pt-4 pb-2">
        <View className="flex-row px-4 justify-between items-start">
          <View className="flex-row">
            <Image source={{ uri: avatarUrl }} className="w-10 h-10 rounded-full mr-3" />
            <View>
              <Text className="text-white font-bold">{userName}</Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-slate-400 text-xs mr-1">Just now •</Text>
                <Text className="text-slate-400 text-[10px]">🌐</Text>
              </View>
            </View>
          </View>
          <MoreHorizontal size={20} color="#64748b" />
        </View>

        <Text className="text-white text-base px-4 mt-3 mb-3 leading-6">
          {content}
        </Text>

        {mediaUrl && (
          <Image source={{ uri: mediaUrl }} className="w-full h-64 border-y border-white/10" resizeMode="cover" />
        )}

        <View className="px-4 py-3 flex-row justify-between items-center border-b border-white/5">
          <View className="flex-row items-center bg-blue-600 rounded-full p-1">
            <ThumbsUp size={10} color="#fff" />
          </View>
          <Text className="text-slate-400 text-sm">3 Comments</Text>
        </View>

        <View className="flex-row justify-around py-1 px-2">
          <View className="flex-row items-center py-2 px-6 rounded-lg">
            <ThumbsUp size={20} color="#94a3b8" />
            <Text className="text-slate-400 font-medium ml-2">Like</Text>
          </View>
          <View className="flex-row items-center py-2 px-6 rounded-lg">
            <MessageSquare size={20} color="#94a3b8" />
            <Text className="text-slate-400 font-medium ml-2">Comment</Text>
          </View>
          <View className="flex-row items-center py-2 px-6 rounded-lg">
            <Forward size={20} color="#94a3b8" />
            <Text className="text-slate-400 font-medium ml-2">Share</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLinkedIn = () => {
    const isLong = content.length > 150;
    const displayText = isLong && !showMoreLinkedIn ? `${content.substring(0, 150)}...` : content;

    return (
      <View className="bg-background border border-white/10 rounded-xl w-full pt-4">
        <View className="flex-row px-4 justify-between items-start mb-3">
          <View className="flex-row flex-1">
            <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full mr-3" />
            <View className="flex-1">
              <Text className="text-white font-bold">{userName}</Text>
              <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>Founder & CEO at AI Startup | Tech Innovator</Text>
              <Text className="text-slate-500 text-xs mt-0.5">1w • 🌐</Text>
            </View>
          </View>
          <MoreHorizontal size={20} color="#64748b" />
        </View>

        <View className="px-4 mb-3">
          <Text className="text-white text-[15px] leading-6">
            {displayText}
            {isLong && !showMoreLinkedIn && (
              <Text 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowMoreLinkedIn(true);
                }} 
                className="text-slate-400"
              > see more</Text>
            )}
          </Text>
        </View>

        {mediaUrl && (
          <Image source={{ uri: mediaUrl }} className="w-full h-64 bg-slate-800" resizeMode="cover" />
        )}

        <View className="px-4 py-2 flex-row justify-between items-center border-b border-white/5">
          <View className="flex-row items-center">
            <View className="bg-blue-600 rounded-full p-1 border border-background z-10"><ThumbsUp size={8} color="#fff" /></View>
            <View className="bg-red-500 rounded-full p-1 border border-background -ml-1"><Heart size={8} color="#fff" /></View>
            <Text className="text-slate-400 text-xs ml-1">1,024</Text>
          </View>
          <Text className="text-slate-400 text-xs">84 comments • 12 reposts</Text>
        </View>

        <View className="flex-row justify-around py-1 px-2">
          <View className="items-center py-2 px-4 rounded-lg">
            <ThumbsUp size={18} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-medium mt-1">Like</Text>
          </View>
          <View className="items-center py-2 px-4 rounded-lg">
            <MessageSquare size={18} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-medium mt-1">Comment</Text>
          </View>
          <View className="items-center py-2 px-4 rounded-lg">
            <Repeat2 size={18} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-medium mt-1">Repost</Text>
          </View>
          <View className="items-center py-2 px-4 rounded-lg">
            <Forward size={18} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-medium mt-1">Send</Text>
          </View>
        </View>
      </View>
    );
  };

  switch (platform.toLowerCase()) {
    case 'twitter': return renderTwitter();
    case 'facebook': return renderFacebook();
    case 'linkedin': return renderLinkedIn();
    // Default fallback to Twitter style if others aren't exact
    default: return renderTwitter(); 
  }
}
