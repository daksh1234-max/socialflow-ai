import { Platform } from 'react-native';

/**
 * A simple platform-agnostic storage wrapper.
 * Uses localStorage on web and a simple in-memory map on native 
 * (to avoid NitroModules issues in Expo Go/standard dev builds).
 */
class UniversalStorage {
  private memoryCache = new Map<string, string>();

  set(key: string, value: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        this.memoryCache.set(key, value);
      }
    } else {
      this.memoryCache.set(key, value);
    }
  }

  getString(key: string): string | undefined {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key) || undefined;
      } catch (e) {
        return this.memoryCache.get(key);
      }
    }
    return this.memoryCache.get(key);
  }

  delete(key: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
    this.memoryCache.delete(key);
  }
}

export const storage = new UniversalStorage();
