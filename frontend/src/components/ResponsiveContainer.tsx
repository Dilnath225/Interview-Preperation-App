import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
  noPadding?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth,
  noPadding = false,
}) => {
  const { maxContentWidth, contentPadding, isDesktop } = useResponsive();

  const containerMaxWidth = maxWidth ?? maxContentWidth;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingHorizontal: noPadding ? 0 : contentPadding,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            maxWidth: containerMaxWidth,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
});
