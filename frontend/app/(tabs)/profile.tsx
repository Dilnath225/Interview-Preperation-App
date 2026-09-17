/**
 * AI Mentor - Profile Screen (Functionalized with Backend API)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { ProgressRing } from '../../src/components/ProgressRing';
import { SkillTag } from '../../src/components/SkillTag';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const skills = user?.skills
    ? user.skills.split(',').map((s: string) => s.trim())
    : ['React', 'TypeScript', 'Node.js', 'SQL'];

  const readinessScore = stats?.readinessScore || user?.readinessScore || 65;

  const handleSignOut = async () => {
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

  const getReadinessLabel = (score: number) => {
    if (score >= 90) return 'Elite Ready';
    if (score >= 80) return 'Ready for FAANG';
    if (score >= 70) return 'Almost There';
    if (score >= 60) return 'Building Up';
    return 'Getting Started';
  };

  const getLevel = (score: number) => {
    if (score >= 90) return 'Level 5';
    if (score >= 75) return 'Level 4';
    if (score >= 60) return 'Level 3';
    if (score >= 40) return 'Level 2';
    return 'Level 1';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Profile"
        showAvatar={false}
        rightAction={
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={44} color={Colors.primary} />
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{readinessScore}%</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.targetRole || 'Software Engineer'}</Text>
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalInterviews || 0}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.solvedChallenges || 0}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.uploadedResumes || 0}</Text>
              <Text style={styles.statLabel}>Resumes</Text>
            </View>
          </View>
        )}

        {/* Readiness Score Card */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessLeft}>
            <Text style={styles.readinessTitle}>MY READINESS SCORE</Text>
            <View style={styles.scoreNumberRow}>
              <Text style={styles.scoreNumberLarge}>{readinessScore}</Text>
              <Text style={styles.scoreNumberTotal}> / 100</Text>
            </View>
            <Text style={styles.readinessStatus}>{getReadinessLabel(readinessScore)}</Text>
          </View>

          <ProgressRing
            progress={readinessScore}
            size={74}
            strokeWidth={6}
            label={getLevel(readinessScore)}
          />
        </View>

        {/* Preferred Job Role */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderLabel}>PREFERRED JOB ROLE</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValue}>{user?.targetRole || 'Full Stack Developer'}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* My Skills */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderLabel}>MY SKILLS</Text>
          <View style={styles.skillsGrid}>
            {skills.map((skill: string, index: number) => (
              <SkillTag key={index} label={skill} selected={index < 3} />
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  settingsBtn: { padding: Spacing.sm },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  userSection: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#121C2B', borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  scoreBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.primary, paddingVertical: 3, paddingHorizontal: 8, borderRadius: BorderRadius.full, borderWidth: 2, borderColor: '#070C12' },
  scoreBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.background },
  userName: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 2 },
  userRole: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: Typography.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#1C293A' },
  readinessCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl },
  readinessLeft: { flex: 1 },
  readinessTitle: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs },
  scoreNumberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xs },
  scoreNumberLarge: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary },
  scoreNumberTotal: { fontSize: Typography.body, color: Colors.textMuted },
  readinessStatus: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.semiBold },
  sectionBlock: { marginBottom: Spacing.xl },
  sectionHeaderLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  dropdownSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 52, borderWidth: 1, borderColor: '#1C293A' },
  dropdownValue: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: Typography.medium },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.3)', borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, marginTop: Spacing.lg },
  signOutText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary },
});
