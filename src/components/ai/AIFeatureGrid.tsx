import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { 
  Sparkles, 
  Hash, 
  Zap, 
  RefreshCw, 
  Image as ImageIcon, 
  TrendingUp, 
  ArrowRight 
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '../ui/GlassCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  type: string;
}

const FEATURES: Feature[] = [
  {
    id: '1',
    title: 'Captions',
    description: 'Engaging post copies',
    icon: Sparkles,
    color: 'bg-indigo-500',
    type: 'caption'
  },
  {
    id: '2',
    title: 'Hashtags',
    description: 'Viral reach boosters',
    icon: Hash,
    color: 'bg-blue-500',
    type: 'hashtags'
  },
  {
    id: '3',
    title: 'Hooks',
    description: 'Stop the scroll',
    icon: Zap,
    color: 'bg-amber-500',
    type: 'hook'
  },
  {
    id: '4',
    title: 'Rewrite',
    description: 'Platform adaptation',
    icon: RefreshCw,
    color: 'bg-emerald-500',
    type: 'rewrite'
  },
  {
    id: '5',
    title: 'AI Image',
    description: 'Stunning visuals',
    icon: ImageIcon,
    color: 'bg-violet-500',
    type: 'image'
  },
  {
    id: '6',
    title: 'Trends',
    description: 'Niche insights',
    icon: TrendingUp,
    color: 'bg-rose-500',
    type: 'trending_topics'
  }
];

interface FeatureCardProps {
  feature: Feature;
  index: number;
  onPress: (type: string) => void;
}

function FeatureCard({ feature, index, onPress }: FeatureCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(index * 50, withSpring(1));
    translateY.value = withDelay(index * 50, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(feature.type);
  };

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, animatedStyle]} className="mb-4">
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <GlassCard className="p-4 items-start h-40">
          <View className={cn('p-3 rounded-2xl mb-3', feature.color)}>
            <feature.icon size={24} color="#fff" />
          </View>
          <Text className="text-textPrimary font-bold text-lg">{feature.title}</Text>
          <Text className="text-textSecondary text-xs mb-2" numberOfLines={2}>
            {feature.description}
          </Text>
          <View className="mt-auto flex-row items-center">
            <Text className="text-primary text-xs font-semibold mr-1">Try it</Text>
            <ArrowRight size={12} color="#818CF8" />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface AIFeatureGridProps {
  onFeatureSelect: (type: string) => void;
  className?: string;
}

export function AIFeatureGrid({ onFeatureSelect, className }: AIFeatureGridProps) {
  return (
    <View className={cn('flex-row flex-wrap justify-between px-4', className)}>
      {FEATURES.map((feature, index) => (
        <FeatureCard 
          key={feature.id} 
          feature={feature} 
          index={index} 
          onPress={onFeatureSelect}
        />
      ))}
    </View>
  );
}
