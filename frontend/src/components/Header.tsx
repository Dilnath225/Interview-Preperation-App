/**
 * AI Mentor - Header Component
 * Top bar with optional avatar, title, notification bell, or back button
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useNotifications } from '../context/NotificationContext';
import { NotificationModal, NotificationToastBanner } from './NotificationModal';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  showNotification?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'AI Mentor',
  showBack = false,
  showAvatar = true,
  showNotification = true,
  rightAction,
  onBackPress,
  onAvatarPress,
  onNotificationPress,
}) => {
  const router = useRouter();
  const { unreadCount, openNotificationModal } = useNotifications();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleAvatar = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const handleNotification = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      openNotificationModal();
    }
  };

  return (
    <>
      <NotificationToastBanner />
      <NotificationModal />
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : showAvatar ? (
            <TouchableOpacity
              onPress={handleAvatar}
              activeOpacity={0.8}
              style={styles.avatarContainer}
            >
              <View style={styles.avatarBorder}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : showNotification ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotification}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.textPrimary}
              />
              {unreadCount > 0 && (
                <View style={styles.notificationDotBadge}>
                  <Text style={styles.notificationBadgeNum}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDotBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeNum: {
    fontSize: 9,
    fontWeight: '800',
    color: '#070C12',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
