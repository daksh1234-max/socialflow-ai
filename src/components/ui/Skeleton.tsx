import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

export function Skeleton({ className, ...props }: ViewProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      className={cn('bg-surfaceHighlight rounded-md', className)} 
      style={[animatedStyle, props.style]} 
      {...props} 
    />
  );
}
