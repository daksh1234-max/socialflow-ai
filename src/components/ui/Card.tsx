import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

export function Card({ className, children, ...props }: ViewProps) {
  return (
    <View 
      className={cn('bg-surface rounded-xl p-lg shadow-sm border border-white/5', className)} 
      {...props}
    >
      {children}
    </View>
  );
}
