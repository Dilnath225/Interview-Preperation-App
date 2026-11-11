/**
 * AI Mentor - Portal / Role Selection Screen
 * Gateway between Candidate Learning Workspace and Enterprise Recruiter Portal
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { useResponsive } from '../src/hooks/useResponsive';

export default function PortalSelectScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ResponsiveContainer>
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="hardware-chip-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>AI MENTOR</Text>
            <Text style={styles.brandSubtitle}>ENTERPRISE CAREER & TALENT INTELLIGENCE</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.mainHeading}>Select Your Portal</Text>
            <Text style={styles.subHeading}>
              Choose how you want to use AI Mentor today.
            </Text>
          </View>

          {/* Dual Portals Container */}
          <View style={[styles.portalsContainer, isLargeScreen && styles.portalsRow]}>
            {/* Candidate Portal Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.portalCard, styles.candidateCard]}
              onPress={() => router.push('/sign-in')}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.badge, styles.candidateBadge]}>
                  <Ionicons name="school" size={14} color="#00F5D4" />
                  <Text style={styles.candidateBadgeText}>CANDIDATE & LEARNER</Text>
                </View>
                <View style={styles.arrowIcon}>
                  <Ionicons name="arrow-forward" size={18} color="#00F5D4" />
                </View>
              </View>

              <Text style={styles.cardTitle}>Looking to Prepare & Get Hired</Text>
              <Text style={styles.cardDesc}>
                Practice realistic AI mock interviews, solve technical coding challenges, optimize your resume for ATS, and earn verified enterprise mastery certificates.
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00F5D4" />
                  <Text style={styles.featureText}>Realistic AI Video Mock Interviews</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00F5D4" />
                  <Text style={styles.featureText}>Technical & Behavioral Drills</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00F5D4" />
                  <Text style={styles.featureText}>Official 100% Mastery Certification</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00F5D4" />
                  <Text style={styles.featureText}>Apply to Top Company Openings</Text>
                </View>
              </View>

              <View style={[styles.actionBtn, styles.candidateBtn]}>
                <Text style={styles.candidateBtnText}>Enter Candidate Portal</Text>
                <Ionicons name="arrow-forward" size={18} color="#070C12" />
              </View>
            </TouchableOpacity>

            {/* Recruiter / Company Portal Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.portalCard, styles.recruiterCard]}
              onPress={() => router.push('/company-auth')}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.badge, styles.recruiterBadge]}>
                  <Ionicons name="business" size={14} color="#38BDF8" />
                  <Text style={styles.recruiterBadgeText}>ENTERPRISE HIRING</Text>
                </View>
                <View style={[styles.arrowIcon, { borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
                  <Ionicons name="arrow-forward" size={18} color="#38BDF8" />
                </View>
              </View>

              <Text style={styles.cardTitle}>Looking to Hire Elite Talent</Text>
              <Text style={styles.cardDesc}>
                Post open tech jobs, review candidate applications with attached CVs, browse pre-vetted candidates with readiness scores, and verify digital credentials.
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#38BDF8" />
                  <Text style={styles.featureText}>Publish & Manage Job Openings</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#38BDF8" />
                  <Text style={styles.featureText}>Review Candidate Applications & CVs</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#38BDF8" />
                  <Text style={styles.featureText}>Pre-Vetted Talent Pool (Top 5%)</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#38BDF8" />
                  <Text style={styles.featureText}>Instant Credential ID Verification</Text>
                </View>
              </View>

              <View style={[styles.actionBtn, styles.recruiterBtn]}>
                <Text style={styles.recruiterBtnText}>Enter Recruiter Portal</Text>
                <Ionicons name="arrow-forward" size={18} color="#070C12" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            AI MENTOR SECURE ENTERPRISE PLATFORM • 2026
          </Text>
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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 22,
  },
  portalsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  portalsRow: {
    flexDirection: 'row',
  },
  portalCard: {
    flex: 1,
    borderRadius: 18,
    padding: Spacing.xl,
    borderWidth: 1.5,
  },
  candidateCard: {
    backgroundColor: '#0E1724',
    borderColor: 'rgba(0, 245, 212, 0.35)',
  },
  recruiterCard: {
    backgroundColor: '#0B1526',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  candidateBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  candidateBadgeText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recruiterBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  recruiterBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 28,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 10,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  candidateBtn: {
    backgroundColor: '#00F5D4',
  },
  candidateBtnText: {
    color: '#070C12',
    fontSize: 14,
    fontWeight: '800',
  },
  recruiterBtn: {
    backgroundColor: '#38BDF8',
  },
  recruiterBtnText: {
    color: '#070C12',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: Spacing.md,
  },
});

