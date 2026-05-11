import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

export function GlassCard({ className, children, ...props }: ViewProps) {
  return (
    <View 
      className={cn(
        'bg-glass rounded-xl p-lg border border-white/10',
        className
      )}
      style={{ overflow: 'hidden' }}
      {...props}
    >
      {children}
    </View>
  );
}
