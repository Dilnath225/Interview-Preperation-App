/**
 * AI Mentor - Notification Center Modal & In-App Toast
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useNotifications, AppNotification } from '../context/NotificationContext';

export const NotificationModal: React.FC = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isModalOpen,
    closeNotificationModal,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'interview':
        return { name: 'videocam-outline' as const, color: Colors.primary, bg: 'rgba(0, 245, 212, 0.12)' };
      case 'coding':
        return { name: 'code-slash-outline' as const, color: '#00E676', bg: 'rgba(0, 230, 118, 0.12)' };
      case 'leadership':
        return { name: 'ribbon-outline' as const, color: '#FFB300', bg: 'rgba(255, 179, 0, 0.12)' };
      case 'resume':
        return { name: 'document-text-outline' as const, color: '#7C4DFF', bg: 'rgba(124, 77, 255, 0.12)' };
      case 'streak':
        return { name: 'flame-outline' as const, color: '#FF7043', bg: 'rgba(255, 112, 67, 0.12)' };
      default:
        return { name: 'notifications-outline' as const, color: Colors.primary, bg: 'rgba(0, 245, 212, 0.12)' };
    }
  };

  const handleNotificationPress = (notif: AppNotification) => {
    markAsRead(notif.id);
    closeNotificationModal();
    if (notif.route) {
      router.push(notif.route as any);
    }
  };

  return (
    <Modal visible={isModalOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={closeNotificationModal}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <View style={styles.actionsBar}>
              <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
                <Text style={styles.actionText}>Mark all as read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                <Text style={[styles.actionText, { color: Colors.textMuted }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  Notifications about your interviews, coding challenges, and daily preparation streaks will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((notif) => {
                const iconCfg = getIconForType(notif.type);
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.itemCard, !notif.read && styles.itemCardUnread]}
                    onPress={() => handleNotificationPress(notif)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconBox, { backgroundColor: iconCfg.bg }]}>
                      <Ionicons name={iconCfg.name} size={20} color={iconCfg.color} />
                    </View>

                    <View style={styles.itemTextContent}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemTitle, !notif.read && styles.itemTitleUnread]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <Text style={styles.itemTime}>{notif.timestamp}</Text>
                      </View>
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {notif.message}
                      </Text>
                    </View>

                    {!notif.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const NotificationToastBanner: React.FC = () => {
  const router = useRouter();
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  if (!activeToast) return null;

  return (
    <View style={styles.toastContainer}>
      <TouchableOpacity
        style={styles.toastCard}
        activeOpacity={0.9}
        onPress={() => {
          markAsRead(activeToast.id);
          dismissToast();
          if (activeToast.route) {
            router.push(activeToast.route as any);
          }
        }}
      >
        <View style={styles.toastLeft}>
          <View style={styles.toastIconBox}>
            <Ionicons name="notifications" size={18} color="#070C12" />
          </View>
          <View style={styles.toastTextContent}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {activeToast.title}
            </Text>
            <Text style={styles.toastMessage} numberOfLines={2}>
              {activeToast.message}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={dismissToast} style={styles.toastCloseBtn}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1722',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  unreadCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#070C12',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: Spacing.md,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1018',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  itemCardUnread: {
    backgroundColor: 'rgba(0, 245, 212, 0.04)',
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.lg,
  },

  // Toast Banner
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toastMessage: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  toastCloseBtn: {
    padding: 6,
  },
});
