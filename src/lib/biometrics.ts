import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_CRED_KEY = 'BIOMETRIC_CRED_KEY';

export const BiometricService = {
  async getSupportedTypes() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return { isSupported: false, types: [] };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { isSupported: true, types };
  },

  async authenticateAsync(promptMessage: string = 'Welcome back! Please authenticate') {
    const status = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false, // allows PIN/pattern if biometrics fail
    });

    return status.success;
  },

  async saveCredentials(email: string, password: string) {
    const data = JSON.stringify({ email, password });
    await SecureStore.setItemAsync(BIOMETRIC_CRED_KEY, data);
  },

  async getCredentials() {
    try {
      const data = await SecureStore.getItemAsync(BIOMETRIC_CRED_KEY);
      if (data) {
        return JSON.parse(data) as { email: string; password: string };
      }
    } catch (e) {
      console.error('Error fetching biometric credentials', e);
    }
    return null;
  },

  async removeCredentials() {
    await SecureStore.deleteItemAsync(BIOMETRIC_CRED_KEY);
  },
};
