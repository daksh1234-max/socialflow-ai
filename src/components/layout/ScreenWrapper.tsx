import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/src/lib/utils';

interface ScreenWrapperProps extends ViewProps {
  scrollable?: boolean;
  withTopInset?: boolean;
  withBottomInset?: boolean;
}

export function ScreenWrapper({ 
  children, 
  scrollable = false, 
  withTopInset = true, 
  withBottomInset = true, 
  className,
  ...props 
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const Container = scrollable ? ScrollView : (View as any);
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <Container
        className={cn('flex-1', className)}
        style={{
          paddingTop: withTopInset ? insets.top : 0,
          paddingBottom: withBottomInset ? insets.bottom : 0,
        }}
        contentContainerStyle={scrollable ? { flexGrow: 1 } : undefined}
        {...props}
      >
        {children}
      </Container>
    </KeyboardAvoidingView>
  );
}
