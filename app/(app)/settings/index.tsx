import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '@/src/components/layout/ScreenWrapper';
import { Header } from '@/src/components/layout/Header';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Button } from '@/src/components/ui/Button';
import { 
  User, 
  Bell, 
  Sparkles, 
  Shield, 
  Moon, 
  Info,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  const [aiModel, setAiModel] = useState('Smart Fallback');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  const models = ['Smart Fallback', 'GPT-4', 'Claude 3 Opus'];

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <View className="flex-row items-center mb-md px-1">
      <Icon size={18} color="#818CF8" className="mr-2" />
      <Text className="text-textSecondary text-xs uppercase font-bold tracking-widest">{title}</Text>
    </View>
  );

  const SettingRow = ({ 
    label, 
    value, 
    hasSwitch, 
    switchValue, 
    onSwitchChange, 
    onPress, 
    isLast 
  }: any) => (
    <TouchableOpacity 
      disabled={hasSwitch || !onPress}
      onPress={onPress}
      className={cn(
        "flex-row items-center justify-between py-4",
        !isLast && "border-b border-white/5"
      )}
    >
      <Text className="text-textPrimary font-medium text-base">{label}</Text>
      <View className="flex-row items-center">
        {value && <Text className="text-textSecondary text-sm mr-2">{value}</Text>}
        {hasSwitch ? (
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

  return (
    <ScreenWrapper className="bg-background">
      <Header title="Settings" onBack={() => router.push('/(app)/dashboard')} />
      
      <ScrollView className="p-lg pb-32" showsVerticalScrollIndicator={false}>
        
        <View className="mb-xl">
          <SectionTitle title="Profile" icon={User} />
          <GlassCard className="p-md">
            <View className="mb-md">
              <Text className="text-textSecondary text-sm mb-xs">Display Name</Text>
              <View className="bg-surfaceHighlight/50 border border-white/10 rounded-xl px-4 py-3">
                <TextInput 
                  value="Social Explorer"
                  className="text-white text-base"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
            <Button className="bg-indigo-600/20 py-3" textClassName="text-indigo-400">
              Update Profile Picture
            </Button>
          </GlassCard>
        </View>

        <View className="mb-xl">
          <SectionTitle title="Notifications" icon={Bell} />
          <GlassCard className="px-md">
            <SettingRow 
              label="Push Notifications" 
              hasSwitch 
              switchValue={pushEnabled} 
              onSwitchChange={(val: boolean) => handleToggle(setPushEnabled, val)} 
            />
            <SettingRow 
              label="Email Digests" 
              hasSwitch 
              switchValue={emailEnabled} 
              onSwitchChange={(val: boolean) => handleToggle(setEmailEnabled, val)} 
              isLast
            />
          </GlassCard>
        </View>

        <View className="mb-xl">
          <SectionTitle title="AI Engine" icon={Sparkles} />
          <GlassCard className="p-md">
            <Text className="text-textSecondary text-sm mb-md">
              Select the primary AI model for generating content.
            </Text>
            
            <TouchableOpacity 
              onPress={() => setShowModelDropdown(!showModelDropdown)}
              className="flex-row items-center justify-between bg-surfaceHighlight/50 border border-white/10 rounded-xl px-4 py-3"
            >
              <Text className="text-white text-base font-medium">{aiModel}</Text>
              <ChevronDown size={20} color="#94A3B8" />
            </TouchableOpacity>

            {showModelDropdown && (
              <View className="mt-2 bg-surface border border-white/5 rounded-xl overflow-hidden">
                {models.map((model, idx) => (
                  <TouchableOpacity 
                    key={model}
                    onPress={() => {
                      setAiModel(model);
                      setShowModelDropdown(false);
                      Haptics.selectionAsync();
                    }}
                    className={cn(
                      "flex-row items-center justify-between p-4",
                      idx !== models.length - 1 && "border-b border-white/5"
                    )}
                  >
                    <Text className={cn("text-base", aiModel === model ? "text-indigo-400 font-bold" : "text-textPrimary")}>
                      {model}
                    </Text>
                    {aiModel === model && <Check size={18} color="#818CF8" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>
        </View>

        <View className="mb-xl">
          <SectionTitle title="Security" icon={Shield} />
          <GlassCard className="px-md">
            <SettingRow 
              label="Change Password" 
              onPress={() => {}} 
            />
            <SettingRow 
              label="Biometric Login" 
              hasSwitch 
              switchValue={biometricsEnabled} 
              onSwitchChange={(val: boolean) => handleToggle(setBiometricsEnabled, val)} 
              isLast
            />
          </GlassCard>
        </View>

        <View className="mb-xl">
          <SectionTitle title="Appearance" icon={Moon} />
          <GlassCard className="px-md">
            <SettingRow 
              label="Dark Mode" 
              hasSwitch 
              switchValue={darkMode} 
              onSwitchChange={(val: boolean) => handleToggle(setDarkMode, val)} 
              isLast
            />
          </GlassCard>
        </View>

        <View className="mb-20">
          <SectionTitle title="About" icon={Info} />
          <GlassCard className="px-md">
            <SettingRow 
              label="App Version" 
              value="1.0.0 (Build 42)"
            />
            <SettingRow 
              label="Privacy Policy" 
              onPress={() => {}}
            />
            <SettingRow 
              label="Terms of Service" 
              onPress={() => {}}
              isLast
            />
          </GlassCard>
        </View>
        
      </ScrollView>
    </ScreenWrapper>
  );
}
