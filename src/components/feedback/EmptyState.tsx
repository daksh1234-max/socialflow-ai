import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-xl">
      <View className="w-20 h-20 bg-surfaceHighlight rounded-full items-center justify-center mb-lg border border-white/5">
        <Icon color="#A78BFA" size={32} />
      </View>
      <Text className="text-xl font-bold text-textPrimary mb-sm text-center">{title}</Text>
      <Text className="text-textSecondary text-center mb-xl">{description}</Text>
      {actionLabel && onAction && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
