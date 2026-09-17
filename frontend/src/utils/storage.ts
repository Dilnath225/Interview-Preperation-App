import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback map if native storage is unavailable or restricted
const memoryStorage = new Map<string, string>();

export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
      return memoryStorage.get(key) ?? null;
    } catch (err) {
      console.warn(`[Storage] getItem fallback for ${key}:`, err);
      return memoryStorage.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      memoryStorage.set(key, value);
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[Storage] setItem fallback to memory for ${key}:`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      memoryStorage.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[Storage] removeItem fallback for ${key}:`, err);
    }
  },
};
