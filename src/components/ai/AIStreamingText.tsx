import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, withSequence, Easing } from 'react-native-reanimated';
import { cn } from '@/src/lib/utils';
import { SkipForward } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AIStreamingTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  speedMsPerChar?: number;
}

export function AIStreamingText({ text, onComplete, className, speedMsPerChar = 30 }: AIStreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const cursorOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const isMounted = useRef(true);
  const streamTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    cursorOpacity.value = withRepeat(
      withTiming(0, { duration: 400, easing: Easing.linear }),
      -1,
      true
    );
    return () => {
      isMounted.current = false;
      if (streamTimeout.current) clearTimeout(streamTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsStreaming(false);
      return;
    }

    // Reset state for new text
    setDisplayedText('');
    setIsStreaming(true);
    if (streamTimeout.current) clearTimeout(streamTimeout.current);

    const words = text.split(/(\s+)/); // keep whitespace
    let currentString = '';
    let wordIndex = 0;
    
    const streamNext = () => {
       if (!isMounted.current) return;
       
       if (wordIndex >= words.length) {
          setIsStreaming(false);
          // Pulse effect on complete
          containerScale.value = withSequence(
            withTiming(1.02, { duration: 150 }),
            withTiming(1, { duration: 150 })
          );
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onComplete?.();
          return;
       }
       
       const word = words[wordIndex];
       currentString += word;
       setDisplayedText(currentString);
       wordIndex++;
       
       const delay = Math.max(10, word.length * speedMsPerChar);
       streamTimeout.current = setTimeout(streamNext, delay);
    };
    
    // Start streaming
    streamNext();
    
  }, [text, speedMsPerChar]);

  const handleSkip = () => {
    if (streamTimeout.current) clearTimeout(streamTimeout.current);
    setIsStreaming(false);
    setDisplayedText(text);
    Haptics.selectionAsync();
    onComplete?.();
  };

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }]
  }));

  return (
    <Animated.View className={cn('relative', className)} style={containerStyle}>
      <Text className="text-textPrimary text-base leading-relaxed">
        {displayedText}
        {isStreaming && (
          <Animated.Text style={cursorStyle} className="text-primary font-bold">|</Animated.Text>
        )}
      </Text>
      
      {isStreaming && (
        <View className="mt-4 flex-row justify-end">
          <TouchableOpacity 
            onPress={handleSkip}
            className="flex-row items-center bg-surfaceHighlight/80 px-3 py-1.5 rounded-full border border-white/10"
          >
            <Text className="text-textSecondary text-xs mr-1">Skip</Text>
            <SkipForward size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}
