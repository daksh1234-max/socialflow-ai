import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Search, Filter, SortAsc, SortDesc, Trash2, Ghost } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { useAIStore } from '@/src/stores/aiStore';
import { AIResultCard } from './AIResultCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'caption', label: 'Captions' },
  { id: 'hashtags', label: 'Hashtags' },
  { id: 'hook', label: 'Hooks' },
  { id: 'cta', label: 'CTAs' },
  { id: 'image', label: 'Images' },
  { id: 'favorite', label: 'Favorites' },
];

export function AIHistoryList() {
  const { history, clearHistory } = useAIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredHistory = useMemo(() => {
    let result = [...history];

    // Filter by type
    if (activeFilter !== 'all') {
      if (activeFilter === 'favorite') {
        // In a real app, we'd check a 'is_favorite' property
        // For now, we'll just show all as a placeholder for favorites
      } else {
        result = result.filter(item => {
           // We'd need to store the type in history objects too
           // Assuming AIResult or string for now
           return true; 
        });
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        const text = typeof item === 'string' ? item : item.text;
        return text.toLowerCase().includes(query);
      });
    }

    // Sort
    result.sort((a, b) => {
      // Assuming a 'timestamp' or just based on order in store (newest first)
      return sortBy === 'newest' ? 0 : 0; 
    });

    return result;
  }, [history, searchQuery, activeFilter, sortBy]);

  const onRefresh = () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate fetching
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearHistory();
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20 px-10">
      <View className="bg-surfaceHighlight p-6 rounded-full mb-6">
        <Ghost size={48} color="#94A3B8" />
      </View>
      <Text className="text-textPrimary font-bold text-xl mb-2">No generations yet</Text>
      <Text className="text-textSecondary text-center">
        Try creating something amazing with the generator above. Your history will appear here.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 px-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-textPrimary font-bold text-xl">History</Text>
        <TouchableOpacity onPress={handleClearHistory}>
          <Text className="text-error/70 text-xs font-medium">Clear All</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-background border border-white/5 rounded-xl px-3 mb-4 h-12">
        <Search size={18} color="#64748B" />
        <TextInput
          className="flex-1 ml-2 text-textPrimary h-full"
          placeholder="Search history..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="mb-6">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setActiveFilter(item.id);
                Haptics.selectionAsync();
              }}
              className={cn(
                'px-4 py-2 rounded-full mr-2 border',
                activeFilter === item.id ? 'bg-primary border-primary' : 'bg-surfaceHighlight/50 border-white/5'
              )}
            >
              <Text className={cn('text-xs font-medium', activeFilter === item.id ? 'text-white' : 'text-textSecondary')}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
            <AIResultCard 
              result={typeof item === 'string' ? item : item.text} 
              type="caption" // Placeholder
              platform="Instagram" // Placeholder
            />
          </Animated.View>
        )}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="#818CF8" 
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
