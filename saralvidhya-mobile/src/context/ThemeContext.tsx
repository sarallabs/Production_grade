import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeMode, ThemePalette } from '@/constants/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  isFocusMode: boolean;
  colors: ThemePalette;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleFocusMode: () => Promise<void>;
}

const STORAGE_KEY = 'saral_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  isDark: false,
  isFocusMode: false,
  colors: Colors.light,
  setThemeMode: async () => {},
  toggleFocusMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'focus')) {
        setThemeModeState(saved as ThemeMode);
      } else if (systemColorScheme === 'dark') {
        setThemeModeState('dark');
      }
    }).catch(() => {
      // Ignore async storage error on initial load
    });
  }, [systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleFocusMode = async () => {
    const nextMode = themeMode === 'focus' ? 'light' : 'focus';
    await setThemeMode(nextMode);
  };

  const isDark = themeMode === 'dark' || themeMode === 'focus';
  const isFocusMode = themeMode === 'focus';
  const colors: ThemePalette = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        isFocusMode,
        colors,
        setThemeMode,
        toggleFocusMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
