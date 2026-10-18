/**
 * AI Mentor - ProgressRing Component
 * Circular indicator with cyan glow accent and center value/subtext
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography } from '../constants/theme';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  label,
  subLabel,
  color = Colors.primary,
  style,
  children,
}) => {
  const displayLabel = label !== undefined ? label : `${Math.round(progress)}%`;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          backgroundColor: `${color}12`,
        },
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <>
          {displayLabel !== '' && (
            <Text style={[styles.labelText, { fontSize: size > 70 ? Typography.h5 : Typography.bodySmall, color }]}>
              {displayLabel}
            </Text>
          )}
          {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subLabelText: {
    fontSize: Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
