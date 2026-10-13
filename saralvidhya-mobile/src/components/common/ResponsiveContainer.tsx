import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { TabletSpacing } from '@/constants/theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Phone: plain flex container (no visual change).
 * Tablet: centers content up to the max content width with horizontal padding.
 */
export default function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { isTablet, contentMaxWidth } = useDeviceLayout();

  if (!isTablet) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <View style={[{ flex: 1, alignItems: 'center' }, style]}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: contentMaxWidth,
          paddingHorizontal: TabletSpacing.md,
        }}
      >
        {children}
      </View>
    </View>
  );
}
