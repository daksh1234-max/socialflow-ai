import React from 'react';
import { View, Image, Text, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

interface AvatarProps extends ViewProps {
  src?: string | null;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 rounded-full',
    md: 'w-12 h-12 rounded-full',
    lg: 'w-16 h-16 rounded-full',
    xl: 'w-24 h-24 rounded-full',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  return (
    <View className={cn('items-center justify-center bg-surfaceHighlight overflow-hidden', sizes[size], className)} {...props}>
      {src ? (
        <Image source={{ uri: src }} className="w-full h-full" />
      ) : (
        <Text className={cn('text-textPrimary font-semibold', textSizes[size])}>{fallback.substring(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}
