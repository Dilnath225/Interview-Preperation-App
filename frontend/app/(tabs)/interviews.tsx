/**
 * AI Mentor - Interview Categories Screen
 * Restored original layout with dedicated Target Top Companies hub card
 * Fully responsive on Web, Tablet, and Mobile
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { CategoryCard } from '../../src/components/CategoryCard';
import { ResponsiveContainer } from '../../src/components/ResponsiveContainer';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function InterviewsScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Interview Categories" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer>
          {/* Title Section */}
          <View style={styles.headingSection}>
            <Text style={styles.mainTitle}>Select focus.</Text>
            <Text style={styles.subtitle}>
              Tailor your mentor sessions by choosing a specific career milestone.
            </Text>
          </View>

          {/* Target Top Companies (Featured Hero Card) */}
          <CategoryCard
            title="Target Top Companies"
            description="Prepare with calibrated benchmarks for Sri Lankan tech leaders (WSO2, IFS, Sysco LABS, LSEG) & Global giants (Google, Meta, Amazon). Includes live job openings & tech stacks."
            iconName="business-outline"
            iconColor="#00F5D4"
            iconBgColor="rgba(0, 245, 212, 0.12)"
            badge="GLOBAL & LK"
            style={isLargeScreen ? styles.heroCardDesktop : undefined}
            onPress={() => router.push('/target-companies')}
          />

          {/* Grid container for desktop, stacked for mobile */}
          <View style={isLargeScreen ? styles.desktopGrid : undefined}>
            {/* Leadership Questions (40 MCQs) */}
            <CategoryCard
              title="Leadership Questions"
              description="40-question scenario papers tiered from Internship to Executive level with instant score review."
              iconName="ribbon-outline"
              iconColor="#00F5D4"
              iconBgColor="rgba(0, 245, 212, 0.12)"
              badge="40 MCQs"
              style={isLargeScreen ? styles.gridCardDesktop : undefined}
              onPress={() => router.push('/leadership-mcq')}
            />

            {/* Technical */}
            <CategoryCard
              title="Technical"
              description="Code sandbox, system design patterns, and core algorithmic theory."
              iconName="code-slash-outline"
              iconColor="#00F5D4"
              iconBgColor="rgba(0, 245, 212, 0.12)"
              fullWidth={!isLargeScreen}
              style={isLargeScreen ? styles.gridCardDesktop : undefined}
              onPress={() => router.push('/coding-challenge')}
            />

            {/* Behavioral */}
            <CategoryCard
              title="Behavioral"
              description="STAR method, conflict resolution, and executive scenario logic."
              iconName="bulb-outline"
              iconColor="#FFB300"
              iconBgColor="rgba(255, 179, 0, 0.12)"
              fullWidth={!isLargeScreen}
              style={isLargeScreen ? styles.gridCardDesktop : undefined}
              onPress={() => router.push('/mock-interview')}
            />

            {/* Final Round (ELITE) */}
            <CategoryCard
              title="Final Round"
              description="Executive alignment, high-stakes decision making, and culture assessment."
              iconName="shield-checkmark-outline"
              iconColor="#00F5D4"
              iconBgColor="rgba(0, 245, 212, 0.12)"
              badge="ELITE"
              style={isLargeScreen ? styles.gridCardDesktop : undefined}
              onPress={() => router.push('/mock-interview')}
            />
          </View>
        </ResponsiveContainer>
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
    paddingBottom: 110,
  },
  headingSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    width: '100%',
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
  heroCardDesktop: {
    marginBottom: Spacing.lg,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    backgroundColor: '#101B2B',
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  gridCardDesktop: {
    width: '48.8%',
    marginBottom: 0,
    minHeight: 150,
  },
});
