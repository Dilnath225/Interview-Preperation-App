/**
 * AI Mentor - Home Dashboard Screen
 * Enterprise responsive web & mobile dashboard
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { ProgressRing } from '../../src/components/ProgressRing';
import { ResponsiveContainer } from '../../src/components/ResponsiveContainer';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  const [stats, setStats] = useState<any>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setRecentInterviews(res.data.recentInterviews || []);
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const readinessScore =
    stats?.readinessScore !== undefined && stats?.readinessScore !== null
      ? stats.readinessScore
      : user?.readinessScore !== undefined && user?.readinessScore !== null
      ? user.readinessScore
      : 0;

  const userName = user?.name || 'User';

  const getReadinessInfo = (score: number) => {
    if (score === 0) {
      return {
        badge: 'NOT STARTED',
        badgeColor: '#94A3B8',
        badgeBg: 'rgba(148, 163, 184, 0.15)',
        description: 'Complete your first mock interview, coding challenge, or leadership MCQ to calculate your score.',
      };
    }
    if (score >= 90) {
      return {
        badge: 'TOP 5% ENTERPRISE',
        badgeColor: Colors.primary,
        badgeBg: 'rgba(0, 245, 212, 0.15)',
        description: stats?.readinessVerdict || 'Exceptional readiness! You are fully prepared for senior & tier-1 roles.',
      };
    }
    if (score >= 75) {
      return {
        badge: 'JOB READY',
        badgeColor: '#00E676',
        badgeBg: 'rgba(0, 230, 118, 0.15)',
        description: stats?.readinessVerdict || 'Strong performance across technical and behavioral interview benchmarks.',
      };
    }
    if (score >= 50) {
      return {
        badge: 'STEADY PROGRESS',
        badgeColor: '#FFB300',
        badgeBg: 'rgba(255, 179, 0, 0.15)',
        description: stats?.readinessVerdict || 'Making solid progress. Drill more coding problems and behavioral scenarios.',
      };
    }
    return {
      badge: 'NEEDS PRACTICE',
      badgeColor: '#FF5252',
      badgeBg: 'rgba(255, 82, 82, 0.15)',
      description: stats?.readinessVerdict || 'Keep practicing questions and technical tasks to raise your readiness.',
    };
  };

  const readiness = getReadinessInfo(readinessScore);

  const quickActions = [
    {
      title: 'AI Mock Interview',
      subtitle: 'Speech & STAR scenario',
      icon: 'videocam-outline' as const,
      color: Colors.primary,
      bgColor: 'rgba(0, 245, 212, 0.12)',
      route: '/mock-interview',
    },
    {
      title: 'Leadership 40 MCQs',
      subtitle: 'Calibrated L1-L4 papers',
      icon: 'ribbon-outline' as const,
      color: '#FFB300',
      bgColor: 'rgba(255, 179, 0, 0.12)',
      route: '/leadership-mcq',
    },
    {
      title: 'Coding Arena',
      subtitle: 'Multi-language DSA',
      icon: 'code-slash-outline' as const,
      color: '#00E676',
      bgColor: 'rgba(0, 230, 118, 0.12)',
      route: '/coding-challenge',
    },
    {
      title: 'ATS Resume Review',
      subtitle: '4-dimension diagnostic',
      icon: 'document-text-outline' as const,
      color: '#7C4DFF',
      bgColor: 'rgba(124, 77, 255, 0.12)',
      route: '/resume-review',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* Welcome Banner */}
          <View style={styles.welcomeSection}>
            <View>
              <Text style={styles.welcomeSub}>Career Accelerator Platform</Text>
              <Text style={styles.userName}>Hello, {userName}!</Text>
            </View>
            {isLargeScreen && (
              <TouchableOpacity
                style={styles.heroTargetButton}
                onPress={() => router.push('/target-companies')}
                activeOpacity={0.8}
              >
                <Ionicons name="business" size={16} color={Colors.primary} />
                <Text style={styles.heroTargetButtonText}>Target Top Companies</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Action Cards (4 items - Responsive Grid) */}
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.actionCard,
                  isLargeScreen && styles.actionCardDesktop,
                ]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardTop}>
                  <View style={[styles.actionIconBox, { backgroundColor: action.bgColor }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
                </View>

                <View>
                  <Text style={styles.actionCardText}>{action.title}</Text>
                  <Text style={styles.actionCardSub}>{action.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dual Column Layout on Desktop: Left Readiness / Right Recommended */}
          <View style={isDesktop ? styles.desktopTwoColRow : styles.mobileStack}>
            {/* Readiness Card */}
            <View style={[styles.progressCard, isDesktop && styles.progressCardDesktopCol]}>
              <View style={styles.progressLeft}>
                <View style={styles.cardHeaderSmall}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
                  <Text style={styles.cardHeaderSmallText}>EXECUTIVE READINESS</Text>
                </View>

                <Text style={styles.progressTitle}>Interview Readiness</Text>
                <Text style={styles.progressDescription}>
                  {readiness.description}
                </Text>

                <View style={styles.badgesRow}>
                  <View style={[styles.pillBadgeSuccess, { backgroundColor: readiness.badgeBg }]}>
                    <Text style={[styles.pillBadgeSuccessText, { color: readiness.badgeColor }]}>
                      {readiness.badge}
                    </Text>
                  </View>
                  {stats?.completedInterviews > 0 && (
                    <View style={styles.pillBadgeMuted}>
                      <Text style={styles.pillBadgeMutedText}>
                        {stats.completedInterviews} SESSIONS COMPLETED
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.progressRingWrapper}>
                <ProgressRing progress={readinessScore} size={88} strokeWidth={7} />
              </View>
            </View>

            {/* Recommended Section */}
            <View style={[styles.recommendedContainer, isDesktop && styles.recommendedDesktopCol]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recommended Drills</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/interviews')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recommendedRow}>
                <TouchableOpacity
                  style={styles.drillCard}
                  onPress={() => router.push('/mock-interview')}
                  activeOpacity={0.8}
                >
                  <View style={styles.drillTypeRow}>
                    <Ionicons name="flash-outline" size={14} color={Colors.primary} />
                    <Text style={styles.drillTypeText}>BEHAVIORAL</Text>
                  </View>
                  <Text style={styles.drillTitle} numberOfLines={2}>
                    "Tell me about a time you failed..."
                  </Text>
                  <View style={styles.drillFooterRow}>
                    <Text style={styles.drillDuration}>12m practice</Text>
                    <Ionicons name="play-circle" size={26} color={Colors.textPrimary} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drillCard}
                  onPress={() => router.push('/coding-challenge')}
                  activeOpacity={0.8}
                >
                  <View style={styles.drillTypeRow}>
                    <Ionicons name="code-slash-outline" size={14} color="#00E676" />
                    <Text style={[styles.drillTypeText, { color: '#00E676' }]}>CODING</Text>
                  </View>
                  <Text style={styles.drillTitle} numberOfLines={2}>
                    "Two Sum - Optimal Map Pattern"
                  </Text>
                  <View style={styles.drillFooterRow}>
                    <Text style={styles.drillDuration}>15m sandbox</Text>
                    <Ionicons name="play-circle" size={26} color={Colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recent Sessions */}
          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.viewAllText}>Full History</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : recentInterviews.length > 0 ? (
            <View style={isLargeScreen ? styles.recentSessionsGrid : undefined}>
              {recentInterviews.slice(0, 4).map((session: any) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, isLargeScreen && styles.sessionCardDesktop]}
                  onPress={() => router.push('/mock-interview')}
                  activeOpacity={0.8}
                >
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>
                      {new Date(session.createdAt).toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={styles.dateDay}>
                      {new Date(session.createdAt).getDate()}
                    </Text>
                  </View>

                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.type} Interview</Text>
                    <Text style={styles.sessionSubtitle}>
                      {session.role} • Score: {session.overallScore || 'In Progress'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => router.push('/mock-interview')}
              activeOpacity={0.8}
            >
              <View style={styles.dateBox}>
                <Ionicons name="add" size={20} color={Colors.primary} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Start Your First Interview</Text>
                <Text style={styles.sessionSubtitle}>AI Coach is calibrated and ready</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  scrollContent: { paddingBottom: 100 },
  welcomeSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  welcomeSub: { fontSize: 13, color: Colors.primary, fontWeight: Typography.bold, letterSpacing: 0.8 },
  userName: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 4 },
  heroTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  heroTargetButtonText: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    minHeight: 130,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  actionCardDesktop: {
    flex: 1,
    minWidth: 220,
    maxWidth: '25%',
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  desktopTwoColRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'stretch',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  mobileStack: {
    marginBottom: Spacing.xl,
    width: '100%',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.lg,
  },
  progressCardDesktopCol: {
    flex: 1.15,
    marginBottom: 0,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  cardHeaderSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  progressLeft: { flex: 1, paddingRight: Spacing.md },
  progressTitle: { fontSize: 20, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  progressDescription: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  progressRingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  pillBadgeMuted: { backgroundColor: '#1A2636', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  pillBadgeMutedText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textPrimary },
  pillBadgeSuccess: { backgroundColor: 'rgba(0, 230, 118, 0.15)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  pillBadgeSuccessText: { fontSize: 10, fontWeight: Typography.bold, color: '#00E676' },
  recommendedContainer: {
    width: '100%',
  },
  recommendedDesktopCol: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary },
  viewAllText: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.medium },
  recommendedRow: { flexDirection: 'row', gap: Spacing.md },
  drillCard: {
    flex: 1,
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C293A',
    justifyContent: 'space-between',
    minHeight: 140,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  drillTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs },
  drillTypeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 0.5 },
  drillTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary, lineHeight: 18 },
  drillFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  drillDuration: { fontSize: Typography.caption, color: Colors.textSecondary },
  recentSessionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginTop: Spacing.sm,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  sessionCardDesktop: {
    width: '48.5%',
    marginTop: 0,
  },
  dateBox: { backgroundColor: '#1A2636', borderRadius: BorderRadius.sm, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginRight: Spacing.md },
  dateMonth: { fontSize: 9, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },
  dateDay: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionSubtitle: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
