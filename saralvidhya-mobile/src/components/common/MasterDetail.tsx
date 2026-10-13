import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { useAppTheme } from '@/context/ThemeContext';

interface MasterDetailProps {
  master: React.ReactNode;
  detail: React.ReactNode;
  /** Width of the master pane on tablet. */
  masterWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tablet: master and detail side by side with a divider.
 * Phone: renders only `master`; the screen decides how to navigate to detail.
 */
export default function MasterDetail({ master, detail, masterWidth = 340, style }: MasterDetailProps) {
  const { isTablet } = useDeviceLayout();
  const { colors } = useAppTheme();

  if (!isTablet) {
    return <View style={[{ flex: 1 }, style]}>{master}</View>;
  }

  return (
    <View style={[{ flex: 1, flexDirection: 'row' }, style]}>
      <View style={{ width: masterWidth }}>{master}</View>
      <View style={{ width: 1, backgroundColor: colors.border }} />
      <View style={{ flex: 1 }}>{detail}</View>
    </View>
  );
}
