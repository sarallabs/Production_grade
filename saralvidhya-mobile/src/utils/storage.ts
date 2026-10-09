import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  AUTH_TOKEN: 'saral_auth_token',
  USER_PROFILE: 'saral_student_profile',
  STUDENT_PERSONA: 'saral_user_persona',
  QUESTIONNAIRE_DONE: 'saral_questionnaire_completed',
  ACTIVE_BOARD: 'saral_active_board',
  THEME_MODE: 'saral_theme_mode',
};

export const storage = {
  async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save key ${key} to storage`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove key ${key} from storage`, e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};
