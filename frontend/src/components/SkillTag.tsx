/**
 * AI Mentor - SkillTag Component
 * Pill chip for skill sets, categories, and tags
 */
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

interface SkillTagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SkillTag: React.FC<SkillTagProps> = ({
  label,
  selected = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.tag,
        selected && styles.selectedTag,
        style,
      ]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.cardElevated,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  selectedTag: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderColor: Colors.primary,
  },
  text: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
});
