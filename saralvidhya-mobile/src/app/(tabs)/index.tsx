import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root tabs index redirects to the first active study tab: Learn.
 * (Bottom toolbar only has 4 tabs: Learn, Practice, Prepare, Resources).
 */
export default function TabsIndexRedirect() {
  return <Redirect href="/(tabs)/learn" />;
}
