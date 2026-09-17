/**
 * AI Mentor - Design System Theme
 * Dark theme with cyan accent matching the UI designs
 */

export const Colors = {
  // Primary backgrounds
  background: '#0A0E14',
  backgroundLight: '#0D1117',
  card: '#111822',
  cardElevated: '#1A2332',
  surface: '#151C28',

  // Accent
  primary: '#00F5D4',
  primaryDark: '#00C9AE',
  primaryLight: '#33F7DD',
  primaryMuted: 'rgba(0, 245, 212, 0.15)',
  primaryBorder: 'rgba(0, 245, 212, 0.3)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8B95A5',
  textMuted: '#5A6577',
  textAccent: '#00F5D4',

  // Borders
  border: '#1E2A3A',
  borderLight: '#2A3545',

  // Status
  success: '#00E676',
  warning: '#FFB300',
  error: '#FF5252',
  info: '#448AFF',

  // Input
  inputBackground: '#111822',
  inputBorder: '#1E2A3A',
  inputFocusBorder: '#00F5D4',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  googleButton: '#2A3545',
  tabInactive: '#5A6577',
  tabActive: '#00F5D4',

  // Badge colors
  badgeCyan: '#00F5D4',
  badgeYellow: '#FFD700',
  badgeElite: 'rgba(0, 245, 212, 0.2)',
} as const;

export const Typography = {
  // Font sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 11,

  // Font weights
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,

  // Letter spacing
  wide: 2,
  normal: 0,
  tight: -0.5,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
