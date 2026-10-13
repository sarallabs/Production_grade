import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  AUTH_TOKEN: 'saral_auth_token',
  USER_PROFILE: 'saral_student_profile',
  STUDENT_PERSONA: 'saral_user_persona',
  QUESTIONNAIRE_DONE: 'saral_questionnaire_completed',
  ACTIVE_BOARD: 'saral_active_board',
  THEME_MODE: 'saral_theme_mode',
};

// Safe threshold for SQLite/AsyncStorage on mobile (500 KB).
// Multi-megabyte entries (like markdown with embedded base64 images) will overflow SQLite (code 13 SQLITE_FULL)
// or exceed the Android CursorWindow limit.
const MAX_DISK_ITEM_SIZE = 500 * 1024;
const MAX_MEMORY_CACHE_ITEMS = 40;

const memoryCache = new Map<string, any>();

function setMemoryCache(key: string, value: any): void {
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= MAX_MEMORY_CACHE_ITEMS) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, value);
}

/**
 * Prunes heavy/volatile study content caches from SQLite to free space for critical app data.
 */
async function pruneVolatileStorage(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const volatileKeys = allKeys.filter(
      (k) =>
        k.startsWith('study_detailed_') ||
        k.startsWith('study_quick_') ||
        k.startsWith('saral_res_') ||
        k.startsWith('mindmap_') ||
        k.startsWith('flashcards_')
    );
    if (volatileKeys.length > 0) {
      console.warn(`[Storage] Pruning ${volatileKeys.length} cached study items from SQLite disk to recover space...`);
      await AsyncStorage.multiRemove(volatileKeys);
    }
  } catch (err) {
    console.warn('[Storage] Failed to prune volatile storage:', err);
  }
}

// Automatically prune legacy oversized disk entries on initial access
let initialPruneDone = false;
async function ensureInitialPrune(): Promise<void> {
  if (initialPruneDone) return;
  initialPruneDone = true;
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const heavyKeys = allKeys.filter(
      (k) => k.startsWith('study_detailed_') || k.startsWith('saral_res_')
    );
    if (heavyKeys.length > 0) {
      await AsyncStorage.multiRemove(heavyKeys);
    }
  } catch {
    // Ignore initial prune errors
  }
}

export const storage = {
  async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    // 1. Fast in-memory lookup
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    try {
      await ensureInitialPrune();
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        setMemoryCache(key, parsed);
        return parsed as T;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    // 1. Always store in memory cache for immediate and fast availability
    setMemoryCache(key, value);

    // 2. Serialize for disk
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      console.warn(`[Storage] Failed to serialize key "${key}":`, e);
      return;
    }

    // 3. Skip disk if item exceeds safe SQLite limit (e.g., base64 markdown > 500 KB)
    if (serialized.length > MAX_DISK_ITEM_SIZE) {
      return;
    }

    // 4. Persist to disk with automatic SQLITE_FULL recovery
    try {
      await AsyncStorage.setItem(key, serialized);
    } catch (e: any) {
      const errStr = String(e || '');
      if (errStr.includes('SQLITE_FULL') || errStr.toLowerCase().includes('full')) {
        await pruneVolatileStorage();
        try {
          await AsyncStorage.setItem(key, serialized);
          return;
        } catch {
          // Still failed, retain in memory only
        }
      }
      console.warn(`[Storage] Could not persist key "${key}" to disk cache:`, e?.message || e);
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove key ${key} from storage:`, e);
    }
  },

  async clear(): Promise<void> {
    memoryCache.clear();
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('[Storage] Failed to clear storage:', e);
    }
  },
};

