/**
 * AI Mentor - Card Component
 */
import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Animated,
  Platform,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'glow';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base];

    switch (variant) {
      case 'elevated':
        base.push(styles.elevated);
        break;
      case 'outlined':
        base.push(styles.outlined);
        break;
      case 'glow':
        base.push(styles.glow);
        break;
      default:
        base.push(styles.default);
        break;
    }

    return base;
  };

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 6,
      tension: 100,
    }).start();
  };

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[getCardStyle(), style]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  default: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  glow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
});
