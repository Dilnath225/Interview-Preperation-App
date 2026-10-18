/**
 * AI Mentor - Interview Categories Screen
 * Restored original layout with dedicated Target Top Companies hub card
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { CategoryCard } from '../../src/components/CategoryCard';

export default function InterviewsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Interview Categories" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.headingSection}>
          <Text style={styles.mainTitle}>Select focus.</Text>
          <Text style={styles.subtitle}>
            Tailor your mentor sessions by choosing a specific career milestone.
          </Text>
        </View>

        {/* Target Top Companies (Featured Card - opens dedicated page) */}
        <CategoryCard
          title="Target Top Companies"
          description="Prepare with calibrated benchmarks for Sri Lankan tech leaders (WSO2, IFS, Sysco LABS, LSEG) & Global giants (Google, Meta, Amazon). Includes live job openings & tech stacks."
          iconName="business-outline"
          iconColor="#00F5D4"
          iconBgColor="rgba(0, 245, 212, 0.12)"
          badge="GLOBAL & LK"
          onPress={() => router.push('/target-companies')}
        />

        {/* Leadership Questions (Full Width - 40 MCQs) */}
        <CategoryCard
          title="Leadership Questions"
          description="40-question scenario papers tiered from Internship to Executive level with instant score review."
          iconName="ribbon-outline"
          iconColor="#00F5D4"
          iconBgColor="rgba(0, 245, 212, 0.12)"
          badge="40 MCQs"
          onPress={() => router.push('/leadership-mcq')}
        />

        {/* 2-Column Split: Technical & Behavioral */}
        <View style={styles.splitRow}>
          <CategoryCard
            title="Technical"
            description="Code, system design, and theory."
            iconName="code-slash-outline"
            iconColor="#00F5D4"
            iconBgColor="rgba(0, 245, 212, 0.12)"
            fullWidth={false}
            onPress={() => router.push('/coding-challenge')}
          />

          <CategoryCard
            title="Behavioral"
            description="STAR method and scenario logic."
            iconName="bulb-outline"
            iconColor="#FFB300"
            iconBgColor="rgba(255, 179, 0, 0.12)"
            fullWidth={false}
            onPress={() => router.push('/mock-interview')}
          />
        </View>

        {/* Final Round (ELITE) */}
        <CategoryCard
          title="Final Round"
          description="Executive alignment, high-stakes decision making, and culture assessment."
          iconName="shield-checkmark-outline"
          iconColor="#00F5D4"
          iconBgColor="rgba(0, 245, 212, 0.12)"
          badge="ELITE"
          onPress={() => router.push('/mock-interview')}
        />
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
  headingSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
});
