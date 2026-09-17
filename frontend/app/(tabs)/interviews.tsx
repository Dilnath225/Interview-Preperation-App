/**
 * AI Mentor - Interview Categories Screen
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

        {/* HR Interview (Full Width) */}
        <CategoryCard
          title="HR Interview"
          description="Master culture fit, compensation talks, and soft-skill storytelling."
          iconName="people-outline"
          iconColor="#00F5D4"
          iconBgColor="rgba(0, 245, 212, 0.12)"
          onPress={() => router.push('/mock-interview')}
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

        {/* Leadership Questions */}
        <CategoryCard
          title="Leadership Questions"
          description="Strategy, team conflict, and visionary growth."
          iconName="ribbon-outline"
          iconColor="#00F5D4"
          iconBgColor="rgba(0, 245, 212, 0.12)"
          onPress={() => router.push('/mock-interview')}
        />

        {/* Final Round (ELITE) */}
        <CategoryCard
          title="Final Round"
          description="Executive alignment and high-stakes decision making."
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
