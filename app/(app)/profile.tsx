import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { Button } from '@/src/components/ui/Button';
import { useAuthStore } from '@/src/stores/authStore';
import { AuthService } from '@/src/services/supabase/auth';
import { Avatar } from '@/src/components/ui/Avatar';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { 
  User, 
  Bell, 
  Moon, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Share2,
  Sparkles,
  BarChart2
} from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { useRouter } from 'expo-router';

interface SettingsItemProps {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  isLast?: boolean;
  color?: string;
}

const SettingsItem = ({ 
  icon: Icon, 
  label, 
  value, 
  onPress, 
  showSwitch, 
  switchValue, 
  onSwitchChange,
  isLast,
  color = "#818CF8"
}: SettingsItemProps) => (
  <TouchableOpacity 
    onPress={onPress}
    disabled={showSwitch}
    className={cn(
      "flex-row items-center justify-between py-4",
      !isLast && "border-b border-white/5"
    )}
  >
    <View className="flex-row items-center">
      <View className="p-2 rounded-xl mr-md" style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} color={color} />
      </View>
      <Text className="text-textPrimary font-medium text-base">{label}</Text>
    </View>
    <View className="flex-row items-center">
      {value && <Text className="text-textSecondary text-sm mr-2">{value}</Text>}
      {showSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitchChange}
          trackColor={{ false: '#334155', true: '#818CF8' }}
          thumbColor="#fff"
        />
      ) : (
        <ChevronRight size={18} color="#475569" />
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = React.useState(true);

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <ScreenWrapper scrollable>
      <Header title="My Account" />
      
      <View className="p-lg pb-32">
        {/* Profile Header */}
        <View className="items-center mb-xl">
          <View className="relative">
            <Avatar fallback={user?.user_metadata?.full_name || 'U'} size="xl" />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-4 border-background">
              <User size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-textPrimary mt-md">
            {user?.user_metadata?.full_name || 'Social Explorer'}
          </Text>
          <Text className="text-textSecondary text-sm">{user?.email}</Text>
          <Text className="text-textSecondary text-center text-xs mt-2 px-8">
            AI-driven content creator and social media strategist.
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-x-4 mb-xl">
          <GlassCard className="flex-1 p-md items-center">
            <Text className="text-textPrimary font-bold text-lg">124</Text>
            <Text className="text-textSecondary text-[10px] uppercase font-bold tracking-tighter">Posts</Text>
          </GlassCard>
          <GlassCard className="flex-1 p-md items-center">
            <Text className="text-textPrimary font-bold text-lg">482</Text>
            <Text className="text-textSecondary text-[10px] uppercase font-bold tracking-tighter">AI Gens</Text>
          </GlassCard>
          <GlassCard className="flex-1 p-md items-center">
            <Text className="text-textPrimary font-bold text-lg">3</Text>
            <Text className="text-textSecondary text-[10px] uppercase font-bold tracking-tighter">Socials</Text>
          </GlassCard>
        </View>

        {/* Settings Sections */}
        <View className="gap-y-6">
          <View>
            <Text className="text-textSecondary text-xs uppercase font-bold mb-3 tracking-widest px-1">Settings</Text>
            <GlassCard className="px-md">
              <SettingsItem 
                icon={User} 
                label="Edit Profile" 
                onPress={() => {}} 
              />
              <SettingsItem 
                icon={Share2} 
                label="Connected Accounts" 
                onPress={() => router.push('/(app)/accounts')} 
              />
              <SettingsItem 
                icon={Moon} 
                label="Dark Mode" 
                showSwitch 
                switchValue={isDarkMode}
                onSwitchChange={setIsDarkMode}
                isLast
              />
            </GlassCard>
          </View>

          <View>
            <Text className="text-textSecondary text-xs uppercase font-bold mb-3 tracking-widest px-1">Preferences</Text>
            <GlassCard className="px-md">
              <SettingsItem 
                icon={Bell} 
                label="Notifications" 
                value="Enabled"
                onPress={() => {}} 
              />
              <SettingsItem 
                icon={Shield} 
                label="Security" 
                onPress={() => {}} 
              />
              <SettingsItem 
                icon={Sparkles} 
                label="AI Model Preferences" 
                value="Smart Fallback"
                isLast
              />
            </GlassCard>
          </View>

          <View>
            <Text className="text-textSecondary text-xs uppercase font-bold mb-3 tracking-widest px-1">Other</Text>
            <GlassCard className="px-md">
              <SettingsItem 
                icon={HelpCircle} 
                label="Help & Support" 
                onPress={() => {}} 
              />
              <SettingsItem 
                icon={Shield} 
                label="Privacy Policy" 
                onPress={() => {}} 
                isLast
              />
            </GlassCard>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center justify-center p-md bg-error/10 border border-error/20 rounded-2xl"
          >
            <LogOut size={20} color="#EF4444" className="mr-2" />
            <Text className="text-error font-bold">Log Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-textSecondary text-[10px] mt-2">
            SocialFlow AI v1.0.0
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}
