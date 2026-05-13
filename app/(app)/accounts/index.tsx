import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Button } from '@/src/components/ui/Button';
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Plus, 
  Unlink, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';
import { useSocialAccounts, SocialAccount } from '@/src/hooks/api/useSocialAccounts';
import { useToastStore } from '@/src/components/feedback/Toast';
import { cn } from '@/src/lib/utils';
import * as Haptics from 'expo-haptics';

const PLATFORM_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  instagram: { icon: Instagram, color: '#E1306C', label: 'Instagram' },
  twitter: { icon: Twitter, color: '#1DA1F2', label: 'Twitter / X' },
  linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
};

export default function AccountsScreen() {
  const { accounts, isLoading, connect, isConnecting, disconnect } = useSocialAccounts();
  const { showToast } = useToastStore();

  const handleConnect = async (platform: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await connect(platform);
      showToast(`${PLATFORM_CONFIG[platform].label} connected!`, 'success');
    } catch (e) {
      showToast('Connection failed', 'error');
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await disconnect(accountId);
      showToast(`Disconnected from ${PLATFORM_CONFIG[platform].label}`, 'info');
    } catch (e) {
      showToast('Disconnection failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Header title="Social Accounts" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#818CF8" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable>
      <Header title="Social Accounts" />
      
      <View className="p-lg gap-y-xl">
        {/* Connected Accounts */}
        <View>
          <Text className="text-xl font-bold text-textPrimary mb-md">Connected Profiles</Text>
          {accounts.length === 0 ? (
            <GlassCard className="items-center p-xl">
              <AlertCircle size={40} color="#94A3B8" />
              <Text className="text-textSecondary mt-md text-center">
                No accounts connected yet. Link your profiles to start scheduling content.
              </Text>
            </GlassCard>
          ) : (
            <View className="gap-y-md">
              {accounts.map((account) => {
                const config = PLATFORM_CONFIG[account.platform.toLowerCase()];
                const Icon = config?.icon || AlertCircle;
                
                return (
                  <GlassCard key={account.id} className="flex-row items-center justify-between p-md">
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mr-md"
                        style={{ backgroundColor: `${config?.color}20` }}
                      >
                        <Icon size={24} color={config?.color || '#94A3B8'} />
                      </View>
                      <View>
                        <Text className="text-textPrimary font-bold text-lg">{config?.label}</Text>
                        <Text className="text-textSecondary">@{account.handle}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => handleDisconnect(account.id, account.platform.toLowerCase())}
                      className="p-sm bg-error/10 rounded-lg"
                    >
                      <Unlink size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>

        {/* Available Platforms */}
        <View>
          <Text className="text-xl font-bold text-textPrimary mb-md">Add New Connection</Text>
          <View className="gap-y-md">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const isConnected = accounts.some(a => a.platform.toLowerCase() === key);
              const Icon = config.icon;
              
              return (
                <TouchableOpacity 
                  key={key}
                  onPress={() => !isConnected && handleConnect(key)}
                  disabled={isConnected || isConnecting}
                  className={cn(
                    "flex-row items-center justify-between p-md rounded-2xl border",
                    isConnected 
                      ? "bg-surfaceHighlight/30 border-white/5 opacity-60" 
                      : "bg-surface border-white/10"
                  )}
                >
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-md"
                      style={{ backgroundColor: config.color }}
                    >
                      <Icon size={20} color="#fff" />
                    </View>
                    <Text className="text-textPrimary font-semibold text-base">{config.label}</Text>
                  </View>
                  
                  {isConnected ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <Plus size={20} color="#818CF8" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}
