import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function Badge({ label, variant = 'primary', className, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-primary text-primaryGlow',
    secondary: 'bg-surfaceHighlight text-textSecondary',
    success: 'bg-success text-success',
    warning: 'bg-warning text-warning',
    error: 'bg-error text-error',
  };

  return (
    <View className={cn('px-sm py-1 rounded-full self-start', variants[variant].split(' ')[0], className)} {...props}>
      <Text className={cn('text-xs font-medium tracking-wider uppercase', variants[variant].split(' ')[1])}>
        {label}
      </Text>
    </View>
  );
}
