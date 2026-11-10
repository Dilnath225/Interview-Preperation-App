/**
 * AI Mentor - Header Component
 * Top bar with optional avatar, title, notification bell, or back button
 * Responsive desktop top navbar & mobile clean header
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useNotifications } from '../context/NotificationContext';
import { NotificationModal, NotificationToastBanner } from './NotificationModal';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';

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
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount, openNotificationModal } = useNotifications();
  const { isDesktop, isTablet, isMobile, width } = useResponsive();
  // Only show desktop navigation row when NOT in a focused sub-screen (showBack is false) AND screen width >= 1100
  const showDesktopNav = !showBack && width >= 1100;
  const isLargeScreen = isDesktop || isTablet;

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

  const desktopNavItems = [
    { label: 'Dashboard', path: '/(tabs)', icon: 'grid-outline' },
    { label: 'Interviews', path: '/(tabs)/interviews', icon: 'videocam-outline' },
    { label: 'Companies', path: '/target-companies', icon: 'business-outline' },
    { label: 'Leadership', path: '/leadership-mcq', icon: 'ribbon-outline' },
    { label: 'Coding', path: '/coding-challenge', icon: 'code-slash-outline' },
    { label: 'Practice', path: '/(tabs)/practice', icon: 'mic-outline' },
    { label: 'AI Coach', path: '/(tabs)/ai-chat', icon: 'sparkles-outline' },
    { label: 'ATS Resume', path: '/resume-review', icon: 'document-text-outline' },
  ];

  return (
    <>
      <NotificationToastBanner />
      <NotificationModal />
      <View style={styles.headerWrapper}>
        <View style={styles.headerInner}>
          {/* Left Section: Back button or Logo/Avatar */}
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

            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
              style={styles.brandContainer}
            >
              <Text
                style={[styles.title, isMobile && styles.titleMobile]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {isLargeScreen && (
                <View style={styles.proBadge}>
                  <View style={styles.proDot} />
                  <Text style={styles.proBadgeText}>ENTERPRISE</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Desktop Navigation Links (shown only on wide desktop and NOT on focused sub-screens) */}
          {showDesktopNav && (
            <View style={styles.desktopNavRow}>
              {desktopNavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <TouchableOpacity
                    key={item.path}
                    onPress={() => router.push(item.path as any)}
                    style={[
                      styles.desktopNavLink,
                      isActive && styles.desktopNavLinkActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={15}
                      color={isActive ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.desktopNavText,
                        isActive && styles.desktopNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Right Section: Notification & User Pill */}
          <View style={styles.rightSection}>
            {showDesktopNav && user?.name && (
              <TouchableOpacity
                onPress={handleAvatar}
                style={styles.userProfilePill}
                activeOpacity={0.8}
              >
                <View style={styles.userStatusDot} />
                <Text style={styles.userProfileName} numberOfLines={1}>
                  {user.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}

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
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    backgroundColor: '#070C12',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2433',
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
    minWidth: 0,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  avatarBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
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
    letterSpacing: -0.3,
  },
  titleMobile: {
    fontSize: 16,
    maxWidth: 180,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  proDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  desktopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  desktopNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any, whiteSpace: 'nowrap' as any } : {}),
  },
  desktopNavLinkActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  desktopNavText: {
    fontSize: 11.5,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  desktopNavTextActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#1C293A',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  userStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  userProfileName: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    maxWidth: 90,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#1C293A',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
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
});
