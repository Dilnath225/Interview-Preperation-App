/**
 * AI Mentor - CategoryCard Component
 * Displays interview categories with icon, title, description, and optional badges
 * Web responsive cursor & styling
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

interface CategoryCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  badge?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  iconName,
  iconColor = Colors.primary,
  iconBgColor = 'rgba(0, 245, 212, 0.1)',
  badge,
  fullWidth = true,
  style,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        fullWidth ? styles.fullWidth : styles.halfWidth,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : fullWidth ? (
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        ) : null}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={fullWidth ? 2 : 3}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  fullWidth: {
    width: '100%',
  },
  halfWidth: {
    flex: 1,
    minHeight: 160,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  badgeText: {
    fontSize: Typography.label,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
