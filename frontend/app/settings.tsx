/**
 * AI Mentor - Settings Screen (Connected with AuthContext)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { useAuth } from '../src/context/AuthContext';
import { API_BASE_URL } from '../src/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true;
      if (confirmed) {
        await logout();
        router.replace('/sign-in');
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/sign-in');
        },
      },
    ]);
  };

  const getAvatarSource = () => {
    const raw = user?.avatarUrl;
    if (!raw) return null;
    if (raw.startsWith('http')) return { uri: raw };
    const base = API_BASE_URL.replace(/\/api$/, '');
    return { uri: `${base}${raw}` };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" showBack showAvatar={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBorder}>
            {getAvatarSource() ? (
              <Image source={getAvatarSource()!} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={24} color={Colors.primary} />
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Candidate'}</Text>
            <Text style={styles.userRole}>{user?.targetRole || 'Full Stack Developer'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Section: Appearance */}
        <Text style={styles.sectionHeader}>Appearance</Text>

        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="moon-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingLabelText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#2A3648', true: Colors.primary }}
              thumbColor={Colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="globe-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingLabelText}>Language</Text>
            </View>
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValueText}>English (US)</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Security */}
        <Text style={styles.sectionHeader}>Security</Text>

        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingLabelText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingLabelText}>Manage Candidate Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#162232',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  settingsGroup: {
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingLabelText: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A2636',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  logoutText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
});
