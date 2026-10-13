import { useWindowDimensions } from 'react-native';
import { TABLET_CONTENT_MAX_WIDTH, TABLET_MIN_WIDTH } from '@/constants/theme';

export interface DeviceLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  /** Suggested grid columns: 1 (phone), 2 (tablet portrait), 3 (wide tablet). */
  columns: 1 | 2 | 3;
  /** Max width for centered content on tablet; undefined on phone. */
  contentMaxWidth: number | undefined;
  /** Multiplier for font/spacing on tablet. */
  scale: number;
}

/**
 * Live device layout info. Uses window width (not device model) so it reacts
 * to rotation, split-screen and foldables.
 */
export function useDeviceLayout(): DeviceLayout {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const columns: 1 | 2 | 3 = !isTablet ? 1 : width >= 1024 ? 3 : 2;

  return {
    width,
    height,
    isTablet,
    isLandscape: width > height,
    columns,
    contentMaxWidth: isTablet ? TABLET_CONTENT_MAX_WIDTH : undefined,
    scale: isTablet ? 1.15 : 1,
  };
}
