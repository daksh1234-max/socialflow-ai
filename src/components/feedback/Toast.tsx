import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastState {
  message: string | null;
  type: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type = 'info') => {
    set({ message, type });
    setTimeout(() => set({ message: null }), 3000);
  },
  hideToast: () => set({ message: null }),
}));

export function ToastProvider() {
  const { message, type } = useToastStore();
  const insets = useSafeAreaInsets();

  if (!message) return null;

  const bgColors = {
    success: 'bg-success',
    error: 'bg-error',
    info: 'bg-primary',
  };

  return (
    <View className="absolute left-0 right-0 z-50 items-center" style={{ top: insets.top + 10 }} pointerEvents="none">
      <Animated.View 
        entering={FadeInUp} 
        exiting={FadeOutUp}
        className={`px-lg py-sm rounded-full shadow-float ${bgColors[type]}`}
      >
        <Text className="text-white font-medium">{message}</Text>
      </Animated.View>
    </View>
  );
}
