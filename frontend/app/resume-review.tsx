/**
 * AI Mentor - Resume Review Screen (Functionalized with Backend API)
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

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getResumeHistory();
      if (res.success && res.data && res.data.resumes && res.data.resumes.length > 0) {
        const resumes = res.data.resumes;
        setHistory(resumes);
        // Show latest result by default
        const latest = resumes[0];
        setResult({
          overallScore: latest.overallScore,
          atsScore: latest.atsScore,
          formattingScore: latest.formattingScore,
          impactScore: latest.impactScore,
          suggestions: JSON.parse(latest.suggestions || '[]'),
          missingKeywords: JSON.parse(latest.missingKeywords || '[]'),
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

  const overallScore = result?.overallScore || 0;

  const getATSStatus = (score: number) => {
    if (score >= 85) return { label: 'PASSED', color: Colors.success };
    if (score >= 70) return { label: 'NEEDS WORK', color: Colors.warning };
    return { label: 'NEEDS FIX', color: Colors.error };
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
            {/* Resume Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>RESUME SCORE</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={styles.scoreLarge}>{overallScore}</Text>
                  <Text style={styles.scoreTotal}> / 100</Text>
                </View>
                <Text style={styles.scoreDescription}>
                  {overallScore >= 85
                    ? 'Excellent! Ready for top-tier applications.'
                    : overallScore >= 70
                    ? 'Good foundation, needs ATS refinement.'
                    : 'Needs significant improvements for ATS.'}
                </Text>
              </View>

              <ProgressRing progress={overallScore} size={74} strokeWidth={6} />
            </View>

            {/* ATS Readiness Section */}
            <Text style={styles.sectionTitle}>ATS Readiness</Text>

            <View style={styles.readinessList}>
              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={result.formattingScore >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={result.formattingScore >= 80 ? Colors.success : Colors.error}
                  />
                  <Text style={styles.readinessItemText}>Formatting & Structure</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.formattingScore).color }]}>
                  {getATSStatus(result.formattingScore).label}
                </Text>
              </View>

              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={result.atsScore >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={result.atsScore >= 80 ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.readinessItemText}>Keywords Alignment</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.atsScore).color }]}>
                  {getATSStatus(result.atsScore).label}
                </Text>
              </View>

              <View style={styles.readinessItem}>
                <View style={styles.readinessLeft}>
                  <Ionicons
                    name={result.impactScore >= 80 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={result.impactScore >= 80 ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.readinessItemText}>Impact & Metrics</Text>
                </View>
                <Text style={[styles.passedText, { color: getATSStatus(result.impactScore).color }]}>
                  {getATSStatus(result.impactScore).label}
                </Text>
              </View>
            </View>

            {/* Missing Keywords */}
            {result.missingKeywords?.length > 0 && (
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

            {/* AI Suggestions */}
            {result.suggestions?.length > 0 && (
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
  scoreCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.xl },
  scoreInfo: { flex: 1 },
  scoreLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs },
  scoreNumberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xs },
  scoreLarge: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary },
  scoreTotal: { fontSize: Typography.body, color: Colors.textMuted },
  scoreDescription: { fontSize: Typography.caption, color: Colors.textSecondary },
  sectionTitle: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  readinessList: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#1C293A', padding: Spacing.md, marginBottom: Spacing.xl, gap: Spacing.md },
  readinessItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  readinessItemText: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.textPrimary },
  passedText: { fontSize: 10, fontWeight: Typography.bold },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  kwBadge: { backgroundColor: 'rgba(255, 82, 82, 0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.3)' },
  kwText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.error },
  gapCard: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#1C293A', marginBottom: Spacing.md },
  gapHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  gapTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.textPrimary },
  gapDescription: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  optimizeBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xxxl },
});
