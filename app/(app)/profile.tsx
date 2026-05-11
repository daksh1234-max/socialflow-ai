import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { Button } from '@/src/components/ui/Button';
import { useAuthStore } from '@/src/stores/authStore';
import { AuthService } from '@/src/services/supabase/auth';
import { Avatar } from '@/src/components/ui/Avatar';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <ScreenWrapper>
      <Header title="Profile" />
      <View className="p-xl items-center">
        <Avatar fallback={user?.user_metadata?.full_name || 'U'} size="xl" className="mb-md" />
        <Text className="text-2xl font-bold text-textPrimary mb-xs">
          {user?.user_metadata?.full_name || 'Anonymous User'}
        </Text>
        <Text className="text-textSecondary mb-xl">{user?.email}</Text>
        
        <Button variant="danger" onPress={handleLogout} className="w-full">
          Log Out
        </Button>
      </View>
    </ScreenWrapper>
  );
}
