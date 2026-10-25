/**
 * AI Mentor - Enterprise Multi-Language Technical Assessment & Coding Workspace
 * Features:
 * - 6 Supported Languages: Python 3, JavaScript, TypeScript, Java, Go (Golang), PHP
 * - 5 Randomized algorithmic questions (HackerRank / LeetCode style)
 * - Safe in-sandbox multi-language code runner with sample and hidden test case evaluation
 * - Monospaced code editor with line numbers, syntax gutter, and console output
 * - Comprehensive AI diagnostic report with score, pass/fail, mistake analysis, and model solutions
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { useResponsive } from '../src/hooks/useResponsive';
import { api } from '../src/services/api';
import { useNotifications } from '../src/context';

type ScreenView = 'launcher' | 'assessment' | 'review';

export const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python 3', ext: '.py', icon: 'logo-python', tag: '🐍 Python' },
  { id: 'javascript', label: 'JavaScript', ext: '.js', icon: 'logo-javascript', tag: '⚡ JS' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts', icon: 'code-slash', tag: '🔷 TS' },
  { id: 'java', label: 'Java', ext: '.java', icon: 'cafe', tag: '☕ Java' },
  { id: 'go', label: 'Go (Golang)', ext: '.go', icon: 'flash', tag: '🚀 Go' },
  { id: 'php', label: 'PHP', ext: '.php', icon: 'server', tag: '🐘 PHP' },
] as const;

export const CAREER_ROLES = [
  { id: 'Software Engineer', label: 'Software Engineer', icon: 'code-slash', tag: 'Full Stack / Backend', desc: 'Core DSA, logic & algorithmic problem solving' },
  { id: 'DevOps', label: 'DevOps & Cloud', icon: 'cloud-done', tag: 'Infra & Networks', desc: 'IPv4, log analysis, semver & automation scripts' },
  { id: 'QA Engineer', label: 'QA & Automation', icon: 'shield-checkmark', tag: 'Testing & QA', desc: 'API schema assertions, boundary values & test slugging' },
] as const;

export const EXPERIENCE_LEVELS = [
  { id: 'Internship', label: 'Intern / Trainee', icon: 'school', tag: 'Foundational', desc: 'Practical logic, strings & math (No overly complex DSA)' },
  { id: 'Junior', label: 'Junior / Associate', icon: 'trending-up', tag: '1-3 Years', desc: 'Core logic, edge case testing & common patterns' },
  { id: 'Senior', label: 'Mid-Senior / Lead', icon: 'ribbon', tag: '3+ Years', desc: 'Algorithmic optimization, scale & system design' },
] as const;

type LanguageId = 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'php';
type RoleId = 'Software Engineer' | 'DevOps' | 'QA Engineer';
type LevelId = 'Internship' | 'Junior' | 'Senior';

interface QuestionItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  role?: string;
  level?: string;
  description: string;
  starterCode: string;
  starterTemplates?: Record<string, string>;
  optimalSolutions?: Record<string, string>;
  functionName: string;
  sampleTestCases: any[];
  hints: string[];
}

interface TestResult {
  testCaseIndex: number;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  executionTimeMs: number;
  logs: string[];
  error?: string;
  isHidden?: boolean;
}

export default function CodingChallengeScreen() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  // Screen View State
  const [currentView, setCurrentView] = useState<ScreenView>('launcher');
  const [loading, setLoading] = useState(false);

  // Language Preferences
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>('python');
  const [questionLanguages, setQuestionLanguages] = useState<Record<string, LanguageId>>({});
  const [showLangModal, setShowLangModal] = useState(false);

  // Role & Level Preferences
  const [selectedRole, setSelectedRole] = useState<RoleId>('Software Engineer');
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('Junior');
  const [practiceRoleFilter, setPracticeRoleFilter] = useState<string>('All');
  const [practiceLevelFilter, setPracticeLevelFilter] = useState<string>('All');
  const [assessmentRole, setAssessmentRole] = useState<string>('Software Engineer');
  const [assessmentLevel, setAssessmentLevel] = useState<string>('Junior');

  // Challenge List (for Practice mode)
  const [challenges, setChallenges] = useState<any[]>([]);

  // Assessment State
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userCodes, setUserCodes] = useState<Record<string, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, 'unanswered' | 'attempted' | 'passed' | 'failed'>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(90 * 60); // 90 minutes default
  const timerRef = useRef<any>(null);

  // Testing & Execution State
  const [activeTab, setActiveTab] = useState<'sample' | 'results' | 'console'>('sample');
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [executionSummary, setExecutionSummary] = useState<string | null>(null);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Review State
  const [assessmentReview, setAssessmentReview] = useState<any>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [showHintModal, setShowHintModal] = useState(false);

  useEffect(() => {
    loadChallengeList();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown during assessment
  useEffect(() => {
    if (currentView === 'assessment') {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView]);

  const loadChallengeList = async () => {
    try {
      const res = await api.getCodingChallenges();
      if (res.success && res.data?.challenges) {
        setChallenges(res.data.challenges);
      }
    } catch (err) {
      console.warn('Failed to load challenges:', err);
    }
  };

  /**
   * Starts a randomized 5-question technical interview assessment tailored to Role, Level & Language
   */
  const handleStartAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.startTechnicalAssessment({
        count: 5,
        role: selectedRole,
        level: selectedLevel,
        language: selectedLanguage,
      });
      if (res.success && res.data) {
        const { assessmentId: aId, questions: qs, timeLimitMinutes } = res.data;
        setAssessmentId(aId);
        setQuestions(qs);
        setAssessmentRole(selectedRole);
        setAssessmentLevel(selectedLevel);
        setCurrentQuestionIndex(0);

        const initialCodes: Record<string, string> = {};
        const initialStatuses: Record<string, any> = {};
        const initialLangs: Record<string, LanguageId> = {};

        qs.forEach((q: QuestionItem) => {
          const starter = q.starterTemplates?.[selectedLanguage] || q.starterCode;
          initialCodes[q.id] = starter;
          initialStatuses[q.id] = 'unanswered';
          initialLangs[q.id] = selectedLanguage;
        });

        setUserCodes(initialCodes);
        setQuestionStatuses(initialStatuses);
        setQuestionLanguages(initialLangs);
        setTimeRemainingSeconds((timeLimitMinutes || 90) * 60);

        setTestResults([]);
        setConsoleLogs([]);
        setExecutionSummary(null);
        setActiveTab('sample');
        setCurrentView('assessment');
      } else {
        Alert.alert('Error', res.message || 'Could not start technical assessment.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentLang: LanguageId = currentQuestion ? (questionLanguages[currentQuestion.id] || selectedLanguage) : selectedLanguage;
  const currentCode = currentQuestion ? userCodes[currentQuestion.id] || currentQuestion.starterCode : '';

  const handleCodeChange = (newCode: string) => {
    if (!currentQuestion) return;
    setUserCodes(prev => ({ ...prev, [currentQuestion.id]: newCode }));
    if (questionStatuses[currentQuestion.id] === 'unanswered') {
      setQuestionStatuses(prev => ({ ...prev, [currentQuestion.id]: 'attempted' }));
    }
  };

  /**
   * Switch programming language for current question
   */
  const handleSwitchLanguage = (newLang: LanguageId) => {
    if (!currentQuestion) return;
    if (currentLang === newLang) {
      setShowLangModal(false);
      return;
    }

    const starter = currentQuestion.starterTemplates?.[newLang] || currentQuestion.starterCode;
    Alert.alert(
      `Switch Language to ${newLang.toUpperCase()}?`,
      `Would you like to load the official ${newLang.toUpperCase()} starter template for this problem?`,
      [
        { text: 'Keep Current Code', style: 'cancel', onPress: () => {
          setQuestionLanguages(prev => ({ ...prev, [currentQuestion.id]: newLang }));
          setShowLangModal(false);
        }},
        {
          text: 'Load Template',
          onPress: () => {
            setQuestionLanguages(prev => ({ ...prev, [currentQuestion.id]: newLang }));
            setUserCodes(prev => ({ ...prev, [currentQuestion.id]: starter }));
            setTestResults([]);
            setExecutionSummary(null);
            setShowLangModal(false);
          },
        },
      ]
    );
  };

  /**
   * Run Sample Test Cases in current language
   */
  const handleRunSampleCode = async () => {
    if (!currentQuestion) return;
    setRunningTests(true);
    setExecutionSummary(`Executing in ${currentLang.toUpperCase()} sandbox...`);
    try {
      const res = await api.runSampleCode(currentQuestion.id, currentCode, currentLang);
      if (res.success && res.data) {
        const { allPassed, passedTests, totalTests, results, executionTimeMs } = res.data;
        setTestResults(results || []);
        const logs = (results || []).flatMap((r: any) => r.logs || []);
        setConsoleLogs(logs);

        setExecutionSummary(
          allPassed
            ? `✓ [${currentLang.toUpperCase()}] All ${passedTests}/${totalTests} sample test cases passed in ${executionTimeMs}ms`
            : `⚠️ [${currentLang.toUpperCase()}] ${passedTests}/${totalTests} sample test cases passed (${executionTimeMs}ms)`
        );

        setQuestionStatuses(prev => ({
          ...prev,
          [currentQuestion.id]: allPassed ? 'passed' : 'failed',
        }));
        setActiveTab('results');
      } else {
        setExecutionSummary(`Execution failed: ${res.message}`);
        setActiveTab('results');
      }
    } catch (err: any) {
      setExecutionSummary(`Error: ${err.message}`);
      setActiveTab('results');
    } finally {
      setRunningTests(false);
    }
  };

  /**
   * Run All Test Cases (Sample + Hidden Edge Cases)
   */
  const handleRunAllTests = async () => {
    if (!currentQuestion) return;
    setRunningTests(true);
    setExecutionSummary(`Running complete ${currentLang.toUpperCase()} test suite (including hidden edge cases)...`);
    try {
      const res = await api.runAllCode(currentQuestion.id, currentCode, currentLang);
      if (res.success && res.data) {
        const { allPassed, passedTests, totalTests, results, executionTimeMs } = res.data;
        setTestResults(results || []);
        const logs = (results || []).flatMap((r: any) => r.logs || []);
        setConsoleLogs(logs);

        setExecutionSummary(
          allPassed
            ? `🎉 Perfect! All ${passedTests}/${totalTests} test cases passed (${executionTimeMs}ms)`
            : `❌ ${passedTests}/${totalTests} test cases passed. Edge cases failed in ${currentLang.toUpperCase()}.`
        );

        setQuestionStatuses(prev => ({
          ...prev,
          [currentQuestion.id]: allPassed ? 'passed' : 'failed',
        }));
        setActiveTab('results');
      } else {
        setExecutionSummary(`Execution error: ${res.message}`);
        setActiveTab('results');
      }
    } catch (err: any) {
      setExecutionSummary(`Error: ${err.message}`);
      setActiveTab('results');
    } finally {
      setRunningTests(false);
    }
  };

  /**
   * Submit Full Assessment
   */
  const handleConfirmSubmit = () => {
    const answeredCount = Object.values(questionStatuses).filter(s => s !== 'unanswered').length;
    Alert.alert(
      'Submit Technical Assessment',
      `You have completed ${answeredCount} of ${questions.length} questions.\n\nAre you ready to submit for your enterprise evaluation?`,
      [
        { text: 'Keep Coding', style: 'cancel' },
        { text: 'Submit Now', style: 'destructive', onPress: performFinalSubmit },
      ]
    );
  };

  const handleAutoSubmit = () => {
    if (assessmentId) {
      Alert.alert('Time Expired (90 Minutes)', 'Technical assessment time has elapsed. Submitting answers automatically.');
      performFinalSubmit();
    } else {
      Alert.alert('Time Expired (10 Minutes)', '10-minute time limit for this coding challenge has elapsed. Evaluating all test cases automatically.');
      handleRunAllTests();
    }
  };

  const performFinalSubmit = async () => {
    if (!assessmentId) return;
    setSubmittingAssessment(true);
    try {
      const answers = questions.map(q => ({
        challengeId: q.id,
        code: userCodes[q.id] || q.starterCode,
        language: questionLanguages[q.id] || selectedLanguage,
      }));

      const res = await api.submitTechnicalAssessment(assessmentId, answers);
      if (res.success && res.data) {
        setAssessmentReview(res.data);
        addNotification(
          'Coding Assessment Evaluated',
          `Your technical assessment is evaluated! Overall Score: ${res.data.overallScore || 0}% (${res.data.grade || 'Completed'}).`,
          'coding',
          '/coding-challenge'
        );
        setCurrentView('review');
      } else {
        Alert.alert('Submission Error', res.message || 'Failed to evaluate assessment.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network submission error.');
    } finally {
      setSubmittingAssessment(false);
    }
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

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return Colors.success;
      case 'medium':
        return Colors.warning;
      case 'hard':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return Colors.success;
      case 'failed':
        return Colors.error;
      case 'attempted':
        return Colors.warning;
      default:
        return Colors.textMuted;
    }
  };

  const toggleSolution = (challengeId: string) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }));
  };

  const getFileName = (lang: string) => {
    switch (lang) {
      case 'python': return 'solution.py';
      case 'javascript': return 'solution.js';
      case 'typescript': return 'solution.ts';
      case 'java': return 'Solution.java';
      case 'go': return 'solution.go';
      case 'php': return 'solution.php';
      default: return 'solution.js';
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: LAUNCHER & LANGUAGE SELECTION
  // -------------------------------------------------------------
  if (currentView === 'launcher') {
    const filteredChallenges = challenges.filter(ch => {
      const roleMatch = practiceRoleFilter === 'All' || !ch.role || ch.role === 'All' || ch.role === practiceRoleFilter;
      const levelMatch = practiceLevelFilter === 'All' || !ch.level || ch.level === 'All' || ch.level === practiceLevelFilter;
      return roleMatch && levelMatch;
    });

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Technical Assessment" showBack />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ResponsiveContainer maxWidth={1080}>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadge}>
                <Ionicons name="terminal" size={14} color={Colors.primary} />
                <Text style={styles.heroBadgeText}>ENTERPRISE TECHNICAL ASSESSMENT</Text>
              </View>

              <Text style={styles.heroTitle}>Tailored Coding Assessment</Text>
              <Text style={styles.heroSubtitle}>
                Select your career track and experience level. Assessment questions are strictly calibrated so interns receive foundational logic without complex DSA, while DevOps and QA engineers get practical domain tasks.
              </Text>

              {/* 1. Track / Career Role Selector */}
              <View style={styles.selectorSection}>
                <View style={styles.selectorSectionHeader}>
                  <Ionicons name="briefcase-outline" size={15} color={Colors.primary} />
                  <Text style={styles.selectorSectionTitle}>1. Target Role & Domain Track</Text>
                </View>
                <View style={[styles.roleGrid, isLargeScreen && styles.rolesDesktopGrid]}>
                  {CAREER_ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <TouchableOpacity
                        key={role.id}
                        style={[
                          styles.roleCard,
                          isLargeScreen && styles.roleCardDesktop,
                          isSelected && styles.roleCardSelected,
                        ]}
                        onPress={() => setSelectedRole(role.id as RoleId)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleCardHeader}>
                          <View style={[styles.roleIconBox, isSelected && styles.roleIconBoxSelected]}>
                            <Ionicons
                              name={role.icon as any}
                              size={18}
                              color={isSelected ? Colors.background : Colors.primary}
                            />
                          </View>
                          <Text style={[styles.roleTag, isSelected && styles.roleTagSelected]}>{role.tag}</Text>
                        </View>
                        <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>{role.label}</Text>
                        <Text style={[styles.roleDesc, isSelected && styles.roleDescSelected]}>{role.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Experience Level Selector */}
              <View style={styles.selectorSection}>
                <View style={styles.selectorSectionHeader}>
                  <Ionicons name="school-outline" size={15} color={Colors.warning} />
                  <Text style={styles.selectorSectionTitle}>2. Experience Level</Text>
                </View>
                <View style={[styles.levelRow, isLargeScreen && styles.levelsDesktopGrid]}>
                  {EXPERIENCE_LEVELS.map(lvl => {
                    const isSelected = selectedLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={lvl.id}
                        style={[
                          styles.levelCard,
                          isLargeScreen && styles.levelCardDesktop,
                          isSelected && styles.levelCardSelected,
                        ]}
                        onPress={() => setSelectedLevel(lvl.id as LevelId)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ionicons
                            name={lvl.icon as any}
                            size={16}
                            color={isSelected ? Colors.background : Colors.warning}
                          />
                          <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected]}>{lvl.label}</Text>
                        </View>
                        <Text style={[styles.levelDesc, isSelected && styles.levelDescSelected]}>{lvl.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            {/* 3. Programming Language Selector */}
            <View style={styles.selectorSection}>
              <View style={styles.selectorSectionHeader}>
                <Ionicons name="code-slash-outline" size={15} color="#A78BFA" />
                <Text style={styles.selectorSectionTitle}>3. Preferred Programming Language</Text>
              </View>
              <View style={styles.langChipsRow}>
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[styles.langChip, isSelected && styles.langChipSelected]}
                      onPress={() => setSelectedLanguage(lang.id as LanguageId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={lang.icon as any}
                        size={16}
                        color={isSelected ? Colors.background : Colors.textPrimary}
                      />
                      <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dynamic Assessment Focus Callout */}
            <View style={styles.focusCallout}>
              <Ionicons
                name={selectedLevel === 'Internship' ? 'sparkles' : 'information-circle-outline'}
                size={18}
                color={selectedLevel === 'Internship' ? Colors.success : Colors.primary}
              />
              <Text style={styles.focusCalloutText}>
                {selectedLevel === 'Internship'
                  ? '🎓 INTERNSHIP FOCUS: Questions are strictly calibrated to foundational logic, string manipulation, and arithmetic. No overly complex dynamic programming or hard algorithmic puzzles.'
                  : selectedRole === 'DevOps'
                  ? '☁️ DEVOPS FOCUS: Practical infrastructure tasks including IPv4 validation, HTTP status log parsing, semver comparison, and automation scripts.'
                  : selectedRole === 'QA Engineer'
                  ? '🛡️ QA AUTOMATION FOCUS: Practical validation tasks including boundary partitioning, API schema assertion, test slug generation, and unit tests.'
                  : '⚡ SOFTWARE ENGINEER FOCUS: Algorithmic data structures, logic patterns, and edge case optimization tailored to your level.'}
              </Text>
            </View>

            {/* Feature Highlights */}
            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <Ionicons name="code-working-outline" size={16} color={Colors.primary} />
                <Text style={styles.featureText}>{selectedLanguage.toUpperCase()} Runner</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="dice-outline" size={16} color={Colors.success} />
                <Text style={styles.featureText}>5 Tailored Questions</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.warning} />
                <Text style={styles.featureText}>Boundary Edge Tests</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="analytics-outline" size={16} color="#A78BFA" />
                <Text style={styles.featureText}>Diagnostic Report</Text>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.primaryLaunchBtn}
              onPress={handleStartAssessment}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color={Colors.background} />
                  <Text style={styles.primaryLaunchBtnText}>
                    Start {selectedRole} Assessment • {selectedLevel} ({selectedLanguage.toUpperCase()})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Individual Practice Drills Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Or Practice Individual Problems</Text>
            <Text style={styles.sectionSubtitle}>{challenges.length} Algorithmic & Domain Tasks Available</Text>
          </View>

          {/* Role Filter Chips for Practice */}
          <View style={styles.filterChipsRow}>
            {['All', 'Software Engineer', 'DevOps', 'QA Engineer'].map(r => {
              const active = practiceRoleFilter === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setPracticeRoleFilter(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Level Filter Chips for Practice */}
          <View style={styles.filterChipsRow}>
            {['All', 'Internship', 'Junior', 'Senior'].map(lvl => {
              const active = practiceLevelFilter === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setPracticeLevelFilter(lvl)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredChallenges.length === 0 ? (
            <View style={styles.emptyFilteredBox}>
              <Text style={styles.emptyFilteredText}>No challenges found matching this filter.</Text>
            </View>
          ) : (
            filteredChallenges.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.challengeCard}
                onPress={async () => {
                  setLoading(true);
                  try {
                    const res = await api.getChallengeBySlug(ch.slug, selectedLanguage);
                    if (res.success && res.data) {
                      const qData = res.data;
                      const starter = qData.starterTemplates?.[selectedLanguage] || qData.starterCode;
                      setQuestions([
                        {
                          id: qData.id,
                          title: qData.title,
                          slug: qData.slug,
                          category: qData.category,
                          difficulty: qData.difficulty,
                          role: qData.role || 'Software Engineer',
                          level: qData.level || 'Junior',
                          description: qData.description,
                          starterCode: starter,
                          starterTemplates: qData.starterTemplates,
                          optimalSolutions: qData.optimalSolutions,
                          functionName: qData.functionName || 'solution',
                          sampleTestCases: qData.sampleTestCases || [],
                          hints: qData.hints ? (typeof qData.hints === 'string' ? JSON.parse(qData.hints) : qData.hints) : [],
                        },
                      ]);
                      setCurrentQuestionIndex(0);
                      setUserCodes({ [qData.id]: starter });
                      setQuestionStatuses({ [qData.id]: 'unanswered' });
                      setQuestionLanguages({ [qData.id]: selectedLanguage });
                      setAssessmentId(null);
                      setTimeRemainingSeconds(10 * 60); // 10 minutes limit for individual challenge
                      setCurrentView('assessment');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Text style={styles.challengeTitle}>{ch.title}</Text>
                    {ch.role && ch.role !== 'All' && (
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{ch.role}</Text>
                      </View>
                    )}
                    {ch.level && ch.level !== 'All' && (
                      <View style={[styles.miniTag, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                        <Text style={[styles.miniTagText, { color: Colors.warning }]}>{ch.level}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.challengeMeta}>{ch.category} • Acceptance: {ch.acceptanceRate}</Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: `${getDifficultyColor(ch.difficulty)}20` }]}>
                  <Text style={[styles.diffText, { color: getDifficultyColor(ch.difficulty) }]}>{ch.difficulty}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE ASSESSMENT / HACKERRANK CODING WORKSPACE
  // -------------------------------------------------------------
  if (currentView === 'assessment') {
    const lines = (currentCode || '').split('\n');

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Assessment Top Bar */}
        <View style={styles.assessmentTopBar}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => {
              Alert.alert('Exit Assessment?', 'Your current progress will not be submitted.', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => setCurrentView('launcher') },
              ]);
            }}
          >
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Assessment Track Badge */}
          {assessmentId && (
            <View style={styles.assessmentTrackBadge}>
              <Text style={styles.assessmentTrackBadgeText}>
                {assessmentRole} • {assessmentLevel}
              </Text>
            </View>
          )}

          {/* Timer Display */}
          <View style={styles.timerBox}>
            <Ionicons name="time-outline" size={16} color={timeRemainingSeconds < 300 ? Colors.error : Colors.primary} />
            <Text style={[styles.timerText, timeRemainingSeconds < 300 && { color: Colors.error }]}>
              {formatTimer(timeRemainingSeconds)}
            </Text>
          </View>

          {/* Submit Assessment Button */}
          {assessmentId ? (
            <TouchableOpacity
              style={styles.submitTopBtn}
              onPress={handleConfirmSubmit}
              disabled={submittingAssessment}
            >
              {submittingAssessment ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={14} color={Colors.background} />
                  <Text style={styles.submitTopBtnText}>Finish & Submit</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* 5-Question Navigator Bar */}
        {questions.length > 1 && (
          <View style={styles.questionNavScroll}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questionNavRow}>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const status = questionStatuses[q.id] || 'unanswered';
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.questionPill,
                      isCurrent && styles.questionPillActive,
                      { borderColor: isCurrent ? Colors.primary : '#1E2A3A' },
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(idx);
                      setTestResults([]);
                      setExecutionSummary(null);
                      setActiveTab('sample');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.statusIndicatorDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.questionPillText, isCurrent && styles.questionPillTextActive]}>
                      Q{idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.workspaceScroll} showsVerticalScrollIndicator={false}>
          {/* Question Title & Meta */}
          <View style={styles.problemHeader}>
            <View style={styles.metaBadgeRow}>
              <View style={[styles.diffBadge, { backgroundColor: `${getDifficultyColor(currentQuestion?.difficulty)}20` }]}>
                <Text style={[styles.diffText, { color: getDifficultyColor(currentQuestion?.difficulty) }]}>
                  {currentQuestion?.difficulty || 'Easy'}
                </Text>
              </View>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{currentQuestion?.category || 'Algorithm'}</Text>
              </View>
              {currentQuestion?.role && currentQuestion.role !== 'All' && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{currentQuestion.role}</Text>
                </View>
              )}
              {currentQuestion?.level && currentQuestion.level !== 'All' && (
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>{currentQuestion.level}</Text>
                </View>
              )}

              {/* Language Switcher Pill */}
              <TouchableOpacity
                style={styles.langPillBadge}
                onPress={() => setShowLangModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.langPillBadgeText}>{currentLang.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.primary} />
              </TouchableOpacity>

              {currentQuestion?.hints?.length > 0 && (
                <TouchableOpacity
                  style={styles.hintTrigger}
                  onPress={() => setShowHintModal(true)}
                >
                  <Ionicons name="bulb-outline" size={14} color={Colors.warning} />
                  <Text style={styles.hintTriggerText}>Hint</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.problemTitle}>{currentQuestion?.title}</Text>
            <Text style={styles.problemDesc}>{currentQuestion?.description}</Text>
          </View>

          {/* HackerRank Code Editor Window */}
          <View style={styles.editorFrame}>
            <View style={styles.editorHeader}>
              <View style={styles.macControls}>
                <View style={[styles.macDot, { backgroundColor: '#FF5F56' }]} />
                <View style={[styles.macDot, { backgroundColor: '#FFBD2E' }]} />
                <View style={[styles.macDot, { backgroundColor: '#27C93F' }]} />
              </View>

              {/* File Tab */}
              <TouchableOpacity
                style={styles.tabPill}
                onPress={() => setShowLangModal(true)}
              >
                <Ionicons name="code-slash" size={12} color={Colors.primary} />
                <Text style={styles.tabPillText}>{getFileName(currentLang)}</Text>
              </TouchableOpacity>

              {/* Reset Code */}
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  const defaultStarter = currentQuestion?.starterTemplates?.[currentLang] || currentQuestion?.starterCode || '';
                  Alert.alert('Reset Code', `Revert back to ${currentLang.toUpperCase()} starter template?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => handleCodeChange(defaultStarter),
                    },
                  ]);
                }}
              >
                <Ionicons name="refresh" size={12} color={Colors.textMuted} />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Code Input Area with Line Numbers */}
            <View style={styles.editorBody}>
              <View style={styles.gutter}>
                {lines.map((_, i) => (
                  <Text key={i} style={styles.gutterText}>
                    {i + 1}
                  </Text>
                ))}
              </View>
              <TextInput
                style={styles.codeArea}
                multiline
                value={currentCode}
                onChangeText={handleCodeChange}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                placeholder={`// Write your ${currentLang.toUpperCase()} solution here`}
                placeholderTextColor="#475569"
              />
            </View>
          </View>

          {/* Console / Test Case Tabs */}
          <View style={styles.testSection}>
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'sample' && styles.tabButtonActive]}
                onPress={() => setActiveTab('sample')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'sample' && styles.tabButtonTextActive]}>
                  Sample Cases ({currentQuestion?.sampleTestCases?.length || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'results' && styles.tabButtonActive]}
                onPress={() => setActiveTab('results')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'results' && styles.tabButtonTextActive]}>
                  Test Results {testResults.length > 0 && `(${testResults.filter(r => r.passed).length}/${testResults.length})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'console' && styles.tabButtonActive]}
                onPress={() => setActiveTab('console')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'console' && styles.tabButtonTextActive]}>
                  Console Logs {consoleLogs.length > 0 && `(${consoleLogs.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Sample Cases */}
            {activeTab === 'sample' && (
              <View style={styles.tabContentBox}>
                {currentQuestion?.sampleTestCases?.map((tc, idx) => (
                  <View key={idx} style={styles.sampleCaseCard}>
                    <Text style={styles.caseIndexTitle}>Case {idx + 1}</Text>
                    <View style={styles.keyValueRow}>
                      <Text style={styles.caseKey}>Input:</Text>
                      <Text style={styles.caseVal}>{JSON.stringify(tc.input)}</Text>
                    </View>
                    <View style={styles.keyValueRow}>
                      <Text style={styles.caseKey}>Expected:</Text>
                      <Text style={[styles.caseVal, { color: Colors.primary }]}>{JSON.stringify(tc.expected)}</Text>
                    </View>
                    {tc.explanation && (
                      <Text style={styles.caseExplanation}>💡 {tc.explanation}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Tab 2: Test Results */}
            {activeTab === 'results' && (
              <View style={styles.tabContentBox}>
                {executionSummary && (
                  <View style={styles.summaryBar}>
                    <Text style={styles.summaryBarText}>{executionSummary}</Text>
                  </View>
                )}

                {testResults.length === 0 ? (
                  <Text style={styles.emptyResultsText}>
                    Click 'Run Code' or 'Run All Tests' below to execute your code in {currentLang.toUpperCase()}.
                  </Text>
                ) : (
                  testResults.map((res, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.resultCard,
                        res.passed ? styles.resultCardPassed : styles.resultCardFailed,
                      ]}
                    >
                      <View style={styles.resultHeader}>
                        <View style={styles.resultBadge}>
                          <Ionicons
                            name={res.passed ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={res.passed ? Colors.success : Colors.error}
                          />
                          <Text style={[styles.resultTitle, { color: res.passed ? Colors.success : Colors.error }]}>
                            {res.isHidden ? `Hidden Edge Case ${idx + 1}` : `Test Case ${idx + 1}`}: {res.passed ? 'PASSED' : 'FAILED'}
                          </Text>
                        </View>
                        <Text style={styles.execTimeText}>{res.executionTimeMs}ms</Text>
                      </View>

                      {!res.isHidden ? (
                        <>
                          <View style={styles.keyValueRow}>
                            <Text style={styles.caseKey}>Input:</Text>
                            <Text style={styles.caseVal}>{JSON.stringify(res.input)}</Text>
                          </View>
                          <View style={styles.keyValueRow}>
                            <Text style={styles.caseKey}>Expected:</Text>
                            <Text style={[styles.caseVal, { color: Colors.primary }]}>{JSON.stringify(res.expected)}</Text>
                          </View>
                          <View style={styles.keyValueRow}>
                            <Text style={styles.caseKey}>Actual:</Text>
                            <Text style={[styles.caseVal, { color: res.passed ? Colors.success : Colors.error }]}>
                              {JSON.stringify(res.actual)}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.hiddenNotice}>
                          {res.passed ? '✓ Output matched hidden criteria.' : '❌ Edge case failure. Check boundary limits.'}
                        </Text>
                      )}

                      {res.error && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{res.error}</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Tab 3: Console Logs */}
            {activeTab === 'console' && (
              <View style={styles.tabContentBox}>
                {consoleLogs.length === 0 ? (
                  <Text style={styles.emptyResultsText}>No console output captured from {currentLang.toUpperCase()}.</Text>
                ) : (
                  <View style={styles.consoleBox}>
                    {consoleLogs.map((log, i) => (
                      <Text key={i} style={styles.consoleLine}>
                        &gt; {log}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Action Execution Buttons Row */}
          <View style={styles.actionRow}>
            {/* Run Code Button */}
            <TouchableOpacity
              style={styles.runCodeBtn}
              onPress={handleRunSampleCode}
              disabled={runningTests}
              activeOpacity={0.8}
            >
              {runningTests ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="play" size={16} color={Colors.textPrimary} />
                  <Text style={styles.runCodeBtnText}>Run Code</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Run All Tests Button */}
            <TouchableOpacity
              style={styles.runAllBtn}
              onPress={handleRunAllTests}
              disabled={runningTests}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
              <Text style={styles.runAllBtnText}>Run All Tests</Text>
            </TouchableOpacity>

            {/* Next Question Pill */}
            {questions.length > 1 && currentQuestionIndex < questions.length - 1 && (
              <TouchableOpacity
                style={styles.nextQuestionBtn}
                onPress={() => {
                  setCurrentQuestionIndex(prev => prev + 1);
                  setTestResults([]);
                  setExecutionSummary(null);
                  setActiveTab('sample');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.nextQuestionBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Language Selection Modal */}
        <Modal visible={showLangModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.hintModalCard}>
              <View style={styles.hintModalHeader}>
                <Ionicons name="code-slash" size={20} color={Colors.primary} />
                <Text style={styles.hintModalTitle}>Choose Programming Language</Text>
                <TouchableOpacity onPress={() => setShowLangModal(false)}>
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = currentLang === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[
                        styles.langModalOption,
                        isSelected && styles.langModalOptionSelected,
                      ]}
                      onPress={() => handleSwitchLanguage(lang.id as LanguageId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={lang.icon as any}
                        size={18}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                      <Text style={[styles.langModalOptionText, isSelected && { color: Colors.primary, fontWeight: Typography.bold }]}>
                        {lang.label} ({lang.ext})
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* Hints Modal */}
        <Modal visible={showHintModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.hintModalCard}>
              <View style={styles.hintModalHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.hintModalTitle}>Algorithmic Hints</Text>
                <TouchableOpacity onPress={() => setShowHintModal(false)}>
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 280 }}>
                {currentQuestion?.hints?.map((hint, idx) => (
                  <View key={idx} style={styles.hintItem}>
                    <Text style={styles.hintBadge}>Hint {idx + 1}</Text>
                    <Text style={styles.hintBodyText}>{hint}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeHintBtn}
                onPress={() => setShowHintModal(false)}
              >
                <Text style={styles.closeHintBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: COMPREHENSIVE AI ASSESSMENT REVIEW & MISTAKE REPORT
  // -------------------------------------------------------------
  const feedback = assessmentReview?.feedback || {};
  const questionBreakdown = feedback.questionBreakdown || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Assessment Diagnostic" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Card Banner */}
        <View style={styles.scoreReviewBanner}>
          <View style={[styles.passBadge, { backgroundColor: feedback.passed ? `${Colors.success}20` : `${Colors.error}20` }]}>
            <Ionicons
              name={feedback.passed ? 'shield-checkmark' : 'alert-circle'}
              size={18}
              color={feedback.passed ? Colors.success : Colors.error}
            />
            <Text style={[styles.passBadgeText, { color: feedback.passed ? Colors.success : Colors.error }]}>
              {feedback.passed ? 'ASSESSMENT PASSED' : 'NEEDS IMPROVEMENT'}
            </Text>
          </View>

          {/* Track and Level Badge */}
          <View style={styles.reviewTrackBadge}>
            <Ionicons name="school-outline" size={14} color={Colors.primary} />
            <Text style={styles.reviewTrackBadgeText}>
              {assessmentRole} • {assessmentLevel} Assessment
            </Text>
          </View>

          {/* Radial Score Representation */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{feedback.overallScore || 0}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>

          <Text style={styles.gradeText}>Grade: {feedback.grade || 'Evaluated'}</Text>
          <Text style={styles.summaryLeadText}>{feedback.summary}</Text>
        </View>

        {/* Actionable Advice ("Mewa Hadaganna") */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <Ionicons name="construct-outline" size={20} color={Colors.primary} />
            <Text style={styles.adviceTitle}>What to Improve (Key Recommendations)</Text>
          </View>
          {feedback.actionableAdvice?.map((advice: string, idx: number) => (
            <View key={idx} style={styles.adviceItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ))}
        </View>

        {/* Strengths */}
        {feedback.strengths?.length > 0 && (
          <View style={styles.strengthsCard}>
            <View style={styles.adviceHeader}>
              <Ionicons name="ribbon-outline" size={20} color={Colors.success} />
              <Text style={[styles.adviceTitle, { color: Colors.success }]}>Key Strengths</Text>
            </View>
            {feedback.strengths.map((str: string, idx: number) => (
              <View key={idx} style={styles.adviceItem}>
                <Ionicons name="checkmark" size={14} color={Colors.success} style={{ marginTop: 3 }} />
                <Text style={styles.adviceText}>{str}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Per-Question Detailed Breakdown */}
        <Text style={styles.breakdownHeaderTitle}>Question-by-Question Diagnostic</Text>

        {questionBreakdown.map((q: any, idx: number) => {
          const isExpanded = expandedSolutions[q.challengeId];
          return (
            <View key={q.challengeId || idx} style={styles.breakdownCard}>
              {/* Question Header */}
              <View style={styles.breakdownTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakdownQTitle}>
                    {idx + 1}. {q.title}
                  </Text>
                  <Text style={styles.breakdownQMeta}>
                    {q.category} {q.role && `• ${q.role}`} {q.level && `[${q.level}]`} • Solved in {q.language?.toUpperCase() || 'CODE'} • Target: {q.expectedComplexity?.time}
                  </Text>
                </View>
                <View style={styles.scorePill}>
                  <Text style={[styles.scorePillText, { color: q.passed ? Colors.success : Colors.warning }]}>
                    {q.score} / {q.maxScore} pts
                  </Text>
                </View>
              </View>

              {/* Test Cases Count */}
              <View style={styles.testCountRow}>
                <Ionicons
                  name={q.passed ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={q.passed ? Colors.success : Colors.error}
                />
                <Text style={[styles.testCountText, { color: q.passed ? Colors.success : Colors.error }]}>
                  {q.passedTests}/{q.totalTests} Test Cases Passed
                </Text>
              </View>

              {/* Mistakes Identified ("Waradunu Ewa") */}
              {q.mistakes?.length > 0 && (
                <View style={styles.mistakeBox}>
                  <Text style={styles.mistakeTitle}>⚠️ Mistakes & Edge Cases Missed:</Text>
                  {q.mistakes.map((m: string, i: number) => (
                    <Text key={i} style={styles.mistakeText}>• {m}</Text>
                  ))}
                </View>
              )}

              {/* Improvement Tips */}
              {q.improvements?.length > 0 && (
                <View style={styles.improveBox}>
                  <Text style={styles.improveTitle}>💡 Targeted Fix:</Text>
                  {q.improvements.map((imp: string, i: number) => (
                    <Text key={i} style={styles.improveText}>• {imp}</Text>
                  ))}
                </View>
              )}

              {/* Model Solution Toggle */}
              <TouchableOpacity
                style={styles.viewSolutionBtn}
                onPress={() => toggleSolution(q.challengeId)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up-outline' : 'code-working-outline'}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.viewSolutionBtnText}>
                  {isExpanded ? 'Hide Optimal Solution' : `View ${q.language?.toUpperCase() || 'Optimal'} Reference Code`}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.solutionCodeBox}>
                  <Text style={styles.solutionCodeText}>{q.optimalSolution}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Retake & Practice Buttons */}
        <View style={styles.finalActionsRow}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={handleStartAssessment}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={Colors.background} />
            <Text style={styles.retakeBtnText}>Take Another Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubBtn}
            onPress={() => router.push('/(tabs)/practice')}
            activeOpacity={0.8}
          >
            <Text style={styles.hubBtnText}>Return to Practice Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },

  // Launcher Styles
  heroBanner: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#1E2C3F',
    marginBottom: Spacing.xxl,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  heroBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  heroSubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },

  // Selector Sections (Role, Level, Language)
  selectorSection: { marginBottom: Spacing.lg },
  selectorSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  selectorSectionTitle: { fontSize: 13, fontWeight: Typography.bold, color: Colors.textPrimary },
  roleGrid: { gap: 8 },
  rolesDesktopGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  roleCard: {
    backgroundColor: '#0F1824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1A293D',
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  roleCardDesktop: {
    flex: 1,
    width: undefined,
  },
  roleCardSelected: {
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderColor: Colors.primary,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#162335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxSelected: {
    backgroundColor: Colors.primary,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    backgroundColor: '#131F2E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleTagSelected: {
    color: Colors.primary,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
  },
  roleTitle: { fontSize: 14, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 2 },
  roleTitleSelected: { color: Colors.primary },
  roleDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  roleDescSelected: { color: Colors.textPrimary },
  levelRow: { gap: 8 },
  levelsDesktopGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  levelCard: {
    backgroundColor: '#0F1824',
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1A293D',
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  levelCardDesktop: {
    flex: 1,
    width: undefined,
  },
  levelCardSelected: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: Colors.warning,
  },
  levelTitle: { fontSize: 13, fontWeight: Typography.bold, color: Colors.textPrimary },
  levelTitleSelected: { color: Colors.warning },
  levelDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  levelDescSelected: { color: Colors.textPrimary },
  focusCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0, 245, 212, 0.06)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginBottom: Spacing.xl,
  },
  focusCalloutText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  miniTag: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniTagText: { fontSize: 9, fontWeight: Typography.bold, color: Colors.primary },
  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#0F1824',
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 11, color: Colors.textMuted, fontWeight: Typography.medium },
  filterChipTextActive: { color: Colors.background, fontWeight: Typography.bold },
  emptyFilteredBox: {
    padding: Spacing.xl,
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyFilteredText: { fontSize: 13, color: Colors.textMuted },
  assessmentTrackBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  assessmentTrackBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary },
  rolePill: { backgroundColor: '#1E2A3A', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  rolePillText: { fontSize: 11, color: Colors.textSecondary, fontWeight: Typography.bold },
  levelPill: { backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
  levelPillText: { fontSize: 11, color: Colors.warning, fontWeight: Typography.bold },
  reviewTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101A28',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#1F3045',
  },
  reviewTrackBadgeText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.primary },

  // Language Selector
  langSelectorContainer: { marginBottom: Spacing.xl },
  langSelectorHeading: { fontSize: 13, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 10 },
  langChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121D2C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  langChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langChipText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.textSecondary },
  langChipTextSelected: { color: Colors.background },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121C2B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  featureText: { fontSize: 12, fontWeight: Typography.medium, color: Colors.textPrimary },
  primaryLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  primaryLaunchBtnText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.background },
  sectionHeaderRow: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 2 },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
  },
  challengeTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  challengeMeta: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 4 },
  diffBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.sm },
  diffText: { fontSize: 11, fontWeight: Typography.bold },

  // Assessment Workspace Styles
  assessmentTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#162333',
    backgroundColor: '#090E17',
  },
  exitBtn: { padding: 6 },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101824',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#1E2C3F',
  },
  timerText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  submitTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  submitTopBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.background },
  questionNavScroll: {
    backgroundColor: '#090E17',
    borderBottomWidth: 1,
    borderBottomColor: '#162333',
    paddingVertical: 8,
  },
  questionNavRow: { paddingHorizontal: Spacing.lg, gap: 10 },
  questionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101824',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  questionPillActive: { backgroundColor: '#142233' },
  statusIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  questionPillText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.textSecondary },
  questionPillTextActive: { color: Colors.primary },
  workspaceScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60, paddingTop: Spacing.md },
  problemHeader: { marginBottom: Spacing.lg },
  metaBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  categoryPill: { backgroundColor: '#131D2B', paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.sm },
  categoryPillText: { fontSize: 11, color: Colors.textSecondary, fontWeight: Typography.medium },
  langPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  langPillBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary },
  hintTrigger: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  hintTriggerText: { fontSize: 11, color: Colors.warning, fontWeight: Typography.bold },
  problemTitle: { fontSize: 20, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 6 },
  problemDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Editor Window
  editorFrame: {
    backgroundColor: '#0A1017',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1B293C',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1724',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1B293C',
  },
  macControls: { flexDirection: 'row', gap: 6 },
  macDot: { width: 10, height: 10, borderRadius: 5 },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0A1017',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  tabPillText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.primary },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6 },
  resetBtnText: { fontSize: 11, color: Colors.textMuted },
  editorBody: { flexDirection: 'row', minHeight: 220 },
  gutter: {
    backgroundColor: '#080E14',
    paddingVertical: Spacing.md,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#152233',
    alignItems: 'flex-end',
  },
  gutterText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeArea: {
    flex: 1,
    color: '#33F7DD',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    padding: Spacing.md,
    textAlignVertical: 'top',
  },

  // Test Section
  testSection: {
    backgroundColor: '#0D1520',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#192638',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#0A1018',
    borderBottomWidth: 1,
    borderBottomColor: '#192638',
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabButtonText: { fontSize: 12, fontWeight: Typography.medium, color: Colors.textMuted },
  tabButtonTextActive: { color: Colors.primary, fontWeight: Typography.bold },
  tabContentBox: { padding: Spacing.md },
  sampleCaseCard: {
    backgroundColor: '#121C2B',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  caseIndexTitle: { fontSize: 12, fontWeight: Typography.bold, color: Colors.textSecondary, marginBottom: 6 },
  keyValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  caseKey: { fontSize: 12, color: Colors.textMuted, width: 65 },
  caseVal: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  caseExplanation: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  summaryBar: {
    backgroundColor: '#122033',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C324E',
  },
  summaryBarText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.textPrimary },
  emptyResultsText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  resultCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  resultCardPassed: { backgroundColor: 'rgba(0, 230, 118, 0.08)', borderColor: 'rgba(0, 230, 118, 0.3)' },
  resultCardFailed: { backgroundColor: 'rgba(255, 82, 82, 0.08)', borderColor: 'rgba(255, 82, 82, 0.3)' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultTitle: { fontSize: 12, fontWeight: Typography.bold },
  execTimeText: { fontSize: 11, color: Colors.textMuted },
  hiddenNotice: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  errorBox: { backgroundColor: 'rgba(255, 82, 82, 0.15)', padding: 8, borderRadius: 4, marginTop: 6 },
  errorText: { color: Colors.error, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  consoleBox: {
    backgroundColor: '#080E14',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  consoleLine: {
    fontSize: 12,
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  runCodeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#121D2C',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1F3045',
  },
  runCodeBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  runAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#13283B',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  runAllBtnText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary },
  nextQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  nextQuestionBtnText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.background },

  // Language Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  langModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121E2F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  langModalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
  },
  langModalOptionText: { fontSize: 14, color: Colors.textPrimary, fontWeight: Typography.medium },

  // Hint Modal
  hintModalCard: { width: '100%', backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: '#1E2C3F' },
  hintModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  hintModalTitle: { fontSize: 16, fontWeight: Typography.bold, color: Colors.textPrimary },
  hintItem: { backgroundColor: '#131E2D', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  hintBadge: { fontSize: 11, fontWeight: Typography.bold, color: Colors.warning, marginBottom: 4 },
  hintBodyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  closeHintBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 10, alignItems: 'center', marginTop: Spacing.md },
  closeHintBtnText: { fontSize: 13, fontWeight: Typography.bold, color: Colors.background },

  // -------------------------------------------------------------
  // REVIEW / EVALUATION STYLES
  // -------------------------------------------------------------
  scoreReviewBanner: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2C3F',
    marginBottom: Spacing.xl,
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  passBadgeText: { fontSize: 12, fontWeight: Typography.bold, letterSpacing: 0.5 },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#121F30',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.xxl,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  scoreNumber: { fontSize: 44, fontWeight: Typography.bold, color: Colors.primary },
  scoreOutOf: { fontSize: 16, color: Colors.textMuted, marginLeft: 4 },
  gradeText: { fontSize: 16, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 8 },
  summaryLeadText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  adviceCard: {
    backgroundColor: '#101B29',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginBottom: Spacing.lg,
  },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  adviceTitle: { fontSize: 15, fontWeight: Typography.bold, color: Colors.primary },
  adviceItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { color: Colors.primary, fontSize: 14 },
  adviceText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },

  strengthsCard: {
    backgroundColor: '#0F1E19',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    marginBottom: Spacing.xl,
  },
  breakdownHeaderTitle: { fontSize: 18, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  breakdownCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1A293D',
    marginBottom: Spacing.md,
  },
  breakdownTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  breakdownQTitle: { fontSize: 15, fontWeight: Typography.bold, color: Colors.textPrimary },
  breakdownQMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  scorePill: { backgroundColor: '#132133', paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.sm },
  scorePillText: { fontSize: 12, fontWeight: Typography.bold },
  testCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  testCountText: { fontSize: 12, fontWeight: Typography.medium },
  mistakeBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    padding: Spacing.sm,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  mistakeTitle: { fontSize: 11, fontWeight: Typography.bold, color: Colors.error, marginBottom: 2 },
  mistakeText: { fontSize: 12, color: '#FDA4AF', lineHeight: 18 },
  improveBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  improveTitle: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary, marginBottom: 2 },
  improveText: { fontSize: 12, color: '#A7F3D0', lineHeight: 18 },
  viewSolutionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  viewSolutionBtnText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.primary },
  solutionCodeBox: {
    backgroundColor: '#080E14',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#192638',
  },
  solutionCodeText: {
    fontSize: 11,
    color: '#34D399',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  finalActionsRow: { gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.xxxl },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
  },
  retakeBtnText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.background },
  hubBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1E2C3F',
  },
  hubBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textSecondary },
});
