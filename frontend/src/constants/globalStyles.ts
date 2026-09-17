/**
 * AI Mentor - Global Shared Styles
 */
import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './theme';

export const GlobalStyles = StyleSheet.create({
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadding: {
    paddingHorizontal: Spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardElevated: {
    backgroundColor: Colors.cardElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },

  // Typography
  h1: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: Typography.h4,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  h5: {
    fontSize: Typography.h5,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: Typography.body,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
  },
  bodySmall: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: Typography.caption,
    fontWeight: Typography.regular,
    color: Colors.textMuted,
  },
  label: {
    fontSize: Typography.label,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
    letterSpacing: Typography.wide,
    textTransform: 'uppercase',
  },
  accentText: {
    color: Colors.textAccent,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  buttonSecondary: {
    backgroundColor: Colors.googleButton,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.background,
  },
  buttonTextSecondary: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },

  // Row helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
});
