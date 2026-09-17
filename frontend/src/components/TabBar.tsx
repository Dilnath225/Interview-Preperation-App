/**
 * AI Mentor - Custom TabBar Component
 * Bottom navigation with 5 tabs matching design: HOME, INTERVIEWS, PRACTICE, AI CHAT, PROFILE
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

export interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

export const CustomTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
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
    <View style={styles.container}>
      {state.routes.map((route: any, index: number) => {
        const options = descriptors[route.key]?.options || {};
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
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
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? activeColor : inactiveColor}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? activeColor : inactiveColor },
              ]}
            >
              {label}
            </Text>
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
});
