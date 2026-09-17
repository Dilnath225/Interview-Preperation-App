/**
 * AI Mentor - Mock Interview Page (Functionalized with Backend API)
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ProgressRing } from '../src/components/ProgressRing';
import { Button } from '../src/components/Button';
import { api } from '../src/services/api';

export default function MockInterviewScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    startNewSession();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnswering) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isAnswering]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const res = await api.startInterview('BEHAVIORAL', undefined, 'Medium');
      if (res.success && res.data) {
        setSession(res.data);
        setQuestions(res.data.questions || []);
        setQuestionIndex(0);
        setFeedback(null);
        setUserAnswer('');
      } else {
        Alert.alert('Error', 'Could not start interview session.');
      }
    } catch (err) {
      console.warn('Start interview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnswer = () => {
    if (isAnswering) {
      // Stop answering, submit
      setIsAnswering(false);
      submitCurrentAnswer();
    } else {
      setIsAnswering(true);
      setTimer(0);
      setFeedback(null);
    }
  };

  const submitCurrentAnswer = async () => {
    const currentQ = questions[questionIndex];
    if (!currentQ || !userAnswer.trim()) {
      Alert.alert('Empty Answer', 'Please type or speak your answer before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitAnswer(session.id, currentQ.id, userAnswer.trim());
      if (res.success && res.data) {
        setFeedback(res.data.evaluation);
      }
    } catch (err) {
      console.warn('Submit answer error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setIsAnswering(false);
      setUserAnswer('');
      setFeedback(null);
      setTimer(0);
    } else {
      // Complete session
      try {
        await api.completeInterview(session.id);
        Alert.alert(
          '🎉 Interview Complete!',
          `Session finished! Your readiness score has improved.`,
          [{ text: 'View Profile', onPress: () => router.replace('/(tabs)/profile') }]
        );
      } catch (err) {
        router.replace('/(tabs)/profile');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>Generating AI questions...</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[questionIndex];
  const totalQuestions = questions.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header with Timer */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Session Meta */}
        <View style={styles.sessionMetaCard}>
          <View>
            <View style={styles.sessionTypeBadge}>
              <Text style={styles.sessionTypeText}>{session?.type || 'BEHAVIORAL'} SESSION</Text>
            </View>
            <Text style={styles.questionNumberText}>
              Question {questionIndex + 1} of {totalQuestions}
            </Text>
          </View>

          <ProgressRing
            progress={((questionIndex + 1) / totalQuestions) * 100}
            size={56}
            strokeWidth={5}
            label={`${Math.round(((questionIndex + 1) / totalQuestions) * 100)}%`}
          />
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.quoteMark}>"</Text>
          <Text style={styles.questionText}>
            {currentQuestion?.questionText || 'No question available.'}
          </Text>

          <View style={styles.listeningStatusRow}>
            <View style={[styles.pulsingDot, isAnswering && { backgroundColor: '#FF5252' }]} />
            <Text style={styles.listeningText}>
              {isAnswering ? 'RECORDING YOUR ANSWER' : 'TAP START TO ANSWER'}
            </Text>
          </View>
        </View>

        {/* Answer Input */}
        <View style={styles.answerBox}>
          <TextInput
            style={styles.answerInput}
            placeholder="Type your answer here..."
            placeholderTextColor={Colors.textMuted}
            value={userAnswer}
            onChangeText={setUserAnswer}
            multiline
            editable={isAnswering}
          />
        </View>

        {/* AI Feedback Card */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeaderRow}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.feedbackTitle}>AI Evaluation</Text>
              <Text style={styles.feedbackScore}>{feedback.score}/100</Text>
            </View>

            <Text style={styles.feedbackText}>{feedback.feedbackText}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{feedback.clarityScore}%</Text>
                <Text style={styles.metricLabel}>Clarity</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{feedback.technicalAccuracyScore}%</Text>
                <Text style={styles.metricLabel}>Technical</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{feedback.confidenceScore}%</Text>
                <Text style={styles.metricLabel}>Confidence</Text>
              </View>
            </View>

            {feedback.improvements?.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Improvements:</Text>
                {feedback.improvements.map((tip: string, i: number) => (
                  <Text key={i} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main Action Button */}
        <Button
          title={submitting ? 'Evaluating...' : isAnswering ? 'Stop & Submit' : 'Start Answering'}
          onPress={handleToggleAnswer}
          variant="primary"
          icon={<Ionicons name={isAnswering ? 'stop' : 'mic'} size={20} color={Colors.background} />}
          style={styles.startBtn}
          loading={submitting}
        />

        {/* Secondary Actions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
            <Ionicons name="videocam-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.secondaryBtnText}>Record Video</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>
              {questionIndex >= totalQuestions - 1 ? 'Finish' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { padding: Spacing.xs },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101824', paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.3)', gap: 6 },
  timerText: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  sessionMetaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  sessionTypeBadge: { backgroundColor: 'rgba(0, 245, 212, 0.12)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: Spacing.xs },
  sessionTypeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 1 },
  questionNumberText: { fontSize: Typography.h5, fontWeight: Typography.bold, color: Colors.textPrimary },
  questionCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.15)', marginBottom: Spacing.lg },
  quoteMark: { fontSize: 48, color: Colors.primary, lineHeight: 48, marginBottom: -16, opacity: 0.7 },
  questionText: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.textPrimary, lineHeight: 28, marginBottom: Spacing.xl },
  listeningStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  listeningText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 1 },
  answerBox: { backgroundColor: '#101824', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#1C293A', padding: Spacing.md, marginBottom: Spacing.lg, minHeight: 120 },
  answerInput: { color: Colors.textPrimary, fontSize: Typography.bodySmall, lineHeight: 22, minHeight: 100, textAlignVertical: 'top' },
  feedbackCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.2)', marginBottom: Spacing.lg },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  feedbackTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary, flex: 1 },
  feedbackScore: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.primary },
  feedbackText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  metricsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  metric: { flex: 1, alignItems: 'center', backgroundColor: '#162232', borderRadius: BorderRadius.md, paddingVertical: Spacing.sm },
  metricValue: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary },
  metricLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  tipsSection: { marginTop: Spacing.sm },
  tipsTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.warning, marginBottom: 4 },
  tipText: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18, marginBottom: 2 },
  startBtn: { marginBottom: Spacing.lg },
  actionButtonsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxxl },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#101824', borderWidth: 1, borderColor: '#1C293A', borderRadius: BorderRadius.xl, paddingVertical: Spacing.md, gap: Spacing.xs },
  secondaryBtnText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary },
});
