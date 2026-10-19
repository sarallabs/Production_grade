import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, LogBox, Dimensions, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

import { ThemeProvider as SaralThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/context/CourseContext';
import OfflineBanner from '@/components/common/OfflineBanner';

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  "Can't perform a React state update",
]);

SplashScreen.preventAutoHideAsync();

/**
 * Phones stay portrait; tablets (physical short side >= 600dp) may rotate.
 * Uses the physical screen (not the window) so split-screen on a tablet
 * doesn't lock rotation. Re-evaluated on foldable/size changes.
 */
function useOrientationPolicy() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const apply = () => {
      const s = Dimensions.get('screen');
      const isTabletDevice = Math.min(s.width, s.height) >= 600;
      if (isTabletDevice) {
        ScreenOrientation.unlockAsync().catch(() => {});
      } else {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
    apply();
    const sub = Dimensions.addEventListener('change', apply);
    return () => sub.remove();
  }, []);
}

function RootNavigation() {
  useOrientationPolicy();
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#2D3E36' : '#FFF6F1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="courses/index" />
      <Stack.Screen name="subjects/index" />
      <Stack.Screen name="subjects/[subjectId]" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function ThemedApp() {
  const { isDark } = useAppTheme();

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#22c55e',
      background: '#FFF6F1',
      card: '#FFFFFF',
      text: '#1C2E24',
      border: '#E5DDD8',
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#22c55e',
      background: '#2D3E36',
      card: '#23322B',
      text: '#FFFFFF',
      border: '#3D5449',
    },
  };

  return (
    <NavThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
      <OfflineBanner />
      <RootNavigation />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CourseProvider>
        <SaralThemeProvider>
          <ThemedApp />
        </SaralThemeProvider>
      </CourseProvider>
    </AuthProvider>
  );
}
