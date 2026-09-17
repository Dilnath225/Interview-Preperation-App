/**
 * AI Mentor - Practice Hub Screen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';

export default function PracticeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Practice Drills" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Active Drill Banner */}
        <View style={styles.speechDrillCard}>
          <View style={styles.speechHeader}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>PRACTICE MODE</Text>
            </View>
            <Ionicons name="mic" size={20} color={Colors.primary} />
          </View>

          <Text style={styles.drillMainTitle}>Analyze Your Speech</Text>
          <Text style={styles.drillSubtitle}>
            Focus on clarity and pausing between sentences. AI will monitor your fluency in real-time.
          </Text>

          {/* Glowing Center Record Visual */}
          <View style={styles.recordCircleContainer}>
            <View style={styles.recordOuterGlow}>
              <TouchableOpacity
                style={styles.recordInnerBtn}
                onPress={() => router.push('/mock-interview')}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={28} color={Colors.primary} />
                <Text style={styles.recordBtnText}>RECORDING</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>PRONUNCIATION ACCURACY</Text>
            <Text style={styles.scoreValue}>92%</Text>
          </View>
        </View>

        {/* Practice Modes */}
        <Text style={styles.sectionHeading}>Practice Modes</Text>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push('/coding-challenge')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
            <Ionicons name="code-working-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>Coding Challenges</Text>
            <Text style={styles.modeSubtitle}>Data structures, algorithms & syntax</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push('/mock-interview')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 179, 0, 0.12)' }]}>
            <Ionicons name="chatbubbles-outline" size={24} color={Colors.warning} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>Behavioral Questions</Text>
            <Text style={styles.modeSubtitle}>STAR method storytelling drills</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push('/resume-review')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
            <Ionicons name="document-text-outline" size={24} color="#00E676" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>Resume Diagnostic</Text>
            <Text style={styles.modeSubtitle}>ATS optimization and keyword gap analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
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
    paddingBottom: Spacing.xxxl,
  },
  speechDrillCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  speechHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tagBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  drillMainTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  drillSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  recordCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  recordOuterGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInnerBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#142030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  recordBtnText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A2738',
    paddingTop: Spacing.md,
    marginTop: Spacing.lg,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  sectionHeading: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
