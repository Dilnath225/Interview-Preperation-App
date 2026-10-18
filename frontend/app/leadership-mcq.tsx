/**
 * AI Mentor - Leadership & Behavioral MCQ Assessment Screen
 * Interactive 40-question enterprise papers with navigation, review, and dynamic scoring.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { Button } from '../src/components/Button';
import { LEADERSHIP_PAPERS, LeadershipPaper, LeadershipQuestion } from '../src/data/leadershipPapers';
import { useNotifications } from '../src/context';

export default function LeadershipMCQScreen() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  // Screen modes: 'SELECT_PAPER' | 'QUIZ' | 'RESULTS'
  const [mode, setMode] = useState<'SELECT_PAPER' | 'QUIZ' | 'RESULTS'>('SELECT_PAPER');
  const [selectedPaper, setSelectedPaper] = useState<LeadershipPaper>(LEADERSHIP_PAPERS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // User answers map: { [questionId: number]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Question Palette Modal
  const [paletteVisible, setPaletteVisible] = useState(false);

  // 90-Minute Assessment Countdown Timer (90 * 60 = 5400 seconds)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(90 * 60);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Active Timer Effect with 90-minute Auto Submit
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'QUIZ') {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            Alert.alert(
              'Time Expired (90 Minutes)',
              'The 90-minute time limit for this Leadership assessment has expired. Your answers are being submitted automatically.',
              [{ text: 'View Evaluation', onPress: () => calculateAndShowResults(answersRef.current) }]
            );
            calculateAndShowResults(answersRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, selectedPaper]);

  // Results State
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [resultsReview, setResultsReview] = useState<Array<{
    question: LeadershipQuestion;
    userAnswer: 'A' | 'B' | 'C' | 'D' | null;
    isCorrect: boolean;
  }>>([]);

  const currentQuestion: LeadershipQuestion = selectedPaper.questions[currentIndex] || selectedPaper.questions[0];
  const totalQuestions = selectedPaper.questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleStartPaper = (paper: LeadershipPaper) => {
    setSelectedPaper(paper);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeftSeconds(90 * 60);
    setMode('QUIZ');
  };

  const handleRandomPaper = () => {
    const randomIndex = Math.floor(Math.random() * LEADERSHIP_PAPERS.length);
    handleStartPaper(LEADERSHIP_PAPERS[randomIndex]);
  };

  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setPaletteVisible(false);
  };

  const handleSubmitQuiz = () => {
    const unansweredCount = totalQuestions - answeredCount;
    if (unansweredCount > 0) {
      Alert.alert(
        'Incomplete Assessment',
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit now?`,
        [
          { text: 'Review Questions', style: 'cancel', onPress: () => setPaletteVisible(true) },
          { text: 'Submit Anyway', style: 'destructive', onPress: calculateAndShowResults },
        ]
      );
    } else {
      calculateAndShowResults();
    }
  };

  const calculateAndShowResults = (overrideAnswers?: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    const finalAnswers = overrideAnswers || answers;
    let correctCount = 0;
    const reviewList = selectedPaper.questions.map((q) => {
      const userChoice = finalAnswers[q.id] || null;
      const isCorrect = userChoice === q.correctOption;
      if (isCorrect) correctCount++;
      return {
        question: q,
        userAnswer: userChoice,
        isCorrect,
      };
    });

    const finalPct = Math.round((correctCount / totalQuestions) * 100);
    setScore(correctCount);
    setPercentage(finalPct);
    setResultsReview(reviewList);
    setMode('RESULTS');

    // Trigger Notification
    addNotification(
      'Leadership Assessment Completed',
      `You scored ${correctCount}/${totalQuestions} (${finalPct}%) on "${selectedPaper.title}". Check your leadership evaluation report!`,
      'leadership',
      '/leadership-mcq'
    );
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Verdict computation based on percentage
  const getLeadershipVerdict = (pct: number) => {
    if (pct >= 90) return { title: 'Enterprise Strategic Leader', badge: 'TOP 5%', color: Colors.primary };
    if (pct >= 75) return { title: 'High-Impact Engineering Leader', badge: 'EXCELLENT', color: '#00E676' };
    if (pct >= 55) return { title: 'Emerging Situational Leader', badge: 'COMPETENT', color: '#FFB300' };
    return { title: 'Foundational / Developing Leader', badge: 'PRACTICE NEEDED', color: '#FF5252' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={mode === 'SELECT_PAPER' ? 'Leadership MCQs' : selectedPaper.title}
        showBack={mode !== 'SELECT_PAPER'}
        onBackPress={() => {
          if (mode === 'QUIZ') {
            Alert.alert('Leave Assessment?', 'Your current answers will be lost.', [
              { text: 'Stay', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => setMode('SELECT_PAPER') },
            ]);
          } else {
            setMode('SELECT_PAPER');
          }
        }}
        rightAction={
          mode === 'QUIZ' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* 90-min Countdown Timer Badge */}
              <View style={[styles.timerBadge, timeLeftSeconds < 600 && styles.timerBadgeUrgent]}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={timeLeftSeconds < 600 ? '#FF3B30' : Colors.primary}
                />
                <Text
                  style={[
                    styles.timerBadgeText,
                    timeLeftSeconds < 600 && { color: '#FF3B30' },
                  ]}
                >
                  {formatTimer(timeLeftSeconds)}
                </Text>
              </View>

              {/* Question Palette Trigger */}
              <TouchableOpacity
                style={styles.paletteBtn}
                onPress={() => setPaletteVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.primary} />
                <Text style={styles.paletteBtnText}>{answeredCount}/{totalQuestions}</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* ========================================================
          SCREEN 1: SELECT PAPER
      ======================================================== */}
      {mode === 'SELECT_PAPER' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerHero}>
            <View style={styles.badgeTop}>
              <Ionicons name="ribbon-outline" size={14} color={Colors.primary} />
              <Text style={styles.badgeTopText}>40 SCENARIO MCQs PER PAPER</Text>
            </View>
            <Text style={styles.heroTitle}>Leadership & Behavioral Assessments</Text>
            <Text style={styles.heroSubtitle}>
              Master situational engineering judgment. Choose a calibrated paper or test your executive problem-solving with random papers.
            </Text>

            <TouchableOpacity style={styles.randomBtn} onPress={handleRandomPaper} activeOpacity={0.85}>
              <Ionicons name="shuffle" size={18} color="#070C12" />
              <Text style={styles.randomBtnText}>Start Random 40-Question Paper</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeading}>Available Papers (Select Level)</Text>

          {LEADERSHIP_PAPERS.map((paper) => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperCard}
              onPress={() => handleStartPaper(paper)}
              activeOpacity={0.8}
            >
              <View style={styles.paperHeaderRow}>
                <View style={styles.paperNumberBadge}>
                  <Text style={styles.paperNumberText}>PAPER {paper.paperNumber}</Text>
                </View>
                <View style={[styles.levelPill, paper.level === 'Internship' ? styles.levelIntern : paper.level === 'Enterprise' ? styles.levelEnterprise : styles.levelMid]}>
                  <Text style={styles.levelPillText}>{paper.levelBadge}</Text>
                </View>
              </View>

              <Text style={styles.paperTitle}>{paper.title}</Text>
              <Text style={styles.paperDesc}>{paper.description}</Text>

              <View style={styles.paperFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="help-circle-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.footerItemText}>{paper.questionsCount} Questions</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.footerItemText}>~{paper.timeEstimateMinutes} mins</Text>
                </View>
                <View style={styles.startArrow}>
                  <Text style={styles.startArrowText}>Start</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ========================================================
          SCREEN 2: ACTIVE QUIZ
      ======================================================== */}
      {mode === 'QUIZ' && (
        <View style={styles.quizWrapper}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentIndex + 1) / totalQuestions) * 100}%` },
              ]}
            />
          </View>

          <ScrollView contentContainerStyle={styles.quizScrollContent} showsVerticalScrollIndicator={false}>
            {/* Meta Row */}
            <View style={styles.questionMetaRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{currentQuestion.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.counterText}>
                Question <Text style={{ color: Colors.primary, fontWeight: '700' }}>{currentIndex + 1}</Text> of {totalQuestions}
              </Text>
            </View>

            {/* Scenario Card */}
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioText}>{currentQuestion.scenario}</Text>
            </View>

            <Text style={styles.optionsPrompt}>Select the most effective leadership decision:</Text>

            {/* Options List */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelectOption(opt.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? (
                        <View style={styles.radioDot} />
                      ) : (
                        <Text style={styles.radioLabelText}>{opt.id}</Text>
                      )}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky Bottom Navigation Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrev, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={currentIndex === 0 ? Colors.textMuted : Colors.textPrimary} />
              <Text style={[styles.navBtnText, currentIndex === 0 && { color: Colors.textMuted }]}>Previous</Text>
            </TouchableOpacity>

            {currentIndex < totalQuestions - 1 ? (
              <TouchableOpacity style={[styles.navBtn, styles.navBtnNext]} onPress={handleNext} activeOpacity={0.8}>
                <Text style={styles.navBtnNextText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#070C12" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.navBtn, styles.navBtnSubmit]} onPress={handleSubmitQuiz} activeOpacity={0.8}>
                <Ionicons name="checkmark-done" size={18} color="#070C12" />
                <Text style={styles.navBtnSubmitText}>Submit Assessment</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ========================================================
          SCREEN 3: ASSESSMENT RESULTS & DETAILED REVIEW
      ======================================================== */}
      {mode === 'RESULTS' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {(() => {
            const verdict = getLeadershipVerdict(percentage);
            return (
              <View style={styles.resultsHero}>
                <View style={[styles.verdictPill, { backgroundColor: `${verdict.color}15`, borderColor: verdict.color }]}>
                  <Text style={[styles.verdictPillText, { color: verdict.color }]}>{verdict.badge}</Text>
                </View>

                <Text style={styles.resultsTitle}>{verdict.title}</Text>
                <Text style={styles.resultsSub}>{selectedPaper.title}</Text>

                <View style={styles.scoreCircleWrapper}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreBigNumber}>{score}</Text>
                    <Text style={styles.scoreDivider}>/ {totalQuestions}</Text>
                    <Text style={styles.scorePercentageText}>{percentage}%</Text>
                  </View>
                </View>

                <View style={styles.resultsActionRow}>
                  <Button
                    title="Retake This Paper"
                    variant="secondary"
                    onPress={() => handleStartPaper(selectedPaper)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Choose Another Paper"
                    onPress={() => setMode('SELECT_PAPER')}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            );
          })()}

          {/* Detailed Question Review List */}
          <Text style={styles.sectionHeading}>Detailed Answers & Explanations ({totalQuestions})</Text>

          {resultsReview.map((item, idx) => (
            <View key={item.question.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewStatusBadge, item.isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                  <Ionicons
                    name={item.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={item.isCorrect ? '#00E676' : '#FF5252'}
                  />
                  <Text style={[styles.reviewStatusText, { color: item.isCorrect ? '#00E676' : '#FF5252' }]}>
                    {item.isCorrect ? 'CORRECT' : item.userAnswer ? 'INCORRECT' : 'UNANSWERED'}
                  </Text>
                </View>
                <Text style={styles.reviewQNumber}>Q{idx + 1}</Text>
              </View>

              <Text style={styles.reviewScenario}>{item.question.scenario}</Text>

              {/* Options breakdown */}
              <View style={styles.reviewOptionsList}>
                {item.question.options.map((opt) => {
                  const isUserPick = item.userAnswer === opt.id;
                  const isRightOption = item.question.correctOption === opt.id;

                  let border = 'transparent';
                  let bg = 'rgba(255, 255, 255, 0.03)';
                  if (isRightOption) {
                    border = '#00E676';
                    bg = 'rgba(0, 230, 118, 0.08)';
                  } else if (isUserPick && !item.isCorrect) {
                    border = '#FF5252';
                    bg = 'rgba(255, 82, 82, 0.08)';
                  }

                  return (
                    <View key={opt.id} style={[styles.reviewOptionRow, { borderColor: border, backgroundColor: bg }]}>
                      <Text style={[styles.reviewOptId, isRightOption && { color: '#00E676' }, isUserPick && !item.isCorrect && { color: '#FF5252' }]}>
                        {opt.id}.
                      </Text>
                      <Text style={styles.reviewOptText}>{opt.text}</Text>
                      {isRightOption && <Ionicons name="checkmark" size={16} color="#00E676" style={{ marginLeft: 6 }} />}
                      {isUserPick && !item.isCorrect && <Ionicons name="close" size={16} color="#FF5252" style={{ marginLeft: 6 }} />}
                    </View>
                  );
                })}
              </View>

              {/* Rationale explanation */}
              <View style={styles.explanationBox}>
                <View style={styles.explanationTitleRow}>
                  <Ionicons name="bulb-outline" size={15} color={Colors.primary} />
                  <Text style={styles.explanationTitle}>Enterprise Leadership Rationale</Text>
                </View>
                <Text style={styles.explanationText}>{item.question.explanation}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ========================================================
          QUESTION PALETTE MODAL (Jump to any question 1 - 40)
      ======================================================== */}
      <Modal visible={paletteVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.paletteModalContent}>
            <View style={styles.paletteModalHeader}>
              <Text style={styles.paletteModalTitle}>Question Palette ({totalQuestions})</Text>
              <TouchableOpacity onPress={() => setPaletteVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>Answered ({answeredCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#1A2332' }]} />
                <Text style={styles.legendText}>Pending ({totalQuestions - answeredCount})</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.paletteGrid} showsVerticalScrollIndicator={false}>
              {selectedPaper.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = currentIndex === idx;

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.paletteGridItem,
                      isAnswered && styles.paletteGridItemAnswered,
                      isCurrent && styles.paletteGridItemCurrent,
                    ]}
                    onPress={() => handleJumpToQuestion(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paletteGridText, isAnswered && styles.paletteGridTextAnswered, isCurrent && styles.paletteGridTextCurrent]}>
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              title={`Submit Assessment (${answeredCount}/${totalQuestions})`}
              onPress={() => {
                setPaletteVisible(false);
                handleSubmitQuiz();
              }}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  timerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  paletteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  paletteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerHero: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    marginBottom: Spacing.sm,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  randomBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#070C12',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  paperCard: {
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Spacing.md,
  },
  paperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paperNumberBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  paperNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  levelIntern: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: '#00E676',
  },
  levelMid: {
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderColor: '#FFB300',
  },
  levelEnterprise: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderColor: Colors.primary,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paperTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  paperDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerItemText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  startArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startArrowText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Quiz active mode styles
  quizWrapper: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1E293B',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  quizScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  counterText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scenarioCard: {
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Spacing.lg,
  },
  scenarioText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    fontWeight: '500',
  },
  optionsPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0D141E',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    gap: 12,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#070C12',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  navBtnPrev: {
    flex: 1,
    backgroundColor: '#0F1722',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  navBtnNext: {
    flex: 1.5,
    backgroundColor: Colors.primary,
  },
  navBtnSubmit: {
    flex: 1.5,
    backgroundColor: '#00E676',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  navBtnNextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070C12',
  },
  navBtnSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070C12',
  },

  // Results Styles
  resultsHero: {
    alignItems: 'center',
    backgroundColor: '#0F1722',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  verdictPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  verdictPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultsSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  scoreCircleWrapper: {
    marginBottom: Spacing.lg,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#070C12',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBigNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primary,
    lineHeight: 46,
  },
  scoreDivider: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  scorePercentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
    marginTop: 2,
  },
  resultsActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },

  // Review Card styles
  reviewCard: {
    backgroundColor: '#0D141E',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeCorrect: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  badgeWrong: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  reviewStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reviewQNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  reviewScenario: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  reviewOptionsList: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  reviewOptId: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  reviewOptText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  explanationBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Modal Palette styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  paletteModalContent: {
    backgroundColor: '#0F1722',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  paletteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  paletteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  paletteGridItem: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#1A2332',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  paletteGridItemAnswered: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paletteGridItemCurrent: {
    borderWidth: 2,
    borderColor: '#FFB300',
  },
  paletteGridText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  paletteGridTextAnswered: {
    color: '#070C12',
  },
  paletteGridTextCurrent: {
    fontWeight: '900',
  },
});
