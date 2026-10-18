/**
 * AI Mentor - Enterprise-Grade Resume Review Screen
 * Evaluates resumes against a target Role, Industry, and Job Description
 * using the 4-D ATS Rubric (40% Keywords, 25% Impact, 20% Relevance, 15% Clarity).
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';

import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { ProgressRing } from '../src/components/ProgressRing';
import { Button } from '../src/components/Button';
import { api } from '../src/services/api';

const POPULAR_ROLES = [
  'Software Engineer Intern',
  'Junior Software Engineer',
  'Software Engineer',
  'Fullstack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps / SRE',
  'Tech Lead / Architect',
  'Data Scientist / AI',
  'Product Manager',
];

const INDUSTRIES = [
  { label: 'Technology', value: 'technology' },
  { label: 'Finance & Banking', value: 'finance' },
  { label: 'Healthcare & Biotech', value: 'healthcare' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Creative & Design', value: 'creative' },
  { label: 'Legal & Compliance', value: 'legal' },
  { label: 'Operations & Mgmt', value: 'operations' },
];

export default function ResumeReviewScreen() {
  const router = useRouter();

  // Configuration state
  const [targetRole, setTargetRole] = useState('Software Engineer Intern');
  const [customRole, setCustomRole] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('technology');
  const [jobDescription, setJobDescription] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showJdInput, setShowJdInput] = useState(false);

  // Analysis & history state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('Extracting resume content...');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('score_breakdown');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
          const strengthsParsed = JSON.parse(latest.strengths || '{}');
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
          ats_compatibility_score: enterpriseData?.ats_compatibility_score || latest.overallScore,
          section_scores: enterpriseData?.section_scores || {
            keyword_alignment: latest.atsScore || 75,
            impact_and_metrics: latest.impactScore || 70,
            experience_relevance: 75,
            clarity_and_structure: latest.formattingScore || 80,
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

  const activeRole = customRole.trim() || targetRole;

  const handleUpload = async () => {
    try {
      const docResult = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (docResult.canceled) return;

      const file = docResult.assets[0];
      setAnalyzing(true);
      setAnalysisStep('Scanning document & reconstructing OCR structure...');

      // Dynamic progress messages
      const timer1 = setTimeout(() => {
        setAnalysisStep('Evaluating against RAG industry benchmarks & 40/25/20/15 rubric...');
      }, 2500);

      const response = await api.uploadResume(
        file,
        activeRole,
        selectedIndustry,
        jobDescription.trim() || undefined
      );

      clearTimeout(timer1);

      if (response.success && response.data) {
        setResult(response.data);
        setExpandedSection('score_breakdown');
        // Refresh history in background
        loadHistory();
      } else {
        Alert.alert('Analysis Failed', response.message || 'Failed to analyze resume.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred during upload.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyRewrite = async (text: string, index: number) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2500);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const overallScore = Math.round(result?.ats_compatibility_score ?? result?.overallScore ?? 0);

  const getScoreColor = (score: number) => {
    if (score >= 70) return Colors.success; // Kolapatin (Green) if score >= 70
    if (score >= 45) return Colors.warning; // Kahapatin (Yellow) if score between 45 and 70
    return Colors.error;                   // Red if score < 45
  };

  const getATSStatus = (score: number) => {
    if (score >= 70) {
      return { label: 'STRONG MATCH (70+)', color: Colors.success, icon: 'checkmark-circle' };
    }
    if (score >= 45) {
      return { label: 'NEEDS WORK (45-69)', color: Colors.warning, icon: 'alert-circle' };
    }
    return { label: 'CRITICAL FIX (<45)', color: Colors.error, icon: 'close-circle' };
  };

  const status = getATSStatus(overallScore);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Enterprise ATS Review"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.headerConfigBtn}
            onPress={() => setShowConfig(!showConfig)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={Colors.primary} />
            <Text style={styles.headerConfigText}>{showConfig ? 'Hide Settings' : 'Target Setup'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TARGET ROLE & INDUSTRY CONFIGURATION PANEL */}
        <View style={styles.configCard}>
          <TouchableOpacity
            style={styles.configCardHeader}
            onPress={() => setShowConfig(!showConfig)}
            activeOpacity={0.8}
          >
            <View style={styles.configTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="briefcase" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configTitle}>Target Evaluation Rubric</Text>
                <Text style={styles.configSubtitle}>
                  {activeRole} • {INDUSTRIES.find(i => i.value === selectedIndustry)?.label || 'Technology'}
                  {jobDescription.trim() ? ' • Target JD Attached' : ''}
                </Text>
              </View>
              <Ionicons
                name={showConfig ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </View>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBody}>
              {/* Target Role Selector */}
              <Text style={styles.inputLabel}>TARGET JOB ROLE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                {POPULAR_ROLES.map((r) => {
                  const isSelected = targetRole === r && !customRole;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setTargetRole(r);
                        setCustomRole('');
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Role Input */}
              <View style={styles.customRoleInputRow}>
                <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.customRoleInput}
                  placeholder="Or type custom role (e.g., Staff ML Engineer)..."
                  placeholderTextColor={Colors.textMuted}
                  value={customRole}
                  onChangeText={(text) => setCustomRole(text)}
                />
              </View>

              {/* Industry Selector */}
              <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>INDUSTRY DOMAIN</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                {INDUSTRIES.map((ind) => {
                  const isSelected = selectedIndustry === ind.value;
                  return (
                    <TouchableOpacity
                      key={ind.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedIndustry(ind.value)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {ind.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Optional Job Description Accordion */}
              <TouchableOpacity
                style={styles.jdToggleRow}
                onPress={() => setShowJdInput(!showJdInput)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showJdInput ? 'document-text' : 'document-text-outline'}
                  size={16}
                  color={jobDescription.trim() ? Colors.primary : Colors.textMuted}
                />
                <Text style={styles.jdToggleText}>
                  {showJdInput ? 'Hide Target Job Description' : 'Add Target Job Description (Optional)'}
                </Text>
                {jobDescription.trim() && (
                  <View style={styles.jdActivePill}>
                    <Text style={styles.jdActivePillText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>

              {showJdInput && (
                <View style={styles.jdInputBox}>
                  <TextInput
                    style={styles.jdTextInput}
                    placeholder="Paste job posting text here to evaluate resume keywords and competencies against the exact requirements..."
                    placeholderTextColor={Colors.textMuted}
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {jobDescription.length > 0 && (
                    <View style={styles.jdCharCountRow}>
                      <Text style={styles.jdCharCountText}>{jobDescription.length} characters</Text>
                      <TouchableOpacity onPress={() => setJobDescription('')}>
                        <Text style={styles.jdClearText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* UPLOAD HERO BOX */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>Upload Resume for ATS Diagnostic</Text>
          <Text style={styles.uploadSubtitle}>
            OCR Noise-tolerant PDF & Word parsing with RAG benchmarks
          </Text>

          <View style={styles.targetContextRow}>
            <View style={styles.contextTag}>
              <Ionicons name="person" size={12} color={Colors.primary} />
              <Text style={styles.contextTagText}>{activeRole}</Text>
            </View>
            <View style={[styles.contextTag, { borderColor: 'rgba(68, 138, 255, 0.4)' }]}>
              <Ionicons name="business" size={12} color={Colors.info} />
              <Text style={[styles.contextTagText, { color: Colors.info }]}>
                {INDUSTRIES.find(i => i.value === selectedIndustry)?.label || 'Technology'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleUpload}
            activeOpacity={0.8}
            disabled={analyzing}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator size="small" color="#0B131E" />
                <Text style={styles.analyzingText}>{analysisStep}</Text>
              </View>
            ) : (
              <View style={styles.buttonInnerRow}>
                <Ionicons name="document-attach-outline" size={18} color="#0B131E" />
                <Text style={styles.browseButtonText}>Select Resume File (PDF)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ATS DIAGNOSTIC RESULTS */}
        {result && (
          <>
            {/* EXECUTIVE SUMMARY SCORECARD */}
            <View style={styles.scorecardCard}>
              <View style={styles.scorecardTop}>
                <View style={styles.scoreRingWrap}>
                  <ProgressRing
                    progress={overallScore}
                    size={94}
                    strokeWidth={8}
                    color={status.color}
                    label=""
                  >
                    <View style={styles.scoreInsideText}>
                      <Text style={[styles.scoreNumber, { color: status.color }]}>{overallScore}</Text>
                      <Text style={styles.scoreLabel}>/ 100</Text>
                    </View>
                  </ProgressRing>
                </View>

                <View style={styles.scoreMetaColumn}>
                  <View style={[styles.statusBadge, { backgroundColor: `${status.color}20`, borderColor: `${status.color}50` }]}>
                    <Ionicons name={status.icon as any} size={14} color={status.color} />
                    <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                  </View>

                  <Text style={styles.roleAnalyzedText}>Target: {result.analyzedRole || activeRole}</Text>

                  {result.detected_domain && (
                    <View style={styles.domainPill}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={Colors.primary} />
                      <Text style={styles.domainPillText}>{result.detected_domain}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Executive Assessment Verdict */}
              {result.executive_summary && (
                <View style={styles.executiveSummaryBox}>
                  <View style={styles.execHeaderRow}>
                    <Ionicons name="chatbox-ellipses-outline" size={16} color={Colors.primary} />
                    <Text style={styles.execHeaderTitle}>Executive Strategist Verdict</Text>
                  </View>
                  <Text style={styles.execSummaryContent}>{result.executive_summary}</Text>
                </View>
              )}
            </View>

            {/* 4-D WEIGHTED ATS SCORING BREAKDOWN */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="analytics" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeaderTitle}>4-Dimension ATS Rubric</Text>
                  <Text style={styles.sectionHeaderSubtitle}>Weighted section scores out of 100% total</Text>
                </View>
              </View>

              <View style={styles.scoreBarsList}>
                {/* 1. Keyword Alignment (40%) */}
                {renderScoreItem(
                  'Keyword Alignment & ATS Parsability',
                  '40% Weight',
                  result.section_scores?.keyword_alignment ?? result.atsScore ?? 0,
                  'key-outline',
                  'Core skills, technical tools, domain methodologies'
                )}

                {/* 2. Quantifiable Impact & Metrics (25%) */}
                {renderScoreItem(
                  'Quantifiable Impact & Metrics',
                  '25% Weight',
                  result.section_scores?.impact_and_metrics ?? result.impactScore ?? 0,
                  'trending-up-outline',
                  "Adoption of Google's XYZ impact formula with numbers"
                )}

                {/* 3. Role & Experience Relevance (20%) */}
                {renderScoreItem(
                  'Role & Experience Relevance',
                  '20% Weight',
                  result.section_scores?.experience_relevance ?? 75,
                  'briefcase-outline',
                  'Seniority depth, career progression, domain competencies'
                )}

                {/* 4. Formatting, Structure & Readability (15%) */}
                {renderScoreItem(
                  'Formatting & Structure Index',
                  '15% Weight',
                  result.section_scores?.clarity_and_structure ?? result.formattingScore ?? 0,
                  'list-outline',
                  'Clear hierarchy, standard headings, OCR parsability'
                )}
              </View>
            </View>

            {/* CRITICAL RED FLAGS */}
            {result.critical_red_flags && result.critical_red_flags.length > 0 && (
              <View style={styles.collapsibleWrap}>
                <TouchableOpacity
                  style={[styles.collapsibleHeader, { borderColor: 'rgba(255, 82, 82, 0.3)', backgroundColor: '#181215' }]}
                  onPress={() => toggleSection('red_flags')}
                  activeOpacity={0.8}
                >
                  <View style={styles.collapsibleLeft}>
                    <Ionicons name="warning-outline" size={20} color={Colors.error} />
                    <Text style={[styles.collapsibleTitle, { color: Colors.error }]}>Critical Red Flags</Text>
                  </View>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{result.critical_red_flags.length} Dealbreakers</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === 'red_flags' ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.error}
                  />
                </TouchableOpacity>

                {expandedSection === 'red_flags' && (
                  <View style={styles.expandedContent}>
                    {result.critical_red_flags.map((flag: string, idx: number) => (
                      <View key={idx} style={styles.redFlagItem}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} style={{ marginTop: 2 }} />
                        <Text style={styles.redFlagText}>{flag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* KEYWORD ANALYSIS DEEP-DIVE */}
            <View style={styles.collapsibleWrap}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('keywords')}
                activeOpacity={0.8}
              >
                <View style={styles.collapsibleLeft}>
                  <Ionicons name="search-outline" size={20} color={Colors.primary} />
                  <Text style={styles.collapsibleTitle}>Keyword & Competency Deep-Dive</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'keywords' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {expandedSection === 'keywords' && (
                <View style={styles.expandedContent}>
                  {/* Matched Keywords */}
                  <Text style={styles.subSectionTitle}>
                    MATCHED ATS KEYWORDS ({result.keyword_analysis?.matched_keywords?.length || result.extractedKeywords?.length || 0})
                  </Text>
                  <View style={styles.keywordsRow}>
                    {(result.keyword_analysis?.matched_keywords || result.extractedKeywords || []).map(
                      (kw: string, idx: number) => (
                        <View key={idx} style={styles.kwBadgeSuccess}>
                          <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                          <Text style={styles.kwTextSuccess}>{kw}</Text>
                        </View>
                      )
                    )}
                  </View>

                  {/* Missing Critical Keywords */}
                  <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>
                    CRITICAL MISSING KEYWORDS (IMMEDIATE ATS FILTERS)
                  </Text>
                  <View style={styles.keywordsRow}>
                    {(result.keyword_analysis?.missing_critical_keywords || result.missingKeywords || []).map(
                      (kw: string, idx: number) => (
                        <View key={idx} style={styles.kwBadge}>
                          <Ionicons name="add-circle-outline" size={12} color={Colors.error} />
                          <Text style={styles.kwText}>{kw}</Text>
                        </View>
                      )
                    )}
                  </View>

                  {/* Recommended Certifications & Tools */}
                  {result.keyword_analysis?.recommended_certifications_or_tools &&
                    result.keyword_analysis.recommended_certifications_or_tools.length > 0 && (
                      <>
                        <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>
                          RECOMMENDED CREDENTIALS & CERTIFICATIONS
                        </Text>
                        {result.keyword_analysis.recommended_certifications_or_tools.map(
                          (cert: string, idx: number) => (
                            <View key={idx} style={styles.certItem}>
                              <Ionicons name="ribbon-outline" size={16} color={Colors.primary} />
                              <Text style={styles.certText}>{cert}</Text>
                            </View>
                          )
                        )}
                      </>
                    )}
                </View>
              )}
            </View>

            {/* BULLET POINT OPTIMIZATIONS (BEFORE & AFTER) */}
            <View style={styles.collapsibleWrap}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('bullets')}
                activeOpacity={0.8}
              >
                <View style={styles.collapsibleLeft}>
                  <Ionicons name="construct-outline" size={20} color={Colors.warning} />
                  <Text style={styles.collapsibleTitle}>Executive Bullet Optimizations</Text>
                </View>
                <View style={[styles.badgeCount, { backgroundColor: 'rgba(255, 214, 0, 0.15)' }]}>
                  <Text style={[styles.badgeCountText, { color: Colors.warning }]}>
                    {result.bullet_point_optimizations?.length || 0} Rewrites
                  </Text>
                </View>
                <Ionicons
                  name={expandedSection === 'bullets' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {expandedSection === 'bullets' && (
                <View style={styles.expandedContent}>
                  <Text style={styles.bulletIntroText}>
                    Google XYZ Formula Rewrites: Accomplished [X] as measured by [Y], by doing [Z].
                  </Text>

                  {(result.bullet_point_optimizations || []).map((opt: any, idx: number) => (
                    <View key={idx} style={styles.bulletOptCard}>
                      {/* Original Weak Bullet */}
                      <View style={styles.bulletSection}>
                        <Text style={styles.bulletLabel}>ORIGINAL BULLET POINT</Text>
                        <View style={styles.bulletOriginalBox}>
                          <Text style={styles.bulletOriginalText}>"{opt.original_text}"</Text>
                        </View>
                      </View>

                      {/* Flagged Issue */}
                      <View style={styles.bulletSection}>
                        <Text style={[styles.bulletLabel, { color: Colors.error }]}>IDENTIFIED ISSUE</Text>
                        <Text style={styles.bulletIssueText}>⚠ {opt.issue}</Text>
                      </View>

                      {/* High-Impact Enterprise Rewrite */}
                      <View style={styles.bulletSection}>
                        <View style={styles.rewriteHeaderRow}>
                          <Text style={[styles.bulletLabel, { color: Colors.success }]}>
                            ENTERPRISE XYZ REWRITE
                          </Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => handleCopyRewrite(opt.enterprise_rewrite, idx)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={copiedIndex === idx ? 'checkmark-done' : 'copy-outline'}
                              size={14}
                              color={copiedIndex === idx ? Colors.success : Colors.primary}
                            />
                            <Text
                              style={[
                                styles.copyBtnText,
                                copiedIndex === idx && { color: Colors.success },
                              ]}
                            >
                              {copiedIndex === idx ? 'Copied!' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.bulletRewriteBox}>
                          <Text style={styles.bulletRewriteText}>{opt.enterprise_rewrite}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* STEP-BY-STEP TAILORED ACTION PLAN */}
            <View style={styles.collapsibleWrap}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('action_plan')}
                activeOpacity={0.8}
              >
                <View style={styles.collapsibleLeft}>
                  <Ionicons name="flag-outline" size={20} color={Colors.primary} />
                  <Text style={styles.collapsibleTitle}>Priority 90+ Score Action Plan</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'action_plan' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {expandedSection === 'action_plan' && (
                <View style={styles.expandedContent}>
                  {(result.tailored_action_plan || result.suggestions || []).map(
                    (step: string, idx: number) => (
                      <View key={idx} style={styles.actionPlanItem}>
                        <View style={styles.actionPlanNumber}>
                          <Text style={styles.actionPlanNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.actionPlanText}>{step}</Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </View>

            {/* RE-ANALYZE CTA */}
            <Button
              title="Upload Revised Resume"
              onPress={handleUpload}
              style={styles.optimizeBtn}
              variant="primary"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function renderScoreItem(
    title: string,
    weight: string,
    score: number,
    icon: string,
    description: string
  ) {
    const color = getScoreColor(score);
    return (
      <View style={styles.scoreBarContainer} key={title}>
        <View style={styles.scoreBarHeader}>
          <View style={styles.scoreBarLeft}>
            <Ionicons name={icon as any} size={16} color={color} />
            <Text style={styles.scoreBarLabel}>{title}</Text>
          </View>
          <View style={styles.scoreBarRight}>
            <Text style={styles.weightBadge}>{weight}</Text>
            <Text style={[styles.scoreBarValue, { color }]}>{score}%</Text>
          </View>
        </View>
        <Text style={styles.scoreDescriptionText}>{description}</Text>
        <View style={styles.scoreBarTrack}>
          <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 60 },

  // Header Config Button
  headerConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  headerConfigText: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },

  // Setup / Config Card
  configCard: {
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  configCardHeader: {
    padding: Spacing.md,
  },
  configTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  configSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  configBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#1A2536',
    paddingTop: Spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  chipScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#151F2E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#223246',
  },
  chipActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  customRoleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131D2A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#223246',
    marginTop: Spacing.sm,
  },
  customRoleInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    padding: 0,
  },
  jdToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingVertical: 6,
  },
  jdToggleText: {
    fontSize: 12,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  jdActivePill: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
  },
  jdActivePillText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  jdInputBox: {
    backgroundColor: '#121B27',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#1F2C3E',
    marginTop: 6,
  },
  jdTextInput: {
    color: Colors.textPrimary,
    fontSize: 12,
    minHeight: 70,
  },
  jdCharCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1A2536',
    paddingTop: 4,
  },
  jdCharCountText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  jdClearText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: Typography.bold,
  },

  // Upload Area
  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#243447',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    backgroundColor: '#0E1622',
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  uploadTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  targetContextRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  contextTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15202E',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  contextTagText: {
    fontSize: 11,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseButtonText: {
    color: '#0B131E',
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzingText: {
    color: '#0B131E',
    fontSize: 12,
    fontWeight: Typography.bold,
  },

  // Scorecard Card
  scorecardCard: {
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.lg,
  },
  scorecardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  scoreRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInsideText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: Typography.bold,
    lineHeight: 30,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginTop: -2,
  },
  scoreMetaColumn: {
    flex: 1,
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  roleAnalyzedText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  domainPillText: {
    fontSize: 10,
    fontWeight: Typography.medium,
    color: Colors.primary,
  },
  executiveSummaryBox: {
    backgroundColor: '#131C28',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  execHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  execHeaderTitle: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  execSummaryContent: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Section Card (4-D Rubric)
  sectionCard: {
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionHeaderSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreBarsList: {
    gap: Spacing.md,
  },
  scoreBarContainer: {
    gap: 4,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  scoreBarLabel: {
    fontSize: 12,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  scoreBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightBadge: {
    fontSize: 10,
    color: Colors.textMuted,
    backgroundColor: '#162232',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
  },
  scoreBarValue: {
    fontSize: 12,
    fontWeight: Typography.bold,
    width: 38,
    textAlign: 'right',
  },
  scoreDescriptionText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: '#182434',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Collapsible Sections
  collapsibleWrap: {
    marginBottom: Spacing.md,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  collapsibleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  badgeCount: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.error,
  },
  expandedContent: {
    backgroundColor: '#0C131D',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1A2536',
    marginTop: Spacing.xs,
  },

  // Red Flags
  redFlagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2536',
  },
  redFlagText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Keywords
  subSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  kwBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  kwText: {
    fontSize: 11,
    fontWeight: Typography.medium,
    color: Colors.error,
  },
  kwBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  kwTextSuccess: {
    fontSize: 11,
    fontWeight: Typography.medium,
    color: Colors.success,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  certText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },

  // Bullet Optimizations
  bulletIntroText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  bulletOptCard: {
    backgroundColor: '#101925',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
  },
  bulletSection: {
    marginBottom: Spacing.sm,
  },
  bulletLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  bulletOriginalBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.06)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  bulletOriginalText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  bulletIssueText: {
    fontSize: Typography.caption,
    color: Colors.warning,
    lineHeight: 18,
  },
  rewriteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  bulletRewriteBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  bulletRewriteText: {
    fontSize: Typography.caption,
    color: Colors.success,
    lineHeight: 18,
    fontWeight: Typography.medium,
  },

  // Action Plan
  actionPlanItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2536',
  },
  actionPlanNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlanNumberText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  actionPlanText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // CTA
  optimizeBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
