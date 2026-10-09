/**
 * Saral Vidhya Design System & Theme Tokens
 * Primary brand: Emerald green (#22c55e) and Dark Slate (#0f172a)
 */

import '@/global.css';
import { Platform } from 'react-native';

export interface ThemePalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  tint: string;
  danger: string;
  warning: string;
  info: string;
  backgroundElement: string;
  backgroundSelected: string;
}

export const Colors: { light: ThemePalette; dark: ThemePalette } = {
  light: {
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#ecfdf5',
    background: '#FFF6F1',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1C2E24',
    textSecondary: '#557A65',
    border: '#E5DDD8',
    tint: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    backgroundElement: '#F7EBE3',
    backgroundSelected: '#EED9CE',
  },
  dark: {
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#064e3b',
    background: '#2D3E36',
    surface: '#23322B',
    card: '#23322B',
    text: '#FFFFFF',
    textSecondary: '#A6C5B3',
    border: '#3D5449',
    tint: '#4ade80',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    backgroundElement: '#374B41',
    backgroundSelected: '#3D5449',
  },
};

export type ThemeMode = 'light' | 'dark' | 'focus';
export type ThemeColor = keyof ThemePalette;

export const Typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  subtitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
