import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View className="flex-1 items-center justify-center bg-background p-lg">
          <Text className="text-xl font-bold text-error mb-sm">Something went wrong</Text>
          <Text className="text-textSecondary mb-lg text-center">
            {this.state.error?.message}
          </Text>
          <TouchableOpacity 
            className="bg-primary px-xl py-sm rounded-full"
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text className="text-textPrimary font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
