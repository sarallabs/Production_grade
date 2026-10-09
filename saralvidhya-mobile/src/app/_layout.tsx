import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator } from 'react-native';

import { ThemeProvider as SaralThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import OfflineBanner from '@/components/common/OfflineBanner';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';
    const isLanding = segments[0] === 'landing';

    if (!isAuthenticated && !inAuthGroup && !isLanding) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/landing');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF6F1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="subjects/index" />
      <Stack.Screen name="subjects/[subjectId]" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#22c55e',
      background: '#FFF6F1',
      card: '#ffffff',
      text: '#0f172a',
      border: '#eed9ce',
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#22c55e',
      background: '#6E997E',
      card: '#4e745c',
      text: '#ffffff',
      border: '#5b856b',
    },
  };

  return (
    <AuthProvider>
      <SaralThemeProvider>
        <NavThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
          <OfflineBanner />
          <RootNavigation />
        </NavThemeProvider>
      </SaralThemeProvider>
    </AuthProvider>
  );
}
