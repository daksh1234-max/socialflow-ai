import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = false, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-lg py-md border-b flex-none h-[60px]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <View className="flex-row items-center">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="mr-md">
            <ArrowLeft color="#F8FAFC" size={24} />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-semibold text-textPrimary">{title}</Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
