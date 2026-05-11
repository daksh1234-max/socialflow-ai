import React from 'react';
import { View, Modal, TouchableWithoutFeedback } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View 
              entering={SlideInDown.springify().damping(15)} 
              exiting={SlideOutDown.duration(200)}
              className="bg-surface rounded-t-3xl border-t border-white/10"
              style={{ paddingBottom: insets.bottom || 24 }}
            >
              <View className="w-12 h-1.5 bg-white/20 rounded-full self-center my-sm" />
              <View className="px-lg pt-sm pb-md">
                {children}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
