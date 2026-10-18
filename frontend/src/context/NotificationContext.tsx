/**
 * AI Mentor - Notification Context & In-App Alerts Engine
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'interview' | 'coding' | 'leadership' | 'resume' | 'system' | 'streak';
  timestamp: string;
  read: boolean;
  route?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isModalOpen: boolean;
  activeToast: AppNotification | null;
  addNotification: (
    title: string,
    message: string,
    type?: AppNotification['type'],
    route?: string
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
  dismissToast: () => void;
}

const STORAGE_KEY = 'ai_mentor_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Welcome to AI Mentor 🚀',
    message: 'Prepare with AI Mock Interviews, Leadership MCQs, and Coding Assessments.',
    type: 'system',
    timestamp: 'Just now',
    read: false,
    route: '/(tabs)',
  },
  {
    id: 'notif-2',
    title: '40-Question Leadership Papers Ready',
    message: 'Practice 5 distinct enterprise situational papers tiered from Internship to Executive level.',
    type: 'leadership',
    timestamp: '10m ago',
    read: false,
    route: '/leadership-mcq',
  },
  {
    id: 'notif-3',
    title: 'Daily Practice Reminder',
    message: 'Complete at least one interview drill or coding challenge to boost your Readiness Score.',
    type: 'streak',
    timestamp: '1h ago',
    read: false,
    route: '/(tabs)/practice',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    loadSavedNotifications();
  }, []);

  const loadSavedNotifications = async () => {
    try {
      let saved: string | null = null;
      if (Platform.OS === 'web') {
        saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      } else {
        saved = await SecureStore.getItemAsync(STORAGE_KEY);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load notifications from storage:', e);
    }
  };

  const persistNotifications = async (list: AppNotification[]) => {
    try {
      const data = JSON.stringify(list);
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, data);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY, data);
      }
    } catch (e) {
      console.warn('Failed to persist notifications:', e);
    }
  };

  const addNotification = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'system',
    route?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false,
      route,
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      persistNotifications(updated);
      return updated;
    });

    // Trigger in-app toast
    setActiveToast(newNotif);
    setTimeout(() => {
      setActiveToast((current) => (current?.id === newNotif.id ? null : current));
    }, 4500);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    persistNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isModalOpen,
        activeToast,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        openNotificationModal: () => setIsModalOpen(true),
        closeNotificationModal: () => setIsModalOpen(false),
        dismissToast: () => setActiveToast(null),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
