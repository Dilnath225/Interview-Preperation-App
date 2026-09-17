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
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  label,
  subLabel,
  color = Colors.primary,
  style,
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
        },
        style,
      ]}
    >
      <Text style={[styles.labelText, { fontSize: size > 70 ? Typography.h5 : Typography.bodySmall }]}>
        {displayLabel}
      </Text>
      {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
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
