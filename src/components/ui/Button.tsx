import React, { forwardRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { cn } from '@/src/lib/utils';
import * as Haptics from 'expo-haptics';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, onPress, ...props }, ref) => {
    
    const handlePress = (e: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    };

    const baseStyles = 'flex-row items-center justify-center rounded-xl';
    
    const variants = {
      primary: 'bg-primary',
      secondary: 'bg-surfaceHighlight border border-white/10',
      ghost: 'bg-transparent',
      danger: 'bg-error/10 border border-error/20',
    };

    const textVariants = {
      primary: 'text-white font-semibold',
      secondary: 'text-textPrimary font-medium',
      ghost: 'text-textSecondary font-medium',
      danger: 'text-error font-medium',
    };

    const sizes = {
      sm: 'py-sm px-md',
      md: 'py-md px-lg',
      lg: 'py-lg px-xl',
    };

    const textSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.8}
        disabled={disabled || loading}
        onPress={handlePress}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          (disabled || loading) && 'opacity-50',
          className
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#818CF8'} className="mr-sm" />
        ) : icon ? (
          <View className="mr-sm">{icon}</View>
        ) : null}
        <Text className={cn(textVariants[variant], textSizes[size])}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }
);
Button.displayName = 'Button';
