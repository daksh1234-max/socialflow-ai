import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '@/src/services/supabase/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleReset = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.resetPassword(email);
      if (error) throw error;
      Alert.alert('Check your email', 'Password reset instructions have been sent!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top }}>
      <View className="mt-xl flex-1 justify-center">
        <Text className="text-3xl font-bold text-textPrimary mb-sm">Reset Password</Text>
        <Text className="text-textSecondary mb-xl">We'll send you a link to reset it</Text>

        <View className="bg-surface p-lg rounded-xl border border-white/5">
          <View>
            <Text className="text-textSecondary mb-xs">Email</Text>
            <TextInput 
              className="bg-background text-textPrimary px-md py-sm rounded-lg border border-white/10"
              placeholderTextColor="#475569"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-lg py-md items-center justify-center mt-lg"
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-lg">Send Reset Link</Text>}
          </TouchableOpacity>
        </View>

        <View className="items-center mt-lg">
          <TouchableOpacity onPress={() => router.back()} className="mt-md">
            <Text className="text-textSecondary">Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
