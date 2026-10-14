/**
 * AI Mentor - Enterprise-Grade Resume Review Screen
 * Displays full ATS diagnostic with section scores, executive summary,
 * keyword analysis, red flags, bullet optimizations, and action plan.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { ProgressRing } from '../src/components/ProgressRing';
import { Button } from '../src/components/Button';
import { api } from '../src/services/api';

import * as DocumentPicker from 'expo-document-picker';

export default function ResumeReviewScreen() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getResumeHistory();
      if (res.success && res.data && res.data.resumes && res.data.resumes.length > 0) {
        const resumes = res.data.resumes;
        setHistory(resumes);
        const latest = resumes[0];

        // Parse enterprise data from strengths JSON if stored
        let enterpriseData = null;
        try {
          const strengthsParsed = JSON.parse(latest.strengths || '[]');
          if (strengthsParsed && strengthsParsed.enterprise) {
            enterpriseData = strengthsParsed.enterprise;
          }
        } catch {}

        setResult({
          overallScore: latest.overallScore,
          atsScore: latest.atsScore,
          formattingScore: latest.formattingScore,
          impactScore: latest.impactScore,
          suggestions: JSON.parse(latest.suggestions || '[]'),
          missingKeywords: JSON.parse(latest.missingKeywords || '[]'),
          analyzedRole: latest.analyzedRole || null,
          // Enterprise fields from storage or defaults
          ats_compatibility_score: enterpriseData?.ats_compatibility_score || latest.overallScore,
          section_scores: enterpriseData?.section_scores || {
            keyword_alignment: latest.atsScore,
            impact_and_metrics: latest.impactScore,
            experience_relevance: 70,
            clarity_and_structure: latest.formattingScore,
          },
          detected_domain: enterpriseData?.detected_domain || null,
          executive_summary: enterpriseData?.executive_summary || null,
          keyword_analysis: enterpriseData?.keyword_analysis || null,
          critical_red_flags: enterpriseData?.critical_red_flags || [],
          bullet_point_optimizations: enterpriseData?.bullet_point_optimizations || [],
          tailored_action_plan: enterpriseData?.tailored_action_plan || [],
        });
      }
    } catch (err) {
      console.warn('Resume history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setAnalyzing(true);

      const response = await api.uploadResume(file);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        Alert.alert('Upload Failed', response.message || 'Failed to analyze resume.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred during upload.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const overallScore = result?.ats_compatibility_score || result?.overallScore || 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.warning;
    return Colors.error;
  };

  const getATSStatus = (score: number) => {
    if (score >= 85) return { label: 'PASSED', color: Colors.success };
    if (score >= 70) return { label: 'NEEDS WORK', color: Colors.warning };
    return { label: 'NEEDS FIX', color: Colors.error };
  };

  const renderScoreBar = (label: string, score: number, icon: string) => {
    const color = getScoreColor(score);
    return (
      <View style={styles.scoreBarContainer} key={label}>
        <View style={styles.scoreBarHeader}>
          <View style={styles.scoreBarLeft}>
            <Ionicons name={icon as any} size={16} color={color} />
            <Text style={styles.scoreBarLabel}>{label}</Text>
          </View>
          <Text style={[styles.scoreBarValue, { color }]}>{score}%</Text>
        </View>
        <View style={styles.scoreBarTrack}>
          <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Resume Review"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.newAnalysisBtn}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.newAnalysisText}>New Analysis</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashed Upload Box */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>Upload your CV</Text>
          <Text style={styles.uploadSubtitle}>
            PDF or Word files supported (Max 5MB)
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            {analyzing ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.browseButtonText}>Browse Files</Text>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <>
            {/* Detected Domain & Role Badge */}
            {(result.detected_domain || result.analyzedRole) && (
              <View style={styles.domainBadgeContainer}>
                <View style={styles.roleBadgeContainer}>
                  <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
                  <Text style={styles.roleBadgeText}>Analyzed for: </Text>
                  <Text style={styles.roleBadgeRole}>{result.analyzedRole || 'Professional'}</Text>
                </View>
                {result.detected_domain && (
                  <View style={[styles.roleBadgeContainer, { backgroundColor: 'rgba(68, 138, 255, 0.08)', borderColor: 'rgba(68, 138, 255, 0.2)' }]}>
                    <Ionicons name="layers-outline" size={14} color={Colors.info} />
                    <Text style={[styles.roleBadgeRole, { color: Colors.info }]}>{result.detected_domain}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Executive Summary Card */}
            {result.executive_summary && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                  <Text style={styles.summaryTitle}>Executive Summary</Text>
                </View>
                <Text style={styles.summaryText}>{result.executive_summary}</Text>
              </View>
            )}

            {/* Main Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>ATS COMPATIBILITY</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={[styles.scoreLarge, { color: getScoreColor(overallScore) }]}>{overallScore}</Text>
                  <Text style={styles.scoreTotal}> / 100</Text>
                </View>
                <Text style={styles.scoreDescription}>
                  {overallScore >= 85
                    ? `Excellent! Ready for top-tier ${result.analyzedRole || ''} applications.`
                    : overallScore >= 70
                    ? `Good foundation, needs ATS refinement.`
                    : `Needs improvements for ATS compatibility.`}
                </Text>
              </View>
              <ProgressRing progress={overallScore} size={74} strokeWidth={6} />
            </View>

            {/* Section Scores */}
            {result.section_scores && (
              <>
                <Text style={styles.sectionTitle}>Evaluation Breakdown</Text>
                <View style={styles.scoresCard}>
                  {renderScoreBar('Keyword Alignment', result.section_scores.keyword_alignment, 'key-outline')}
                  {renderScoreBar('Impact & Metrics', result.section_scores.impact_and_metrics, 'trending-up-outline')}
                  {renderScoreBar('Experience Relevance', result.section_scores.experience_relevance, 'briefcase-outline')}
                  {renderScoreBar('Clarity & Structure', result.section_scores.clarity_and_structure, 'grid-outline')}
                </View>
              </>
            )}

            {/* ATS Readiness Checklist */}
            <Text style={styles.sectionTitle}>ATS Readiness</Text>
            <View style={styles.readinessList}>
              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={(result.section_scores?.clarity_and_structure || result.formattingScore) >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={(result.section_scores?.clarity_and_structure || result.formattingScore) >= 80 ? Colors.success : Colors.error}
                  />
                  <Text style={styles.readinessItemText}>Formatting & Structure</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.section_scores?.clarity_and_structure || result.formattingScore).color }]}>
                  {getATSStatus(result.section_scores?.clarity_and_structure || result.formattingScore).label}
                </Text>
              </View>

              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={(result.section_scores?.keyword_alignment || result.atsScore) >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={(result.section_scores?.keyword_alignment || result.atsScore) >= 80 ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.readinessItemText}>Keywords Alignment</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.section_scores?.keyword_alignment || result.atsScore).color }]}>
                  {getATSStatus(result.section_scores?.keyword_alignment || result.atsScore).label}
                </Text>
              </View>

              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={(result.section_scores?.impact_and_metrics || result.impactScore) >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={(result.section_scores?.impact_and_metrics || result.impactScore) >= 80 ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.readinessItemText}>Impact & Metrics</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.section_scores?.impact_and_metrics || result.impactScore).color }]}>
                  {getATSStatus(result.section_scores?.impact_and_metrics || result.impactScore).label}
                </Text>
              </View>

              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={(result.section_scores?.experience_relevance || 70) >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={(result.section_scores?.experience_relevance || 70) >= 80 ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.readinessItemText}>Experience Relevance</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.section_scores?.experience_relevance || 70).color }]}>
                  {getATSStatus(result.section_scores?.experience_relevance || 70).label}
                </Text>
              </View>
            </View>

            {/* Critical Red Flags */}
            {result.critical_red_flags?.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => toggleSection('redFlags')}
                  activeOpacity={0.7}
                >
                  <View style={styles.collapsibleLeft}>
                    <Ionicons name="warning-outline" size={18} color={Colors.error} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Critical Red Flags</Text>
                  </View>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{result.critical_red_flags.length}</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === 'redFlags' ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {expandedSection === 'redFlags' && (
                  <View style={styles.expandedContent}>
                    {result.critical_red_flags.map((flag: string, i: number) => (
                      <View key={i} style={styles.redFlagItem}>
                        <Ionicons name="close-circle" size={16} color={Colors.error} style={{ marginTop: 2 }} />
                        <Text style={styles.redFlagText}>{flag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Keyword Analysis */}
            {result.keyword_analysis && (
              <>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => toggleSection('keywords')}
                  activeOpacity={0.7}
                >
                  <View style={styles.collapsibleLeft}>
                    <Ionicons name="key-outline" size={18} color={Colors.primary} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Keyword Analysis</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === 'keywords' ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {expandedSection === 'keywords' && (
                  <View style={styles.expandedContent}>
                    {/* Matched Keywords */}
                    {result.keyword_analysis.matched_keywords?.length > 0 && (
                      <>
                        <Text style={styles.subSectionTitle}>✅ Matched Keywords</Text>
                        <View style={styles.keywordsRow}>
                          {result.keyword_analysis.matched_keywords.map((kw: string, i: number) => (
                            <View key={i} style={styles.kwBadgeSuccess}>
                              <Text style={styles.kwTextSuccess}>{kw}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                    {/* Missing Keywords */}
                    {result.keyword_analysis.missing_critical_keywords?.length > 0 && (
                      <>
                        <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>❌ Missing Critical Keywords</Text>
                        <View style={styles.keywordsRow}>
                          {result.keyword_analysis.missing_critical_keywords.map((kw: string, i: number) => (
                            <View key={i} style={styles.kwBadge}>
                              <Text style={styles.kwText}>{kw}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                    {/* Recommended Certifications */}
                    {result.keyword_analysis.recommended_certifications_or_tools?.length > 0 && (
                      <>
                        <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>📜 Recommended Certifications</Text>
                        {result.keyword_analysis.recommended_certifications_or_tools.map((cert: string, i: number) => (
                          <View key={i} style={styles.certItem}>
                            <Ionicons name="ribbon-outline" size={14} color={Colors.warning} />
                            <Text style={styles.certText}>{cert}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Legacy Missing Keywords (fallback for old data) */}
            {!result.keyword_analysis && result.missingKeywords?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Missing Keywords</Text>
                <View style={styles.keywordsRow}>
                  {result.missingKeywords.map((kw: string, i: number) => (
                    <View key={i} style={styles.kwBadge}>
                      <Text style={styles.kwText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Bullet Point Optimizations */}
            {result.bullet_point_optimizations?.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => toggleSection('bullets')}
                  activeOpacity={0.7}
                >
                  <View style={styles.collapsibleLeft}>
                    <Ionicons name="create-outline" size={18} color={Colors.warning} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Bullet Optimizations</Text>
                  </View>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{result.bullet_point_optimizations.length}</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === 'bullets' ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {expandedSection === 'bullets' && (
                  <View style={styles.expandedContent}>
                    {result.bullet_point_optimizations.map((opt: any, i: number) => (
                      <View key={i} style={styles.bulletOptCard}>
                        {/* Original */}
                        <View style={styles.bulletSection}>
                          <Text style={styles.bulletLabel}>ORIGINAL</Text>
                          <View style={styles.bulletOriginalBox}>
                            <Text style={styles.bulletOriginalText}>{opt.original_text}</Text>
                          </View>
                        </View>
                        {/* Issue */}
                        <View style={styles.bulletSection}>
                          <Text style={[styles.bulletLabel, { color: Colors.error }]}>ISSUE</Text>
                          <Text style={styles.bulletIssueText}>{opt.issue}</Text>
                        </View>
                        {/* Enterprise Rewrite */}
                        <View style={styles.bulletSection}>
                          <Text style={[styles.bulletLabel, { color: Colors.success }]}>OPTIMIZED</Text>
                          <View style={styles.bulletRewriteBox}>
                            <Text style={styles.bulletRewriteText}>{opt.enterprise_rewrite}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Tailored Action Plan */}
            {result.tailored_action_plan?.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => toggleSection('actionPlan')}
                  activeOpacity={0.7}
                >
                  <View style={styles.collapsibleLeft}>
                    <Ionicons name="rocket-outline" size={18} color={Colors.primary} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Action Plan to 90+</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === 'actionPlan' ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {expandedSection === 'actionPlan' && (
                  <View style={styles.expandedContent}>
                    {result.tailored_action_plan.map((step: string, i: number) => (
                      <View key={i} style={styles.actionPlanItem}>
                        <View style={styles.actionPlanNumber}>
                          <Text style={styles.actionPlanNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.actionPlanText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* AI Suggestions (legacy fallback) */}
            {(!result.tailored_action_plan || result.tailored_action_plan.length === 0) &&
              result.suggestions?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>AI Suggestions</Text>
                {result.suggestions.map((tip: string, i: number) => (
                  <View key={i} style={styles.gapCard}>
                    <View style={styles.gapHeader}>
                      <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
                      <Text style={styles.gapTitle}>Tip {i + 1}</Text>
                    </View>
                    <Text style={styles.gapDescription}>{tip}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Optimize CTA */}
            <Button
              title="Discuss with AI Coach"
              onPress={() => router.push('/(tabs)/ai-chat')}
              variant="primary"
              style={styles.optimizeBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  newAnalysisBtn: { backgroundColor: 'rgba(0, 245, 212, 0.12)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.3)' },
  newAnalysisText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  uploadArea: { backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0, 245, 212, 0.3)', borderStyle: 'dashed', marginBottom: Spacing.xl },
  uploadIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#162334', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  uploadTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  uploadSubtitle: { fontSize: Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg },
  browseButton: { backgroundColor: '#182436', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#24344A' },
  browseButtonText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary },

  // Domain & Role Badges
  domainBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  roleBadgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 245, 212, 0.08)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.2)', gap: 6 },
  roleBadgeText: { fontSize: Typography.caption, color: Colors.textSecondary },
  roleBadgeRole: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.primary },

  // Executive Summary
  summaryCard: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.lg },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  summaryTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.primary },
  summaryText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 22 },

  // Main Score Card
  scoreCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl },
  scoreInfo: { flex: 1 },
  scoreLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs },
  scoreNumberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xs },
  scoreLarge: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary },
  scoreTotal: { fontSize: Typography.body, color: Colors.textMuted },
  scoreDescription: { fontSize: Typography.caption, color: Colors.textSecondary },

  // Section Scores
  scoresCard: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl, gap: Spacing.md },
  scoreBarContainer: { gap: 6 },
  scoreBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scoreBarLabel: { fontSize: Typography.caption, fontWeight: Typography.medium, color: Colors.textPrimary },
  scoreBarValue: { fontSize: Typography.caption, fontWeight: Typography.bold },
  scoreBarTrack: { height: 6, borderRadius: 3, backgroundColor: '#1A2536', overflow: 'hidden' },
  scoreBarFill: { height: 6, borderRadius: 3 },

  // Section Title
  sectionTitle: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // ATS Readiness
  readinessList: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#1C293A', padding: Spacing.md, marginBottom: Spacing.xl, gap: Spacing.md },
  readinessItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  readinessItemText: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.textPrimary },
  passedText: { fontSize: 10, fontWeight: Typography.bold },

  // Collapsible Sections
  collapsibleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.sm },
  collapsibleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  badgeCount: { backgroundColor: 'rgba(255, 82, 82, 0.15)', paddingVertical: 2, paddingHorizontal: 8, borderRadius: BorderRadius.full, marginRight: Spacing.sm },
  badgeCountText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.error },
  expandedContent: { backgroundColor: '#0D1520', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1A2536', marginBottom: Spacing.lg },

  // Red Flags
  redFlagItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#1A2536' },
  redFlagText: { fontSize: Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  // Keywords
  subSectionTitle: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.textMuted, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  kwBadge: { backgroundColor: 'rgba(255, 82, 82, 0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.3)' },
  kwText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.error },
  kwBadgeSuccess: { backgroundColor: 'rgba(0, 230, 118, 0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.3)' },
  kwTextSuccess: { fontSize: 11, fontWeight: Typography.bold, color: Colors.success },

  // Certifications
  certItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  certText: { fontSize: Typography.caption, color: Colors.textSecondary },

  // Bullet Optimizations
  bulletOptCard: { backgroundColor: '#111B28', borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.md },
  bulletSection: { marginBottom: Spacing.sm },
  bulletLabel: { fontSize: 9, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  bulletOriginalBox: { backgroundColor: 'rgba(255, 82, 82, 0.06)', borderRadius: BorderRadius.sm, padding: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.error },
  bulletOriginalText: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18, fontStyle: 'italic' },
  bulletIssueText: { fontSize: Typography.caption, color: Colors.error, lineHeight: 18 },
  bulletRewriteBox: { backgroundColor: 'rgba(0, 230, 118, 0.06)', borderRadius: BorderRadius.sm, padding: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.success },
  bulletRewriteText: { fontSize: Typography.caption, color: Colors.success, lineHeight: 18, fontWeight: Typography.medium },

  // Action Plan
  actionPlanItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#1A2536' },
  actionPlanNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0, 245, 212, 0.15)', alignItems: 'center', justifyContent: 'center' },
  actionPlanNumberText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary },
  actionPlanText: { fontSize: Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  // Legacy Suggestion Cards
  gapCard: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.md },
  gapHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  gapTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.textPrimary },
  gapDescription: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  // CTA
  optimizeBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xxxl },
});
