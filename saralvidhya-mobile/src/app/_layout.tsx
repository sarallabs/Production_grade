import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, LogBox } from 'react-native';

import { ThemeProvider as SaralThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import OfflineBanner from '@/components/common/OfflineBanner';

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  "Can't perform a React state update",
]);

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();
  const hasShownLandingRef = React.useRef(false);

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';
    const isLanding = segments[0] === 'landing';

    if (!isAuthenticated && !inAuthGroup && !isLanding) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !hasShownLandingRef.current && !isLanding) {
      // First time opening app: show landing page for 2 seconds!
      hasShownLandingRef.current = true;
      router.replace('/landing');
    } else if (isAuthenticated && inAuthGroup) {
      hasShownLandingRef.current = true;
      router.replace('/landing');
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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="subjects/index" />
      <Stack.Screen name="subjects/[subjectId]" />
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
      <SaralThemeProvider>
        <ThemedApp />
      </SaralThemeProvider>
    </AuthProvider>
  );
}
