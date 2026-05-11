import React, { forwardRef } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { cn } from '@/src/lib/utils';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <View className="mb-md">
        {label && <Text className="text-textSecondary text-sm mb-xs ml-xs">{label}</Text>}
        <View 
          className={cn(
            'flex-row items-center bg-background border rounded-lg px-md h-12',
            error ? 'border-error' : 'border-white/10 focus:border-primary',
            className
          )}
        >
          {leftIcon && <View className="mr-sm">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-textPrimary h-full"
            placeholderTextColor="#475569"
            {...props}
          />
          {rightIcon && <View className="ml-sm">{rightIcon}</View>}
        </View>
        {error && <Text className="text-error text-xs mt-xs ml-xs">{error}</Text>}
      </View>
    );
  }
);
Input.displayName = 'Input';
