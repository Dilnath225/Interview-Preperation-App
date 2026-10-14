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

// Conditionally import expo-av (not available in Expo Go on iOS/web)
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av not available, using web fallback for audio recording');
}

export default function MockInterviewScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'video' | 'standard'>('video');
  const [isAnswering, setIsAnswering] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [disqualified, setDisqualified] = useState<string | null>(null);
  const [gazeWarning, setGazeWarning] = useState<string>('');
  const [awaySeconds, setAwaySeconds] = useState<number>(0);

  // Audio recording refs (works for both expo-av and web MediaRecorder)
  const expoRecordingRef = useRef<any>(null);
  const webRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<any>(null);
  const micIntervalRef = useRef<any>(null);

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
    setQuestionIndex(0);
    startNewSession();
  };

  // Start audio recording (platform-safe + live volume monitoring)
  const startAudioRecording = async () => {
    // Try expo-av first (native iOS/Android with dev build)
    if (Audio && Platform.OS !== 'web') {
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
          return;
        }
      } catch (err) {
        console.warn('expo-av recording not available:', err);
      }
    }

    // Web MediaRecorder API with real-time AudioContext Volume Analyzer
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
              setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
            }, 100);
          }
        } catch (e) {
          console.warn('AudioContext volume analysis error:', e);
        }

        // Cross-browser MediaRecorder initialization
        let options: any = undefined;
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
          } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }
        }

        const recorder = new MediaRecorder(stream, options);
        webChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            webChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
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
          // Stop audio tracks
          recorder.stream?.getTracks().forEach((t: any) => t.stop());
          resolve(url);
        };
        recorder.stop();
      });
    }

    return null;
  };

  // Start Answering: Parallel Live Speech Recognition + Robust Audio Recording
  const handleStartAnswering = async () => {
    setIsAnswering(true);
    setTimer(0);
    setFeedback(null);
    if (Platform.OS !== 'web') {
      setSpeechStatus('🎙️ Mobile: Tap the answer box & use your keyboard mic 🎙️ or type');
    }

    // 1. ALWAYS start audio recording & live mic volume monitoring
    await startAudioRecording();

    // 2. Also start real-time live speech-to-text if browser supports it
    if (speechManager.isRecognitionSupported()) {
      speechManager.startLiveRecognition(userAnswer, {
        onStart: () => {
          setSpeechStatus('🎤 Listening... speak clearly into your mic');
        },
        onResult: (text) => {
          setUserAnswer(text);
          setSpeechStatus('🎤 Voice detected — typing live');
        },
        onError: (errMsg) => {
          console.warn('Speech recognition warning:', errMsg);
          setSpeechStatus(`🎙️ Recording voice for AI evaluation (${errMsg})`);
        },
      });
    }
  };

  // Stop Answering: Evaluate Speech / Audio
  const handleStopAnswering = async () => {
    setIsAnswering(false);
    speechManager.stopLiveRecognition();

    const audioUri = await stopAudioRecording();

    const currentQ = questions[questionIndex];
    if (!currentQ) return;

    setSubmitting(true);
    try {
      const trimmedAnswer = userAnswer.trim();
      if (trimmedAnswer) {
        // Transcribed speech answer exists
        const res = await api.submitAnswer(session.id, currentQ.id, trimmedAnswer);
        if (res.success && res.data) {
          setFeedback(res.data.evaluation);
        } else {
          Alert.alert('Notice', res.message || 'Could not evaluate answer. Please try again.');
        }
      } else if (audioUri) {
        // Fallback to audio processing if text was not captured live
        setSpeechStatus('🤖 AI is transcribing and evaluating your voice...');
        const res = await api.submitAudioAnswer(session.id, currentQ.id, audioUri);
        if (res.success && res.data) {
          setFeedback(res.data.evaluation);
          if (res.data.evaluation?.transcription) {
            setUserAnswer(res.data.evaluation.transcription);
          }
        } else {
          Alert.alert('Processing Notice', res.message || 'Could not evaluate audio. Please type your answer directly.');
        }
      } else {
        Alert.alert(
          'Answer Required',
          Platform.OS !== 'web'
            ? 'Please tap the text box and speak using your keyboard microphone 🎙️ (Voice Dictation) or type your answer.'
            : 'No speech detected. Please check microphone permissions or type your answer in the box.'
        );
      }
    } catch (err: any) {
      console.warn('Submit answer error:', err);
      Alert.alert('Notice', err?.message || 'Failed to submit answer. You can type your response manually.');
    } finally {
      setSubmitting(false);
      setSpeechStatus('');
    }
  };

  const handleNext = async () => {
    speechManager.stopSpeaking();
    speechManager.stopLiveRecognition();
    setIsAiSpeaking(false);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setIsAnswering(false);
      setUserAnswer('');
      setFeedback(null);
      setTimer(0);
    } else {
      handleCompleteInterview();
    }
  };

  const handleCompleteInterview = async () => {
    try {
      await api.completeInterview(session.id);
      Alert.alert(
        '🎉 Interview Complete!',
        'You have successfully completed the mock interview. Your readiness score has been updated.',
        [{ text: 'View Profile', onPress: () => router.replace('/(tabs)/profile') }]
      );
    } catch (err) {
      router.replace('/(tabs)/profile');
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
          setUserAnswer={setUserAnswer}
          onStartAnswering={handleStartAnswering}
          onStopAnswering={handleStopAnswering}
          onNextQuestion={handleNext}
          onFinishInterview={handleCompleteInterview}
          feedback={feedback}
          submitting={submitting}
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
          <TextInput
            style={styles.answerInput}
            placeholder="Speak into your microphone to type automatically, or type here manually..."
            placeholderTextColor={Colors.textMuted}
            value={userAnswer}
            onChangeText={setUserAnswer}
            multiline
          />
        </View>

        {/* AI Feedback Card */}
        {feedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeaderRow}>
              <Ionicons
                name={
                  feedback.status === 'CORRECT'
                    ? 'checkmark-circle'
                    : feedback.status === 'PARTIAL'
                    ? 'alert-circle'
                    : 'close-circle'
                }
                size={22}
                color={
                  feedback.status === 'CORRECT'
                    ? Colors.success
                    : feedback.status === 'PARTIAL'
                    ? Colors.warning
                    : Colors.error
                }
              />
              <Text style={styles.feedbackTitle}>
                {feedback.status === 'CORRECT'
                  ? 'Excellent Answer'
                  : feedback.status === 'PARTIAL'
                  ? 'Needs Improvement'
                  : 'Needs Practice'}
              </Text>
              <Text style={styles.feedbackScore}>{feedback.score}/100</Text>
            </View>

            <Text style={styles.feedbackText}>{feedback.feedbackText}</Text>

            {feedback.sampleIdealAnswer && (
              <View style={styles.idealAnswerBox}>
                <Text style={styles.idealAnswerTitle}>💡 Model Ideal Answer:</Text>
                <Text style={styles.idealAnswerText}>{feedback.sampleIdealAnswer}</Text>
              </View>
            )}

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
                <Text style={styles.tipsTitle}>Actionable Improvements:</Text>
                {feedback.improvements.map((tip: string, i: number) => (
                  <Text key={i} style={styles.tipText}>
                    • {tip}
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
                ? 'Stop & Evaluate'
                : 'Start Answering'
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
    gap: 8,
    marginBottom: Spacing.md,
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
});
