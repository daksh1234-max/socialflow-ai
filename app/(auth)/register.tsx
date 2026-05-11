import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '@/src/services/supabase/auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signUp(email, password, fullName);
      if (error) throw error;
      Alert.alert('Success', 'Welcome to SocialFlow AI!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top }}>
      <View className="mt-xl flex-1 justify-center">
        <Text className="text-3xl font-bold text-textPrimary mb-sm">Create Account</Text>
        <Text className="text-textSecondary mb-xl">Join SocialFlow AI today</Text>

        <View className="bg-surface p-lg rounded-xl border border-white/5 gap-y-md">
          <View className="mt-md">
            <Text className="text-textSecondary mb-xs">Full Name</Text>
            <TextInput 
              className="bg-background text-textPrimary px-md py-sm rounded-lg border border-white/10"
              placeholderTextColor="#475569"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          
          <View className="mt-md">
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

          <View className="mt-md">
            <Text className="text-textSecondary mb-xs">Password</Text>
            <TextInput 
              className="bg-background text-textPrimary px-md py-sm rounded-lg border border-white/10"
              placeholderTextColor="#475569"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-lg py-md items-center justify-center mt-lg"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-lg">Sign Up</Text>}
          </TouchableOpacity>
        </View>

        <View className="items-center mt-lg">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-textSecondary pt-md">Already have an account? <Text className="text-primary font-medium">Log in</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
