/**
 * AI Mentor - AnimatedEntrance Component
 * Smooth fade & slide entrance animation for pages, cards, and list elements.
 * 100% compatible with iOS, Android, and Web.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, Platform } from 'react-native';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  scale?: boolean;
}

export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  style,
  delay = 0,
  duration = 320,
  distance = 18,
  direction = 'up',
  scale = false,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(distance)).current;
  const scaleAnim = useRef(new Animated.Value(scale ? 0.95 : 1)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    const animTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: useNative,
        }),
        Animated.spring(translate, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: useNative,
        }),
        scale
          ? Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 70,
              useNativeDriver: useNative,
            })
          : Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1,
              useNativeDriver: useNative,
            }),
      ]).start();
    }, delay);

    return () => clearTimeout(animTimer);
  }, [delay, duration, scale]);

  const getTransform = () => {
    const transforms: any[] = [];

    if (direction === 'up') {
      transforms.push({ translateY: translate });
    } else if (direction === 'down') {
      transforms.push({
        translateY: translate.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }),
      });
    } else if (direction === 'left') {
      transforms.push({ translateY: 0, translateX: translate });
    } else if (direction === 'right') {
      transforms.push({
        translateY: 0,
        translateX: translate.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }),
      });
    }

    if (scale) {
      transforms.push({ scale: scaleAnim });
    }

    return transforms;
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: getTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
