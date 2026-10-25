/**
 * AI Mentor - Custom TabBar Component
 * Bottom navigation with 5 tabs matching design: HOME, INTERVIEWS, PRACTICE, AI CHAT, PROFILE
 * Responsive floating dock on desktop / tablet web, and standard bottom bar on mobile
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

export interface TabBarProps {
  state: any;
  descriptors: any;
  navigation?: any;
  insets?: any;
}

export const CustomTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const isFloating = !isMobile;

  const getTabIcon = (
    routeName: string,
    isFocused: boolean
  ): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'index':
        return isFocused ? 'grid' : 'grid-outline';
      case 'interviews':
        return isFocused ? 'videocam' : 'videocam-outline';
      case 'practice':
        return isFocused ? 'mic' : 'mic-outline';
      case 'ai-chat':
        return isFocused ? 'sparkles' : 'sparkles-outline';
      case 'profile':
        return isFocused ? 'person' : 'person-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return 'HOME';
      case 'interviews':
        return 'INTERVIEWS';
      case 'practice':
        return 'PRACTICE';
      case 'ai-chat':
        return 'AI CHAT';
      case 'profile':
        return 'PROFILE';
      default:
        return routeName.toUpperCase();
    }
  };

  return (
    <View style={[styles.outerWrapper, isFloating && styles.floatingOuter]}>
      <View style={[styles.container, isFloating && styles.floatingContainer]}>
        {state.routes.map((route: any, index: number) => {
          const options = descriptors[route.key]?.options || {};
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation?.emit ? navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            }) : null;

            if (!isFocused && (!event || !event.defaultPrevented)) {
              if (navigation?.navigate) {
                navigation.navigate(route.name);
              } else {
                const target = route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`;
                router.push(target as any);
              }
            }
          };

          const iconName = getTabIcon(route.name, isFocused);
          const label = getTabLabel(route.name);
          const activeColor = Colors.primary;
          const inactiveColor = Colors.tabInactive;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={[styles.tabButton, isFloating && styles.floatingTabButton]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={isFloating ? 20 : 22}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? activeColor : inactiveColor },
                  isFocused && styles.tabLabelActive,
                ]}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: '#0D1117',
    width: '100%',
  },
  floatingOuter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 999,
    ...(Platform.OS === 'web' ? { pointerEvents: 'box-none' as any } : {}),
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    height: 68,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  floatingContainer: {
    width: '92%',
    maxWidth: 580,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E2A3A',
    backgroundColor: 'rgba(13, 17, 23, 0.96)',
    paddingTop: 8,
    paddingBottom: 8,
    height: 62,
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  floatingTabButton: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
});
