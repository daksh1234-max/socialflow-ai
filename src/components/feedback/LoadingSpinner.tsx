import React from 'react';
import { ActivityIndicator, View, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

interface LoadingSpinnerProps extends ViewProps {
  color?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ color = '#6366F1', size = 'large', className, ...props }: LoadingSpinnerProps) {
  return (
    <View className={cn('items-center justify-center p-md', className)} {...props}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
