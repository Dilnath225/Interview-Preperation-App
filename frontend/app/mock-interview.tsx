/**
 * AI Mentor - Interactive Mock Interview & Video Call Screen
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ProgressRing } from '../src/components/ProgressRing';
import { Button } from '../src/components/Button';
import { api } from '../src/services/api';
import { VideoCallView } from '../src/components/VideoCallView';
import { AudioWaveform } from '../src/components/AudioWaveform';
import { speechManager } from '../src/utils/speechRecognition';

// Conditionally import expo-av (with graceful fallback for Expo Go on iOS/Android)
let Audio: any = null;
try {
  Audio = require('expo-av')?.Audio;
} catch (e) {
  // Expo Go iOS/Android uses Gemini Mobile Voice Engine
}

export default function MockInterviewScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'video' | 'standard' | 'report'>('video');
  const [isAnswering, setIsAnswering] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCritiqueSpeaking, setIsCritiqueSpeaking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [disqualified, setDisqualified] = useState<string | null>(null);
  const [gazeWarning, setGazeWarning] = useState<string>('');
  const [awaySeconds, setAwaySeconds] = useState<number>(0);

  // Enterprise Final Diagnostic Report State
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [evaluatingReport, setEvaluatingReport] = useState<boolean>(false);
  const [userAnswersMap, setUserAnswersMap] = useState<Record<string, string>>({});
  const [feedbacksMap, setFeedbacksMap] = useState<Record<string, any>>({});
  const [speakingReportTarget, setSpeakingReportTarget] = useState<string | null>(null);

  // Audio recording refs (works for both expo-av and web MediaRecorder)
  const expoRecordingRef = useRef<any>(null);
  const webRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<any>(null);
  const micIntervalRef = useRef<any>(null);
  const activeMicStreamRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const maxMicVolumeRef = useRef<number>(0);

  // Pre-warm microphone permission on mount so recording starts with zero latency
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        activeMicStreamRef.current = stream;
      }).catch((e) => {
        console.log('[Microphone] Initial permission check:', e);
      });
    }

    return () => {
      if (activeMicStreamRef.current) {
        try {
          activeMicStreamRef.current.getTracks().forEach((t: any) => t.stop());
        } catch (e) {}
        activeMicStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    startNewSession();
    return () => {
      speechManager.stopLiveRecognition();
      speechManager.stopSpeaking();
      stopRecordingCleanup();
    };
  }, []);

  // Timer while answering
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
        setUserAnswersMap({});
        setFeedbacksMap({});
        setCompletedSession(null);
        setViewMode('video');
      } else {
        Alert.alert('Error', 'Could not start interview session.');
      }
    } catch (err) {
      console.warn('Start interview error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup any active recording
  const stopRecordingCleanup = () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    if (expoRecordingRef.current) {
      try { expoRecordingRef.current.stopAndUnloadAsync().catch(() => {}); } catch (e) {}
      expoRecordingRef.current = null;
    }
    if (webRecorderRef.current && webRecorderRef.current.state !== 'inactive') {
      try { webRecorderRef.current.stop(); } catch (e) {}
      webRecorderRef.current = null;
    }
    setMicVolume(0);
  };

  const handleRestartInterview = () => {
    stopRecordingCleanup();
    speechManager.stopLiveRecognition();
    speechManager.stopSpeaking();
    setIsAnswering(false);
    setDisqualified(null);
    setGazeWarning('');
    setAwaySeconds(0);
    setUserAnswer('');
    setFeedback(null);
    setUserAnswersMap({});
    setFeedbacksMap({});
    setCompletedSession(null);
    setQuestionIndex(0);
    setSpeakingReportTarget(null);
    startNewSession();
  };

  // Start audio recording (platform-safe + live volume monitoring)
  const startAudioRecording = async () => {
    recordingStartTimeRef.current = Date.now();
    maxMicVolumeRef.current = 0;
    webChunksRef.current = [];

    // Mobile Platform (Expo Go iOS / Android)
    if (Platform.OS !== 'web') {
      if (Audio) {
        try {
          const permission = await Audio.requestPermissionsAsync();
          if (permission.status === 'granted') {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
            });
            const { recording: newRecording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            expoRecordingRef.current = newRecording;
            if (newRecording?.setOnRecordingStatusUpdate) {
              newRecording.setOnRecordingStatusUpdate((status: any) => {
                if (status.isRecording && typeof status.metering === 'number') {
                  const vol = Math.min(100, Math.max(0, Math.round((status.metering + 160) / 1.6)));
                  setMicVolume(vol);
                  if (vol > maxMicVolumeRef.current) maxMicVolumeRef.current = vol;
                  speechManager.feedVoiceCadence(vol);
                }
              });
            }
          }
        } catch (err) {}
      }
      return;
    }

    // Web MediaRecorder API with real-time AudioContext Volume Analyzer
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        let stream = activeMicStreamRef.current;
        const hasLiveTrack = stream && stream.getAudioTracks().some((t: any) => t.readyState === 'live');
        if (!hasLiveTrack) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          activeMicStreamRef.current = stream;
        }

        // Connect Web Audio API to analyze mic volume in real time
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            audioCtxRef.current = audioCtx;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            if (micIntervalRef.current) clearInterval(micIntervalRef.current);
            micIntervalRef.current = setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              const vol = Math.min(100, Math.round((avg / 128) * 100));
              setMicVolume(vol);
              if (vol > maxMicVolumeRef.current) {
                maxMicVolumeRef.current = vol;
              }
              // Feed voice cadence into Gemini Voice Engine to drive live typing & silence auto-submit!
              speechManager.feedVoiceCadence(vol);
            }, 100);
          }
        } catch (e) {
          console.warn('AudioContext volume analysis error:', e);
        }

        // Cross-browser MediaRecorder initialization
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        webChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            webChunksRef.current.push(e.data);
          }
        };
        recorder.start(100);
        webRecorderRef.current = recorder;
      } catch (err: any) {
        console.warn('Web audio recording error:', err);
        setSpeechStatus('⚠️ Microphone access error: ' + (err?.message || 'Permission denied'));
      }
    }
  };

  // Stop audio recording and return URI/blob URL
  const stopAudioRecording = async (): Promise<string | null> => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    setMicVolume(0);

    // expo-av recording
    if (expoRecordingRef.current) {
      try {
        await expoRecordingRef.current.stopAndUnloadAsync();
        const uri = expoRecordingRef.current.getURI();
        expoRecordingRef.current = null;
        return uri;
      } catch (err) {
        console.warn('Failed to stop expo-av recording:', err);
        expoRecordingRef.current = null;
      }
    }

    // Web MediaRecorder
    if (webRecorderRef.current && webRecorderRef.current.state !== 'inactive') {
      return new Promise((resolve) => {
        const recorder = webRecorderRef.current;
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(webChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          webRecorderRef.current = null;
          // Retain stream tracks so following questions start instantly without delay
          resolve(url);
        };

        try {
          if (recorder.state === 'recording') {
            recorder.requestData();
          }
        } catch (e) {}

        recorder.stop();
      });
    }

    return null;
  };

  // Start Answering: Parallel Live Speech Recognition + Robust Audio Recording
  const handleStartAnswering = async () => {
    setIsAnswering(true);
    setTimer(0);
    setUserAnswer('');
    setFeedback(null);
    speechManager.stopSpeaking();
    setIsAiSpeaking(false);
    setIsCritiqueSpeaking(false);
    if (speechManager.isRecognitionSupported()) {
      setSpeechStatus('✨ Gemini Voice Active — speak your answer clearly...');
    } else {
      setSpeechStatus('🎙️ Voice Active: Tap the answer box & press your keyboard mic to speak');
    }

    // 1. ALWAYS start audio recording & live mic volume monitoring
    await startAudioRecording();

    // 2. Start Gemini real-time live speech-to-text with auto-submit on silence
    const currentQ = questions[questionIndex];
    speechManager.startLiveRecognition(
      '',
      {
        onStart: () => {
          setSpeechStatus('✨ Gemini Voice Active — listening to your voice');
        },
        onResult: (text) => {
          setUserAnswer(text);
          if (currentQ) {
            setUserAnswersMap((prev) => ({
              ...prev,
              [currentQ.id]: text,
            }));
          }
          setSpeechStatus('🎤 Transcribing speech live in real time...');
        },
        onSilenceCountdown: (remaining) => {
          if (remaining > 0) {
            setSpeechStatus(`⏱️ Speech paused • Auto-submitting in ${remaining}s... (or keep talking)`);
          } else {
            setSpeechStatus('🎤 Voice detected — transcribing live');
          }
        },
        onAutoSubmit: () => {
          console.log('[MockInterview] Silence detected -> Auto-submitting answer to AI Mentor!');
          setSpeechStatus('🚀 Auto-submitting answer to AI Mentor...');
          handleStopAnswering();
        },
        onError: (errMsg) => {
          console.warn('Speech recognition notice:', errMsg);
          setSpeechStatus('🎙️ Voice stream active (evaluating via AI audio service)');
        },
      }
    );
  };

  // Stop Answering: Evaluate Speech / Audio
  const handleStopAnswering = async () => {
    setIsAnswering(false);
    speechManager.stopLiveRecognition();

    const elapsedSeconds = (Date.now() - (recordingStartTimeRef.current || Date.now())) / 1000;
    const peakVolume = maxMicVolumeRef.current;
    maxMicVolumeRef.current = 0;

    const audioUri = await stopAudioRecording();

    const currentQ = questions[questionIndex];
    if (!currentQ) return;

    setSubmitting(true);
    try {
      const trimmedAnswer = userAnswer.trim();
      if (trimmedAnswer) {
        setUserAnswersMap((prev) => ({ ...prev, [currentQ.id]: trimmedAnswer }));
      }

      // If audio was captured, submit audio for verbatim speech-to-text + question evaluation
      if (audioUri) {
        setSpeechStatus('🤖 AI Mentor is transcribing and evaluating your spoken response...');
        const res = await api.submitAudioAnswer(session.id, currentQ.id, audioUri);
        if (res.success && res.data) {
          const evalData = res.data.evaluation;
          setFeedback(evalData);
          setFeedbacksMap((prev) => ({ ...prev, [currentQ.id]: evalData }));
          if (evalData?.transcription) {
            setUserAnswer(evalData.transcription);
            setUserAnswersMap((prev) => ({ ...prev, [currentQ.id]: evalData.transcription }));
          }
        } else if (trimmedAnswer) {
          const textRes = await api.submitAnswer(session.id, currentQ.id, trimmedAnswer);
          if (textRes.success && textRes.data) {
            const evalData = textRes.data.evaluation;
            setFeedback(evalData);
            setFeedbacksMap((prev) => ({ ...prev, [currentQ.id]: evalData }));
          }
        } else {
          Alert.alert('Processing Notice', res.message || 'Could not evaluate audio. Please speak clearly into your mic.');
        }
      } else if (trimmedAnswer) {
        setSpeechStatus('🤖 AI Mentor is evaluating your spoken answer...');
        const res = await api.submitAnswer(session.id, currentQ.id, trimmedAnswer);
        if (res.success && res.data) {
          const evalData = res.data.evaluation;
          setFeedback(evalData);
          setFeedbacksMap((prev) => ({ ...prev, [currentQ.id]: evalData }));
        } else {
          Alert.alert('Notice', res.message || 'Could not evaluate answer. Please speak clearly into your microphone.');
        }
      } else {
        if (!speechManager.isRecognitionSupported()) {
          Alert.alert(
            'Microphone Input Notice',
            'In Expo Go on iOS, tap the answer box and use the microphone icon on your keyboard (Siri Dictation) to speak, or open http://localhost:8081 in Google Chrome on your computer for hands-free Gemini Voice typing.'
          );
        } else {
          Alert.alert(
            'Microphone Input Required',
            'No speech was detected. Please speak clearly into your microphone before submitting your answer.'
          );
        }
      }
    } catch (err: any) {
      console.warn('Submit answer error:', err);
      Alert.alert('Notice', err?.message || 'Failed to submit answer. Please speak clearly and try again.');
    } finally {
      setSubmitting(false);
      setSpeechStatus('');
    }
  };

  const handleNext = async () => {
    speechManager.stopSpeaking();
    speechManager.stopLiveRecognition();
    setIsAiSpeaking(false);
    setIsCritiqueSpeaking(false);

    if (isAnswering) {
      setIsAnswering(false);
      await stopAudioRecording();
    }

    const currentQ = questions[questionIndex];
    if (currentQ && userAnswer.trim()) {
      setUserAnswersMap((prev) => ({ ...prev, [currentQ.id]: userAnswer.trim() }));
      api.submitAnswer(session.id, currentQ.id, userAnswer.trim()).catch(() => {});
    }

    if (questionIndex < questions.length - 1) {
      const nextIdx = questionIndex + 1;
      const nextQ = questions[nextIdx];
      setQuestionIndex(nextIdx);
      setIsAnswering(false);
      setUserAnswer(userAnswersMap[nextQ?.id] || '');
      setFeedback(feedbacksMap[nextQ?.id] || null);
      setTimer(0);
    } else {
      handleCompleteInterview();
    }
  };

  const handleCompleteInterview = async () => {
    speechManager.stopSpeaking();
    speechManager.stopLiveRecognition();
    setIsAiSpeaking(false);
    setIsCritiqueSpeaking(false);

    if (isAnswering) {
      setIsAnswering(false);
      await stopAudioRecording();
    }

    const currentQ = questions[questionIndex];
    const latestAnswers = { ...userAnswersMap };
    if (currentQ && userAnswer.trim()) {
      latestAnswers[currentQ.id] = userAnswer.trim();
      setUserAnswersMap(latestAnswers);
    }

    setEvaluatingReport(true);
    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        userAnswer: latestAnswers[q.id] || '',
      }));

      const res = await api.completeInterview(session.id, answersPayload);
      if (res.success && res.data) {
        setCompletedSession(res.data);
      }
      setViewMode('report');
    } catch (err) {
      console.warn('Complete interview error:', err);
      setViewMode('report');
    } finally {
      setEvaluatingReport(false);
    }
  };

  const handleToggleReportVoice = (text: string, targetKey: string) => {
    if (speakingReportTarget === targetKey) {
      speechManager.stopSpeaking();
      setSpeakingReportTarget(null);
    } else {
      speechManager.stopSpeaking();
      setSpeakingReportTarget(targetKey);
      speechManager.speakText(
        text,
        () => setSpeakingReportTarget(null),
        () => setSpeakingReportTarget(null)
      );
    }
  };

  const handleToggleAiVoice = () => {
    const currentQ = questions[questionIndex];
    if (isAiSpeaking) {
      speechManager.stopSpeaking();
      setIsAiSpeaking(false);
    } else if (currentQ?.questionText) {
      setIsAiSpeaking(true);
      speechManager.speakText(
        currentQ.questionText,
        () => setIsAiSpeaking(false),
        () => setIsAiSpeaking(false)
      );
    }
  };

  const handleToggleCritiqueVoice = () => {
    if (isCritiqueSpeaking) {
      speechManager.stopSpeaking();
      setIsCritiqueSpeaking(false);
    } else if (feedback) {
      const parts: string[] = [];
      if (feedback.feedbackText) parts.push(feedback.feedbackText);
      if (feedback.mistakes && feedback.mistakes.length > 0) {
        parts.push('Key mistakes identified: ' + feedback.mistakes.join('. '));
      }
      if (feedback.missingPoints && feedback.missingPoints.length > 0) {
        parts.push('Important points you missed: ' + feedback.missingPoints.join('. '));
      }
      if (feedback.sampleIdealAnswer) {
        parts.push('Here is how to answer optimally: ' + feedback.sampleIdealAnswer);
      }
      setIsCritiqueSpeaking(true);
      speechManager.speakText(
        parts.join('. '),
        () => setIsCritiqueSpeaking(false),
        () => setIsCritiqueSpeaking(false)
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
          Setting up your AI Interview Session...
        </Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[questionIndex];
  const totalQuestions = questions.length;

  // 1. Report evaluation loading screen
  if (evaluatingReport) {
    return (
      <SafeAreaView style={[styles.container, styles.reportLoadingContainer]} edges={['top']}>
        <View style={styles.reportLoadingCard}>
          <View style={styles.reportLoadingSpinnerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.reportLoadingTitle}>SYNTHESIZING FINAL DIAGNOSTIC REPORT</Text>
          <Text style={styles.reportLoadingSubtitle}>
            Comparing your speech transcriptions against each target question, auditing technical accuracy, detecting conceptual mistakes, and compiling gold-standard model answers...
          </Text>
          <View style={styles.loadingStepsBox}>
            <View style={styles.loadingStepRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.loadingStepText}>Verbatim speech-to-text verified</Text>
            </View>
            <View style={styles.loadingStepRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.loadingStepText}>Direct technical comparison with asked questions</Text>
            </View>
            <View style={styles.loadingStepRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.loadingStepText}>Diagnosing mistakes & missing dimensions (Waradi/Adupadu)</Text>
            </View>
            <View style={styles.loadingStepRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.loadingStepText}>Formulating gold-standard ideal answers (හරි පිළිතුරු)</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Final Diagnostic Report Mode
  if (viewMode === 'report') {
    const reportQuestions: any[] = completedSession?.questions || questions.map((q) => {
      const fb = feedbacksMap[q.id];
      const ans = userAnswersMap[q.id] || '';
      return {
        ...q,
        userAnswer: ans,
        score: fb?.score ?? (ans ? 65 : 15),
        aiFeedback: fb ? JSON.stringify(fb) : null,
        evaluation: fb,
      };
    });

    const getEvaluation = (q: any) => {
      if (q.evaluation && typeof q.evaluation === 'object') return q.evaluation;
      if (feedbacksMap[q.id]) return feedbacksMap[q.id];
      if (q.aiFeedback) {
        try {
          return typeof q.aiFeedback === 'string' ? JSON.parse(q.aiFeedback) : q.aiFeedback;
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    let totalScoreSum = 0;
    let totalClaritySum = 0;
    let totalTechSum = 0;
    let totalConfSum = 0;
    let correctCount = 0;
    let partialCount = 0;
    let wrongCount = 0;

    reportQuestions.forEach((q: any) => {
      const ev = getEvaluation(q);
      const score = q.score ?? ev?.score ?? 50;
      totalScoreSum += score;
      totalClaritySum += ev?.clarityScore ?? (score + 2);
      totalTechSum += ev?.technicalAccuracyScore ?? score;
      totalConfSum += ev?.confidenceScore ?? (score - 2);

      const status = ev?.status || (score >= 70 ? 'CORRECT' : score >= 45 ? 'PARTIAL' : 'WRONG');
      if (status === 'CORRECT') correctCount++;
      else if (status === 'PARTIAL') partialCount++;
      else wrongCount++;
    });

    const qLen = reportQuestions.length || 1;
    const finalScore = completedSession?.overallScore ?? Math.round(totalScoreSum / qLen);
    const avgClarity = Math.min(100, Math.round(totalClaritySum / qLen));
    const avgTech = Math.min(100, Math.round(totalTechSum / qLen));
    const avgConf = Math.min(100, Math.round(totalConfSum / qLen));

    // Color thresholds: >= 70 Green (#00E676), 45-69 Yellow (#FFB300), < 45 Red (#FF5252)
    const scoreColor = finalScore >= 70 ? '#00E676' : finalScore >= 45 ? '#FFB300' : '#FF5252';
    const scoreStatus =
      finalScore >= 70
        ? 'ENTERPRISE READY'
        : finalScore >= 45
        ? 'COMPETENT / NEEDS REFINEMENT'
        : 'NEEDS FOUNDATIONAL PRACTICE';
    const scoreStatusDesc =
      finalScore >= 70
        ? 'Outstanding performance. Demonstrated strong conceptual depth and articulate technical reasoning.'
        : finalScore >= 45
        ? 'Demonstrated foundational knowledge but missed architectural trade-offs and quantitative rigor.'
        : 'Critical concept gaps detected. Review the gold-standard answers and practice verbal articulation.';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Top Header */}
        <View style={styles.reportHeaderBar}>
          <TouchableOpacity
            style={styles.reportBackBtn}
            onPress={() => router.replace('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            <Text style={styles.reportBackBtnText}>Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.reportHeaderTitleBox}>
            <Text style={styles.reportHeaderTitle}>FINAL DIAGNOSTIC REPORT</Text>
            <Text style={styles.reportHeaderSubtitle}>
              {session?.role || 'Software Engineer'} • {session?.type || 'BEHAVIORAL'} SESSION
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reportRestartHeaderBtn}
            onPress={handleRestartInterview}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={styles.reportRestartHeaderText}>Retake</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.reportScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Performance Card */}
          <View style={[styles.reportHeroCard, { borderColor: scoreColor }]}>
            <View style={styles.heroScoreRow}>
              <ProgressRing
                progress={finalScore}
                size={96}
                strokeWidth={8}
                color={scoreColor}
                label={`${finalScore}%`}
              />
              <View style={styles.heroScoreInfo}>
                <View style={[styles.heroStatusBadge, { backgroundColor: `${scoreColor}20`, borderColor: scoreColor }]}>
                  <Ionicons
                    name={finalScore >= 70 ? 'shield-checkmark' : finalScore >= 45 ? 'alert-circle' : 'close-circle'}
                    size={14}
                    color={scoreColor}
                  />
                  <Text style={[styles.heroStatusBadgeText, { color: scoreColor }]}>{scoreStatus}</Text>
                </View>
                <Text style={styles.heroScoreDesc}>{scoreStatusDesc}</Text>
                <View style={styles.readinessBoostPill}>
                  <Ionicons name="sparkles" size={13} color="#00F5D4" />
                  <Text style={styles.readinessBoostText}>+2 Readiness Score Boost Earned</Text>
                </View>
              </View>
            </View>

            {/* Answer Distribution Tally */}
            <View style={styles.heroTallyRow}>
              <View style={styles.tallyItem}>
                <Text style={[styles.tallyNumber, { color: '#00E676' }]}>{correctCount}</Text>
                <Text style={styles.tallyLabel}>Correct</Text>
              </View>
              <View style={styles.tallyDivider} />
              <View style={styles.tallyItem}>
                <Text style={[styles.tallyNumber, { color: '#FFB300' }]}>{partialCount}</Text>
                <Text style={styles.tallyLabel}>Partial</Text>
              </View>
              <View style={styles.tallyDivider} />
              <View style={styles.tallyItem}>
                <Text style={[styles.tallyNumber, { color: '#FF5252' }]}>{wrongCount}</Text>
                <Text style={styles.tallyLabel}>Needs Work</Text>
              </View>
              <View style={styles.tallyDivider} />
              <View style={styles.tallyItem}>
                <Text style={[styles.tallyNumber, { color: Colors.primary }]}>{reportQuestions.length}</Text>
                <Text style={styles.tallyLabel}>Total Questions</Text>
              </View>
            </View>
          </View>

          {/* Three Key Pillar Metrics */}
          <View style={styles.reportMetricsRow}>
            <View style={styles.reportMetricCard}>
              <Ionicons name="hardware-chip-outline" size={20} color={Colors.primary} />
              <Text style={styles.reportMetricValue}>{avgTech}%</Text>
              <Text style={styles.reportMetricLabel}>Technical Depth</Text>
              <View style={styles.reportMetricTrack}>
                <View style={[styles.reportMetricFill, { width: `${avgTech}%`, backgroundColor: Colors.primary }]} />
              </View>
            </View>

            <View style={styles.reportMetricCard}>
              <Ionicons name="mic-outline" size={20} color="#00E676" />
              <Text style={[styles.reportMetricValue, { color: '#00E676' }]}>{avgClarity}%</Text>
              <Text style={styles.reportMetricLabel}>Speech Clarity</Text>
              <View style={styles.reportMetricTrack}>
                <View style={[styles.reportMetricFill, { width: `${avgClarity}%`, backgroundColor: '#00E676' }]} />
              </View>
            </View>

            <View style={styles.reportMetricCard}>
              <Ionicons name="trending-up" size={20} color="#3B82F6" />
              <Text style={[styles.reportMetricValue, { color: '#3B82F6' }]}>{avgConf}%</Text>
              <Text style={styles.reportMetricLabel}>Confidence</Text>
              <View style={styles.reportMetricTrack}>
                <View style={[styles.reportMetricFill, { width: `${avgConf}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
          </View>

          {/* Question-by-Question Diagnostic Breakdown Header */}
          <View style={styles.reportSectionHeader}>
            <View style={styles.reportSectionTitleRow}>
              <Ionicons name="git-compare-outline" size={20} color={Colors.primary} />
              <Text style={styles.reportSectionTitle}>
                QUESTION-BY-QUESTION DIAGNOSTIC EVALUATION
              </Text>
            </View>
            <Text style={styles.reportSectionSubtitle}>
              Each asked question is cross-examined against your spoken response, pinpointing mistakes and delivering the exact gold-standard model answer.
            </Text>
          </View>

          {/* Question Diagnostic Cards */}
          {reportQuestions.map((q: any, idx: number) => {
            const ev = getEvaluation(q);
            const qScore = q.score ?? ev?.score ?? 50;
            const qColor = qScore >= 70 ? '#00E676' : qScore >= 45 ? '#FFB300' : '#FF5252';
            const qStatus = ev?.status || (qScore >= 70 ? 'CORRECT' : qScore >= 45 ? 'PARTIAL' : 'WRONG');
            const candidateSpeech = (q.userAnswer || ev?.transcription || '').trim();

            return (
              <View key={q.id || idx} style={[styles.diagnosticCard, { borderLeftColor: qColor }]}>
                {/* Question Card Header */}
                <View style={styles.diagnosticCardHeader}>
                  <View style={styles.diagnosticCardHeaderLeft}>
                    <View style={styles.questionIndexPill}>
                      <Text style={styles.questionIndexPillText}>Q{idx + 1}</Text>
                    </View>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{q.category || 'Technical'}</Text>
                    </View>
                  </View>

                  <View style={[styles.diagnosticStatusBadge, { backgroundColor: `${qColor}20`, borderColor: qColor }]}>
                    <Ionicons
                      name={qStatus === 'CORRECT' ? 'checkmark-circle' : qStatus === 'PARTIAL' ? 'alert-circle' : 'close-circle'}
                      size={13}
                      color={qColor}
                    />
                    <Text style={[styles.diagnosticStatusText, { color: qColor }]}>
                      {qStatus} · {qScore}/100
                    </Text>
                  </View>
                </View>

                {/* Target Question Asked */}
                <View style={styles.targetQuestionBox}>
                  <View style={styles.targetQuestionHeaderRow}>
                    <Text style={styles.targetQuestionLabel}>🎯 TARGET INTERVIEW QUESTION:</Text>
                    <TouchableOpacity
                      style={styles.cardVoiceBtn}
                      onPress={() => handleToggleReportVoice(q.questionText, `q_${q.id}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={speakingReportTarget === `q_${q.id}` ? 'volume-high' : 'volume-medium-outline'}
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.cardVoiceBtnText}>
                        {speakingReportTarget === `q_${q.id}` ? 'Speaking...' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.targetQuestionText}>"{q.questionText}"</Text>
                </View>

                {/* Candidate's Spoken Answer (Speech to Text) */}
                <View style={styles.spokenAnswerBox}>
                  <View style={styles.spokenAnswerHeaderRow}>
                    <View style={styles.spokenAnswerTitleWrap}>
                      <Ionicons name="mic" size={14} color="#00F5D4" />
                      <Text style={styles.spokenAnswerTitle}>WHAT YOU SAID (Speech-to-Text Transcription):</Text>
                    </View>
                    {candidateSpeech ? (
                      <TouchableOpacity
                        style={styles.cardVoiceBtn}
                        onPress={() => handleToggleReportVoice(candidateSpeech, `ans_${q.id}`)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={speakingReportTarget === `ans_${q.id}` ? 'volume-high' : 'volume-medium-outline'}
                          size={14}
                          color={Colors.primary}
                        />
                        <Text style={styles.cardVoiceBtnText}>
                          {speakingReportTarget === `ans_${q.id}` ? 'Speaking...' : 'Replay'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <Text style={[styles.spokenAnswerContent, !candidateSpeech && styles.spokenAnswerEmpty]}>
                    {candidateSpeech ? `"${candidateSpeech}"` : 'No spoken answer recorded for this question.'}
                  </Text>
                </View>

                {/* Identified Mistakes (Waradi) */}
                {ev?.mistakes && ev.mistakes.length > 0 ? (
                  <View style={styles.reportMistakesBox}>
                    <View style={styles.reportCritiqueHeader}>
                      <Ionicons name="alert-circle" size={15} color="#FF5252" />
                      <Text style={styles.reportMistakesTitle}>⚠️ Identified Mistakes & Errors (Waradi):</Text>
                    </View>
                    {ev.mistakes.map((err: string, i: number) => (
                      <View key={i} style={styles.reportCritiqueItemRow}>
                        <Text style={styles.reportMistakeBullet}>❌</Text>
                        <Text style={styles.mistakeText}>{err}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Missing Points (Adupadu) */}
                {ev?.missingPoints && ev.missingPoints.length > 0 ? (
                  <View style={styles.reportMissingBox}>
                    <View style={styles.reportCritiqueHeader}>
                      <Ionicons name="search" size={15} color="#FFB300" />
                      <Text style={styles.reportMissingTitle}>🔍 Missing Concepts & Omissions (Adupadu):</Text>
                    </View>
                    {ev.missingPoints.map((mp: string, i: number) => (
                      <View key={i} style={styles.reportCritiqueItemRow}>
                        <Text style={styles.reportMissingBullet}>⚠️</Text>
                        <Text style={styles.missingText}>{mp}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Gold-Standard Model Answer (හරි පිළිතුර) */}
                {ev?.sampleIdealAnswer ? (
                  <View style={styles.reportIdealAnswerBox}>
                    <View style={styles.reportIdealHeaderRow}>
                      <View style={styles.reportIdealTitleWrap}>
                        <Ionicons name="bulb" size={16} color="#00F5D4" />
                        <Text style={styles.reportIdealTitle}>💡 GOLD-STANDARD MODEL ANSWER (හරි පිළිතුර):</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cardVoiceBtnAccent}
                        onPress={() => handleToggleReportVoice(ev.sampleIdealAnswer, `ideal_${q.id}`)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={speakingReportTarget === `ideal_${q.id}` ? 'volume-high' : 'volume-medium'}
                          size={15}
                          color="#000000"
                        />
                        <Text style={styles.cardVoiceBtnAccentText}>
                          {speakingReportTarget === `ideal_${q.id}` ? 'Speaking...' : 'Listen Model Answer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.reportIdealContentText}>{ev.sampleIdealAnswer}</Text>
                  </View>
                ) : null}

                {/* Strengths & Actionable Coaching Tips */}
                <View style={styles.reportStrengthsRow}>
                  {ev?.strengths && ev.strengths.length > 0 ? (
                    <View style={styles.miniStrengthBox}>
                      <Text style={styles.miniSectionLabel}>✓ Handled Well:</Text>
                      {ev.strengths.map((str: string, i: number) => (
                        <Text key={i} style={styles.miniItemText}>• {str}</Text>
                      ))}
                    </View>
                  ) : null}

                  {ev?.improvements && ev.improvements.length > 0 ? (
                    <View style={styles.miniImproveBox}>
                      <Text style={styles.miniSectionLabel}>🚀 Coaching Recommendation:</Text>
                      {ev.improvements.map((tip: string, i: number) => (
                        <Text key={i} style={styles.miniItemText}>• {tip}</Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* Action Center at Bottom */}
          <View style={styles.reportBottomActions}>
            <TouchableOpacity
              style={styles.reportPrimaryBtn}
              onPress={handleRestartInterview}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#000000" />
              <Text style={styles.reportPrimaryBtnText}>Retake Mock Interview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reportSecondaryBtn}
              onPress={() => router.push('/technical-assessment')}
              activeOpacity={0.85}
            >
              <Ionicons name="code-slash" size={18} color={Colors.primary} />
              <Text style={styles.reportSecondaryBtnText}>Practice Coding Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reportGhostBtn}
              onPress={() => router.replace('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-circle-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.reportGhostBtnText}>Return to Profile & Analytics</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Video Call Mode
  if (viewMode === 'video') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <VideoCallView
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          sessionType={session?.type || 'BEHAVIORAL'}
          isAnswering={isAnswering}
          userAnswer={userAnswer}
          setUserAnswer={(text: string) => {
            setUserAnswer(text);
            if (currentQuestion) {
              setUserAnswersMap((prev) => ({ ...prev, [currentQuestion.id]: text }));
            }
          }}
          onStartAnswering={handleStartAnswering}
          onStopAnswering={handleStopAnswering}
          onNextQuestion={handleNext}
          onFinishInterview={handleCompleteInterview}
          feedback={feedback}
          submitting={submitting || evaluatingReport}
          timer={timer}
          formatTime={formatTime}
          onToggleMode={() => setViewMode('standard')}
          speechStatus={speechStatus}
          micVolume={micVolume}
          gazeWarning={gazeWarning}
          awaySeconds={awaySeconds}
          setGazeWarning={setGazeWarning}
          setAwaySeconds={setAwaySeconds}
          onDisqualified={(reason: string) => setDisqualified(reason)}
        />

        {/* Anti-Cheating Disqualification Modal Overlay */}
        {disqualified ? (
          <View style={styles.disqualificationBackdrop}>
            <View style={styles.disqualificationModal}>
              <View style={styles.disqualificationIconBox}>
                <Ionicons name="close-circle" size={54} color="#FF3B30" />
              </View>
              <Text style={styles.disqualificationTitle}>INTERVIEW TERMINATED</Text>
              <View style={styles.disqualificationBadge}>
                <Ionicons name="shield-outline" size={14} color="#FF3B30" />
                <Text style={styles.disqualificationBadgeText}>ANTI-CHEATING VIOLATION</Text>
              </View>
              <Text style={styles.disqualificationReason}>{disqualified}</Text>
              <Text style={styles.disqualificationDesc}>
                Candidate was detected looking away from the camera for over 60 seconds while answering. Under strict interview integrity guidelines, looking at secondary screens or reading external notes results in immediate disqualification.
              </Text>
              <TouchableOpacity
                style={styles.restartBtn}
                onPress={handleRestartInterview}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.restartBtnText}>Restart Interview from Beginning</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  // Standard Card / Drill Mode
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header with Timer & Mode Switch */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        <TouchableOpacity
          style={styles.videoModeSwitchBtn}
          onPress={() => setViewMode('video')}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam" size={16} color={Colors.primary} />
          <Text style={styles.videoModeSwitchText}>Video Call Mode</Text>
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
          <View style={styles.questionHeaderRow}>
            <Text style={styles.quoteMark}>"</Text>
            <TouchableOpacity
              style={[styles.voiceBtn, isAiSpeaking && styles.voiceBtnActive]}
              onPress={handleToggleAiVoice}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isAiSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={18}
                color={isAiSpeaking ? Colors.background : Colors.primary}
              />
              <Text style={[styles.voiceBtnText, isAiSpeaking && { color: Colors.background }]}>
                {isAiSpeaking ? 'Speaking...' : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.questionText}>
            {currentQuestion?.questionText || 'No question available.'}
          </Text>

          {/* Real-time audio wave */}
          <View style={styles.waveformContainer}>
            <AudioWaveform isActive={isAnswering} color={Colors.primary} height={36} barCount={16} />
            <Text style={styles.waveformSubtitle}>
              {isAnswering
                ? 'Speaking now — text will type automatically in real time'
                : 'Your response will be transcribed in real-time'}
            </Text>
          </View>
        </View>

        {/* Answer Input (Live Transcribed + Editable) */}
        <View style={styles.answerBox}>
          <View style={styles.answerHeaderRow}>
            <Text style={styles.answerBoxTitle}>Live Answer Transcript:</Text>
            {isAnswering && (
              <View style={styles.recordingLiveBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.recordingLiveText}>RECORDING</Text>
              </View>
            )}
          </View>
          {speechStatus ? (
            <Text style={{ fontSize: 11, color: '#00F5D4', marginBottom: 6, fontWeight: '600' }}>
              {speechStatus}
            </Text>
          ) : null}
          {isAnswering && (
            <View style={styles.stdMicLevelContainer}>
              <Ionicons
                name="mic"
                size={14}
                color={micVolume > 5 ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.stdMicLevelText}>
                Mic Volume: {micVolume}%
              </Text>
              <View style={styles.stdMicLevelTrack}>
                <View
                  style={[
                    styles.stdMicLevelFill,
                    { width: `${Math.max(6, micVolume)}%` },
                    micVolume > 5 && { backgroundColor: Colors.primary },
                  ]}
                />
              </View>
              <Text style={styles.stdMicLevelStatus}>
                {micVolume > 5 ? '🟢 Sound Detected' : '⚪ Speak clearly...'}
              </Text>
            </View>
          )}
          <View style={styles.voiceTranscriptDisplayBox}>
            <View style={styles.voiceTranscriptBadgeRow}>
              <View style={styles.voiceLockBadge}>
                <Ionicons name="mic" size={11} color="#00F5D4" />
                <Text style={styles.voiceLockBadgeText}>ORAL INTERVIEW • VOICE ONLY</Text>
              </View>
            </View>
            <ScrollView style={styles.voiceTranscriptScroll} nestedScrollEnabled>
              <Text
                style={[
                  styles.voiceTranscriptText,
                  !userAnswer && styles.voiceTranscriptPlaceholder,
                ]}
              >
                {userAnswer ? (
                  <>
                    {userAnswer}
                    {isAnswering && <Text style={{ color: '#00F5D4', fontWeight: 'bold' }}> ▌</Text>}
                  </>
                ) : isAnswering ? (
                  '🎙️ Gemini Voice listening... Speak your answer clearly into your microphone.'
                ) : (
                  'Face-to-Face Interview: Answers must be spoken aloud. Press "Start Answering" below and speak into your microphone.'
                )}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* AI Feedback Card */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeaderRow}>
              <View style={[
                styles.feedbackStatusBadge,
                feedback.status === 'CORRECT' ? styles.statusBadgeCorrect : feedback.status === 'PARTIAL' ? styles.statusBadgePartial : styles.statusBadgeWrong
              ]}>
                <Ionicons
                  name={
                    feedback.status === 'CORRECT'
                      ? 'checkmark-circle'
                      : feedback.status === 'PARTIAL'
                      ? 'alert-circle'
                      : 'close-circle'
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.feedbackStatusBadgeText}>
                  {feedback.status} · {feedback.score}/100
                </Text>
              </View>

              <TouchableOpacity
                style={styles.critiqueAudioBtn}
                onPress={handleToggleCritiqueVoice}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isCritiqueSpeaking ? 'volume-high' : 'volume-medium-outline'}
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.critiqueAudioBtnText}>
                  {isCritiqueSpeaking ? 'Speaking...' : 'Listen Critique'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* High-level feedback summary */}
            <Text style={styles.feedbackText}>{feedback.feedbackText}</Text>

            {/* Metrics Breakdown */}
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

            {/* Identified Mistakes (Waradi) */}
            {feedback.mistakes && feedback.mistakes.length > 0 && (
              <View style={styles.mistakesSection}>
                <View style={styles.critiqueHeaderRow}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.mistakesSectionTitle}>⚠️ Identified Mistakes & Inaccuracies (Waradi):</Text>
                </View>
                {feedback.mistakes.map((err: string, i: number) => (
                  <View key={i} style={styles.critiqueItemRow}>
                    <Text style={styles.mistakeBullet}>❌</Text>
                    <Text style={styles.mistakeItemText}>{err}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Missing Points & Omissions (Adupadu) */}
            {feedback.missingPoints && feedback.missingPoints.length > 0 && (
              <View style={styles.missingSection}>
                <View style={styles.critiqueHeaderRow}>
                  <Ionicons name="search" size={16} color="#FFB300" />
                  <Text style={styles.missingSectionTitle}>🔍 Missing Concepts & Shortcomings (Adupadu):</Text>
                </View>
                {feedback.missingPoints.map((mp: string, i: number) => (
                  <View key={i} style={styles.critiqueItemRow}>
                    <Text style={styles.missingBullet}>⚠️</Text>
                    <Text style={styles.missingItemText}>{mp}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Gold-Standard Model Answer */}
            {feedback.sampleIdealAnswer && (
              <View style={styles.idealAnswerBox}>
                <View style={styles.critiqueHeaderRow}>
                  <Ionicons name="bulb" size={16} color={Colors.primary} />
                  <Text style={styles.idealAnswerTitle}>💡 Gold-Standard Model Answer:</Text>
                </View>
                <Text style={styles.idealAnswerText}>{feedback.sampleIdealAnswer}</Text>
              </View>
            )}

            {/* Actionable Improvements */}
            {feedback.improvements && feedback.improvements.length > 0 && (
              <View style={styles.tipsSection}>
                <View style={styles.critiqueHeaderRow}>
                  <Ionicons name="trending-up" size={16} color="#3B82F6" />
                  <Text style={styles.tipsTitle}>Actionable Improvements:</Text>
                </View>
                {feedback.improvements.map((tip: string, i: number) => (
                  <Text key={i} style={styles.tipText}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}

            {/* Strengths */}
            {feedback.strengths && feedback.strengths.length > 0 && (
              <View style={styles.strengthsSection}>
                <View style={styles.critiqueHeaderRow}>
                  <Ionicons name="checkmark-done" size={16} color="#00F5D4" />
                  <Text style={styles.strengthsTitle}>What You Handled Well:</Text>
                </View>
                {feedback.strengths.map((str: string, i: number) => (
                  <Text key={i} style={styles.strengthText}>
                    ✓ {str}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main Action Buttons */}
        <View style={styles.actionRowPrimary}>
          <Button
            title={
              submitting
                ? 'Evaluating Answer...'
                : isAnswering
                ? 'Finish (or pause to auto-submit)'
                : 'Start Answering (Gemini Voice)'
            }
            onPress={isAnswering ? handleStopAnswering : handleStartAnswering}
            variant={isAnswering ? 'secondary' : 'primary'}
            icon={
              <Ionicons
                name={isAnswering ? 'stop-circle' : 'mic'}
                size={20}
                color={isAnswering ? Colors.error : Colors.background}
              />
            }
            style={{ flex: 1 }}
            loading={submitting}
          />
        </View>

        {/* Secondary Action Row: Switch Video & Next Question */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setViewMode('video')}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Video Call Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, styles.nextBtnHighlight]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>
              {questionIndex >= totalQuestions - 1 ? 'Finish' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Anti-Cheating Disqualification Modal Overlay */}
      {disqualified ? (
        <View style={styles.disqualificationBackdrop}>
          <View style={styles.disqualificationModal}>
            <View style={styles.disqualificationIconBox}>
              <Ionicons name="close-circle" size={54} color="#FF3B30" />
            </View>
            <Text style={styles.disqualificationTitle}>INTERVIEW TERMINATED</Text>
            <View style={styles.disqualificationBadge}>
              <Ionicons name="shield-outline" size={14} color="#FF3B30" />
              <Text style={styles.disqualificationBadgeText}>ANTI-CHEATING VIOLATION</Text>
            </View>
            <Text style={styles.disqualificationReason}>{disqualified}</Text>
            <Text style={styles.disqualificationDesc}>
              Candidate was detected looking away from the camera for over 60 seconds while answering. Under strict interview integrity guidelines, looking at secondary screens or reading external notes results in immediate disqualification.
            </Text>
            <TouchableOpacity
              style={styles.restartBtn}
              onPress={handleRestartInterview}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.restartBtnText}>Restart Interview from Beginning</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: { padding: Spacing.xs },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    gap: 6,
  },
  timerText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  videoModeSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  videoModeSwitchText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  sessionMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sessionTypeBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  sessionTypeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  questionNumberText: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  questionCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    marginBottom: Spacing.lg,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quoteMark: {
    fontSize: 48,
    color: Colors.primary,
    lineHeight: 48,
    marginBottom: -16,
    opacity: 0.7,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  voiceBtnActive: {
    backgroundColor: Colors.primary,
  },
  voiceBtnText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  questionText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginVertical: Spacing.md,
  },
  waveformContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#162232',
    marginTop: Spacing.sm,
  },
  waveformSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  answerBox: {
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 120,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  answerBoxTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  recordingLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3366',
  },
  recordingLiveText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#FF3366',
    letterSpacing: 0.8,
  },
  answerInput: {
    color: Colors.textPrimary,
    fontSize: Typography.bodySmall,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  feedbackCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginBottom: Spacing.lg,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.md,
  },
  feedbackStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusBadgeCorrect: {
    backgroundColor: '#059669',
  },
  statusBadgePartial: {
    backgroundColor: '#D97706',
  },
  statusBadgeWrong: {
    backgroundColor: '#DC2626',
  },
  feedbackStatusBadgeText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  critiqueAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#152232',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  critiqueAudioBtnText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  mistakesSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  critiqueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  mistakesSectionTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#FF4D4D',
  },
  critiqueItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  mistakeBullet: {
    fontSize: 11,
    marginTop: 2,
  },
  mistakeItemText: {
    flex: 1,
    fontSize: Typography.caption,
    color: '#FFB8B8',
    lineHeight: 18,
  },
  missingSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  missingSectionTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#FBBF24',
  },
  missingBullet: {
    fontSize: 11,
    marginTop: 2,
  },
  missingItemText: {
    flex: 1,
    fontSize: Typography.caption,
    color: '#FDE68A',
    lineHeight: 18,
  },
  strengthsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  strengthsTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#34D399',
  },
  strengthText: {
    fontSize: Typography.caption,
    color: '#A7F3D0',
    lineHeight: 18,
    marginBottom: 3,
  },
  feedbackTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
    flex: 1,
  },
  feedbackScore: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  feedbackText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#162232',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  metricValue: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tipsSection: {
    marginTop: Spacing.sm,
  },
  tipsTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.warning,
    marginBottom: 4,
  },
  tipText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  idealAnswerBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.1)',
  },
  idealAnswerTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  idealAnswerText: {
    fontSize: Typography.caption,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionRowPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#1C293A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  nextBtnHighlight: {
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  secondaryBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  stdMicLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C1420',
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#182638',
  },
  stdMicLevelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  stdMicLevelTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#162232',
    borderRadius: 2,
    overflow: 'hidden',
  },
  stdMicLevelFill: {
    height: '100%',
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
  stdMicLevelStatus: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.semiBold,
  },
  disqualificationBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 12, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: Spacing.xl,
  },
  disqualificationModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F1622',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
    shadowColor: '#FF0033',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  disqualificationIconBox: {
    marginBottom: Spacing.md,
  },
  disqualificationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF3B30',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  disqualificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    marginBottom: Spacing.md,
  },
  disqualificationBadgeText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#FF3B30',
    letterSpacing: 0.8,
  },
  disqualificationReason: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  disqualificationDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  restartBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  restartBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Report Evaluation Loading Styles
  reportLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#04070D',
  },
  reportLoadingCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0A101A',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  reportLoadingSpinnerBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  reportLoadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  reportLoadingSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  loadingStepsBox: {
    width: '100%',
    backgroundColor: 'rgba(13, 21, 32, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: '#192535',
  },
  loadingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingStepText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },

  // Final Diagnostic Report Styles
  reportHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#070D14',
    borderBottomWidth: 1,
    borderBottomColor: '#121C2B',
  },
  reportBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  reportBackBtnText: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
  },
  reportHeaderTitleBox: {
    alignItems: 'center',
  },
  reportHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00F5D4',
    letterSpacing: 1.2,
  },
  reportHeaderSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  reportRestartHeaderBtn: {
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
  reportRestartHeaderText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  reportScrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },

  // Report Hero Performance Card
  reportHeroCard: {
    backgroundColor: '#0A111C',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroScoreInfo: {
    flex: 1,
    gap: 6,
  },
  heroStatusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  heroStatusBadgeText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
  },
  heroScoreDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  readinessBoostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  readinessBoostText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },
  heroTallyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: '#192638',
  },
  tallyItem: {
    alignItems: 'center',
    flex: 1,
  },
  tallyNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  tallyLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tallyDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E2D40',
  },

  // 3 Pillar Metrics
  reportMetricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reportMetricCard: {
    flex: 1,
    backgroundColor: '#090E17',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#182436',
    alignItems: 'center',
  },
  reportMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  reportMetricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  reportMetricTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#152132',
    borderRadius: 2,
    overflow: 'hidden',
  },
  reportMetricFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Section Header
  reportSectionHeader: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  reportSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.8,
  },
  reportSectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Diagnostic Cards
  diagnosticCard: {
    backgroundColor: '#080D16',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#162335',
    borderLeftWidth: 4,
    gap: Spacing.sm + 2,
  },
  diagnosticCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questionIndexPill: {
    backgroundColor: '#121F30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#20334E',
  },
  questionIndexPillText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  diagnosticStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  diagnosticStatusText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },

  // Target Question Box
  targetQuestionBox: {
    backgroundColor: '#0D1522',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#19283D',
  },
  targetQuestionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  targetQuestionLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  cardVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  cardVoiceBtnText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  targetQuestionText: {
    fontSize: 13,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    lineHeight: 19,
  },

  // Spoken Answer Box
  spokenAnswerBox: {
    backgroundColor: '#070C14',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#152438',
  },
  spokenAnswerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  spokenAnswerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  spokenAnswerTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
    letterSpacing: 0.6,
  },
  spokenAnswerContent: {
    fontSize: 12,
    color: '#E0E6F0',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  spokenAnswerEmpty: {
    color: Colors.textMuted,
    fontStyle: 'normal',
  },

  // Mistakes (Waradi)
  reportMistakesBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.35)',
    gap: 5,
  },
  reportCritiqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  reportMistakesTitle: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#FF5252',
    letterSpacing: 0.5,
  },
  reportCritiqueItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  reportMistakeBullet: {
    fontSize: 11,
    marginTop: 1,
  },
  mistakeText: {
    flex: 1,
    fontSize: 12,
    color: '#FFA8A8',
    lineHeight: 17,
  },

  // Missing Points (Adupadu)
  reportMissingBox: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.35)',
    gap: 5,
  },
  reportMissingTitle: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#FFB300',
    letterSpacing: 0.5,
  },
  reportMissingBullet: {
    fontSize: 11,
    marginTop: 1,
  },
  missingText: {
    flex: 1,
    fontSize: 12,
    color: '#FFE29A',
    lineHeight: 17,
  },

  // Gold-Standard Ideal Answer Box
  reportIdealAnswerBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 245, 212, 0.45)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  reportIdealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reportIdealTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  reportIdealTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F5D4',
    letterSpacing: 0.7,
  },
  cardVoiceBtnAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00F5D4',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardVoiceBtnAccentText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#000000',
  },
  reportIdealContentText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 19,
    fontWeight: Typography.medium,
  },

  // Strengths and Improvements
  reportStrengthsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  miniStrengthBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs + 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  miniImproveBox: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs + 3,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  miniSectionLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  miniItemText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  // Bottom Actions
  reportBottomActions: {
    marginTop: Spacing.sm,
    gap: Spacing.sm + 2,
  },
  reportPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00F5D4',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  reportPrimaryBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#000000',
    letterSpacing: 0.5,
  },
  reportSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0E1724',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  reportSecondaryBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  reportGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  reportGhostBtnText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.semiBold,
  },
  voiceTranscriptDisplayBox: {
    backgroundColor: '#0A101D',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#19283D',
    minHeight: 90,
  },
  voiceTranscriptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  voiceLockBadgeText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#00F5D4',
    letterSpacing: 0.5,
  },
  voiceTranscriptScroll: {
    maxHeight: 140,
  },
  voiceTranscriptText: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  voiceTranscriptPlaceholder: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
