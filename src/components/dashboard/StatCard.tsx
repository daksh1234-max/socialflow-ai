import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[150px]">
      <View className="flex-row items-center mb-md">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-sm">
          <Icon size={16} color="#A78BFA" />
        </View>
        <Text className="text-textSecondary text-sm font-medium">{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-textPrimary mb-xs">{value}</Text>
      
      {trend && (
        <View className="flex-row items-center">
          {trend.isPositive ? (
            <TrendingUp size={14} color="#10B981" />
          ) : (
            <TrendingDown size={14} color="#EF4444" />
          )}
          <Text className={`text-xs ml-1 font-medium ${trend.isPositive ? 'text-success' : 'text-error'}`}>
            {trend.value} from last week
          </Text>
        </View>
      )}
    </Card>
  );
}
