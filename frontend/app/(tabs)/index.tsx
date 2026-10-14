/**
 * AI Mentor - Home Dashboard Screen (Functionalized with Backend API)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { ProgressRing } from '../../src/components/ProgressRing';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
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

  const readinessScore = stats?.readinessScore || user?.readinessScore || 65;
  const userName = user?.name || 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSub}>Welcome back,</Text>
          <Text style={styles.userName}>Hello, {userName}!</Text>
        </View>

        {/* Quick Action Cards (2 Columns) */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/mock-interview')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
              <Ionicons name="videocam-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionCardText}>AI Video Call{'\n'}Interview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/resume-review')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
              <Ionicons name="document-text-outline" size={24} color="#00E676" />
            </View>
            <Text style={styles.actionCardText}>Resume{'\n'}Review</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressTitle}>Interview Readiness</Text>
            <Text style={styles.progressDescription}>
              {stats
                ? `${stats.completedInterviews || 0} interviews done, ${stats.solvedChallenges || 0} challenges solved.`
                : 'Loading your progress...'}
            </Text>

            <View style={styles.badgesRow}>
              {readinessScore >= 80 && (
                <View style={styles.pillBadgeMuted}>
                  <Text style={styles.pillBadgeMutedText}>TOP 5%</Text>
                </View>
              )}
              <View style={styles.pillBadgeSuccess}>
                <Text style={styles.pillBadgeSuccessText}>
                  {readinessScore >= 80 ? 'READY' : 'IMPROVING'}
                </Text>
              </View>
            </View>
          </View>

          <ProgressRing progress={readinessScore} size={78} strokeWidth={6} />
        </View>

        {/* Recommended Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recommended</Text>
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
              <Ionicons name="code-slash-outline" size={14} color={Colors.info} />
              <Text style={[styles.drillTypeText, { color: Colors.info }]}>CODING</Text>
            </View>
            <Text style={styles.drillTitle} numberOfLines={2}>
              "Two Sum - HashMap Approach"
            </Text>
            <View style={styles.drillFooterRow}>
              <Text style={styles.drillDuration}>8m practice</Text>
              <Ionicons name="play-circle" size={26} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Interview History */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Recent Sessions
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        ) : recentInterviews.length > 0 ? (
          recentInterviews.slice(0, 3).map((session: any) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
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
          ))
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
              <Text style={styles.sessionSubtitle}>AI Coach is ready for you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  welcomeSection: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
  welcomeSub: { fontSize: Typography.body, color: Colors.textSecondary },
  userName: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 2 },
  quickActionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionCard: { flex: 1, backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', minHeight: 120, justifyContent: 'space-between' },
  actionIconBox: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  actionCardText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary, lineHeight: 20 },
  progressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl },
  progressLeft: { flex: 1, paddingRight: Spacing.md },
  progressTitle: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  progressDescription: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm },
  pillBadgeMuted: { backgroundColor: '#1A2636', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  pillBadgeMutedText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textPrimary },
  pillBadgeSuccess: { backgroundColor: 'rgba(0, 230, 118, 0.15)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  pillBadgeSuccessText: { fontSize: 10, fontWeight: Typography.bold, color: '#00E676' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary },
  viewAllText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, fontWeight: Typography.medium },
  recommendedRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  drillCard: { flex: 1, backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', justifyContent: 'space-between', minHeight: 140 },
  drillTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs },
  drillTypeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 0.5 },
  drillTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary, lineHeight: 18 },
  drillFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  drillDuration: { fontSize: Typography.caption, color: Colors.textSecondary },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', marginTop: Spacing.md },
  dateBox: { backgroundColor: '#1A2636', borderRadius: BorderRadius.sm, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginRight: Spacing.md },
  dateMonth: { fontSize: 9, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },
  dateDay: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionSubtitle: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
