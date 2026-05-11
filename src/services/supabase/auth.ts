import { supabase } from './client';
import * as AppleAuthentication from 'expo-apple-authentication';

export const AuthService = {
  // Sign in with Email / Password
  async signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  // Register New User
  async signUp(email: string, password: string, fullName: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  },

  // Magic Link
  async signInWithOtp(email: string) {
    return supabase.auth.signInWithOtp({ email });
  },

  // Password Reset
  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },

  // Sign out
  async signOut() {
    return supabase.auth.signOut();
  },

  // Google OAuth
  async signInWithGoogle() {
    // Requires Expo WebBrowser and Google Signin configuration
    // This is a stub for the frontend routing call
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'socialflow-ai://auth/callback',
      },
    });
  },

  // Apple OAuth
  async signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        return supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
      }
      throw new Error('No identity token given by Apple.');
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user cancelled
        return { data: null, error: null };
      }
      return { data: null, error: e as Error };
    }
  },
};
