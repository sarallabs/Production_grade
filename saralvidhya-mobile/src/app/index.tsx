import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/**
 * Root entry route:
 * - If not authenticated -> redirect to login (Step 1 of flow)
 * - If authenticated -> redirect to courses (Step 3 of flow)
 */
export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/courses" />;
}
