import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '@/src/services/supabase/auth';
import { BiometricService } from '@/src/lib/biometrics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (isMagicLink) {
        const { error } = await AuthService.signInWithOtp(email);
        if (error) throw error;
        Alert.alert('Check your email', 'We sent you a magic link!');
      } else {
        const { error } = await AuthService.signInWithPassword(email, password);
        if (error) throw error;
        await BiometricService.saveCredentials(email, password);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const creds = await BiometricService.getCredentials();
    if (!creds) {
      Alert.alert('No saved credentials', 'Please login with password first');
      return;
    }
    const success = await BiometricService.authenticateAsync();
    if (success) {
      setLoading(true);
      const { error } = await AuthService.signInWithPassword(creds.email, creds.password);
      setLoading(false);
      if (error) Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top }}>
      <View className="mt-xl flex-1 justify-center">
        <Text className="text-3xl font-bold text-textPrimary mb-sm">SocialFlow AI</Text>
        <Text className="text-textSecondary mb-xl">Sign in to automate your social presence</Text>

        <View className="bg-surface p-lg rounded-xl border border-white/5 space-y-md">
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

          {!isMagicLink && (
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
          )}

          <View className="flex-row items-center justify-between mt-md">
            <Text className="text-textPrimary">Use Magic Link</Text>
            <Switch value={isMagicLink} onValueChange={setIsMagicLink} trackColor={{ false: '#475569', true: '#6366F1' }} thumbColor="#fff" />
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-lg py-md items-center justify-center mt-lg flex-row"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-lg">{isMagicLink ? 'Send Magic Link' : 'Sign In'}</Text>}
          </TouchableOpacity>
        </View>

        <View className="items-center mt-lg space-y-md">
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mb-sm">
            <Text className="text-primary font-medium">Create an account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="mb-sm">
            <Text className="text-textSecondary">Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBiometric} className="mb-sm">
            <Text className="text-accent">Login with FaceID / TouchID</Text>
          </TouchableOpacity>
          
          <View className="flex-row space-x-md mt-md">
            <TouchableOpacity onPress={() => AuthService.signInWithGoogle()} className="bg-surface p-md rounded-full border border-white/10">
              <Text className="text-textPrimary font-bold">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => AuthService.signInWithApple()} className="bg-surface p-md ml-sm rounded-full border border-white/10">
              <Text className="text-textPrimary font-bold">Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
