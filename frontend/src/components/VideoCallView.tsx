import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { AudioWaveform } from './AudioWaveform';
import { speechManager } from '../utils/speechRecognition';
import { EyeTracker } from '../utils/eyeTracker';

// Conditional import for expo-camera on native
let CameraView: any = null;
if (Platform.OS !== 'web') {
  try {
    const expoCamera = require('expo-camera');
    CameraView = expoCamera.CameraView;
  } catch (e) {
    console.warn('expo-camera not available on native:', e);
  }
}

interface VideoCallViewProps {
  question: any;
  questionIndex: number;
  totalQuestions: number;
  sessionType?: string;
  isAnswering: boolean;
  userAnswer: string;
  setUserAnswer: (text: string) => void;
  onStartAnswering: () => void;
  onStopAnswering: () => void;
  onNextQuestion: () => void;
  onFinishInterview: () => void;
  feedback: any;
  submitting: boolean;
  timer: number;
  formatTime: (s: number) => string;
  onToggleMode: () => void;
  speechStatus?: string;
  micVolume?: number;
  gazeWarning?: string;
  awaySeconds?: number;
  setGazeWarning?: (msg: string) => void;
  setAwaySeconds?: (s: number) => void;
  onDisqualified?: (reason: string) => void;
}

export const VideoCallView: React.FC<VideoCallViewProps> = ({
  question,
  questionIndex,
  totalQuestions,
  sessionType = 'BEHAVIORAL',
  isAnswering,
  userAnswer,
  setUserAnswer,
  onStartAnswering,
  onStopAnswering,
  onNextQuestion,
  onFinishInterview,
  feedback,
  submitting,
  timer,
  formatTime,
  onToggleMode,
  speechStatus,
  micVolume = 0,
  gazeWarning = '',
  awaySeconds = 0,
  setGazeWarning,
  setAwaySeconds,
  onDisqualified,
}) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showTranscriptInput, setShowTranscriptInput] = useState(Platform.OS !== 'web');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(Platform.OS === 'web');

  const webVideoRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const eyeTrackerRef = useRef<EyeTracker | null>(null);

  // Request native camera permissions on mount for Expo Go / Native
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        const expoCamera = require('expo-camera');
        if (expoCamera?.Camera?.requestCameraPermissionsAsync) {
          expoCamera.Camera.requestCameraPermissionsAsync().then((res: any) => {
            setCameraPermissionGranted(res?.status === 'granted');
          }).catch((err: any) => {
            console.warn('Native camera permission check error:', err);
            setCameraPermissionGranted(false);
          });
        }
      } catch (err) {
        console.warn('expo-camera not loaded on native:', err);
      }
    }
  }, []);

  const requestNativeCamera = async () => {
    if (Platform.OS !== 'web') {
      try {
        const expoCamera = require('expo-camera');
        if (expoCamera?.Camera?.requestCameraPermissionsAsync) {
          const res = await expoCamera.Camera.requestCameraPermissionsAsync();
          setCameraPermissionGranted(res?.status === 'granted');
        }
      } catch (err) {
        console.warn('Error requesting camera permissions:', err);
      }
    }
  };

  // Initialize EyeTracker for Anti-Cheating (Web & Mobile Expo Go)
  useEffect(() => {
    eyeTrackerRef.current = new EyeTracker({
      maxAwaySeconds: 60,
      onGazeUpdate: (evt) => {
        if (evt.isLookingAway) {
          if (setGazeWarning) setGazeWarning(evt.warningMessage || '⚠️ Gaze shifted away from screen!');
        } else {
          if (setGazeWarning) setGazeWarning('');
        }
        if (setAwaySeconds) setAwaySeconds(evt.awayDurationSeconds);
      },
      onWarning: (msg, secs) => {
        if (setGazeWarning) setGazeWarning(msg);
        if (setAwaySeconds) setAwaySeconds(secs);
      },
      onDisqualified: (reason) => {
        if (onDisqualified) onDisqualified(reason);
      },
    });

    if (Platform.OS !== 'web') {
      eyeTrackerRef.current.start();
    }

    return () => {
      if (eyeTrackerRef.current) {
        eyeTrackerRef.current.stop();
        eyeTrackerRef.current = null;
      }
    };
  }, []);

  // Reset away timer on new question
  useEffect(() => {
    if (eyeTrackerRef.current) {
      eyeTrackerRef.current.resetAwayTimer();
    }
    if (setAwaySeconds) setAwaySeconds(0);
    if (setGazeWarning) setGazeWarning('');
  }, [questionIndex]);

  // Initialize camera for Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      if (cameraEnabled) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          })
          .then((stream) => {
            mediaStreamRef.current = stream;
            setCameraPermissionGranted(true);
            if (webVideoRef.current) {
              webVideoRef.current.srcObject = stream;
              webVideoRef.current.play().catch(() => {});
              if (eyeTrackerRef.current) {
                eyeTrackerRef.current.start(webVideoRef.current);
              }
            }
          })
          .catch((err) => {
            console.warn('Camera permission denied or camera not available:', err);
            setCameraPermissionGranted(false);
          });
      } else {
        if (eyeTrackerRef.current) eyeTrackerRef.current.stop();
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
          mediaStreamRef.current = null;
        }
      }
    }

    return () => {
      if (eyeTrackerRef.current) eyeTrackerRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [cameraEnabled]);

  // Read the question aloud when question changes
  useEffect(() => {
    if (question?.questionText) {
      setAiSpeaking(true);
      speechManager.speakText(
        question.questionText,
        () => setAiSpeaking(false),
        () => setAiSpeaking(false)
      );
    }
    return () => {
      speechManager.stopSpeaking();
    };
  }, [questionIndex, question?.questionText]);

  const handleToggleAiSpeech = () => {
    if (aiSpeaking) {
      speechManager.stopSpeaking();
      setAiSpeaking(false);
    } else if (question?.questionText) {
      setAiSpeaking(true);
      speechManager.speakText(
        question.questionText,
        () => setAiSpeaking(false),
        () => setAiSpeaking(false)
      );
    }
  };

  const handleToggleCamera = () => {
    setCameraEnabled((prev) => !prev);
  };

  const handleToggleMic = () => {
    setMicEnabled((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Top Video Header */}
      <View style={styles.topBar}>
        <View style={styles.liveIndicator}>
          <View style={[styles.statusDot, isAnswering && { backgroundColor: '#FF3366' }]} />
          <Text style={styles.liveText}>
            {isAnswering ? 'RECORDING' : 'LIVE'}
          </Text>
        </View>

        {/* Real-time Eye Proctoring Status Pill */}
        <View
          style={[
            styles.proctorPill,
            gazeWarning ? styles.proctorPillWarning : undefined,
          ]}
        >
          <View
            style={[
              styles.proctorDot,
              gazeWarning ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#00F5D4' },
            ]}
          />
          <Text
            style={[
              styles.proctorText,
              gazeWarning && { color: '#FF3B30' },
            ]}
          >
            {gazeWarning ? `AWAY: ${awaySeconds}s / 60s` : 'EYES: FOCUSED'}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={onToggleMode}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={16} color={Colors.textPrimary} />
          <Text style={styles.switchModeText}>Text View</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Width Prominent Gaze Warning Banner */}
      {gazeWarning ? (
        <View style={styles.topGazeWarningBanner}>
          <View style={styles.gazeAlertIconCircle}>
            <Ionicons name="eye-off" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topGazeWarningTitle}>{gazeWarning}</Text>
            <Text style={styles.topGazeWarningTimer}>
              Anti-Cheating Malpractice Timer: {awaySeconds}s / 60s (Looking away &gt; 60s will VOID interview)
            </Text>
          </View>
        </View>
      ) : null}

      {/* Main Video Arena: Split Layout */}
      <View style={styles.videoArena}>
        {/* 1. AI Interviewer Screen (Main Video Feed) */}
        <View style={styles.interviewerTile}>
          <Image
            source={require('../../assets/images/ai-interviewer.jpg')}
            style={styles.interviewerImage}
            resizeMode="cover"
          />

          {/* AI Info & Speaking Status Overlay */}
          <View style={styles.interviewerHeaderOverlay}>
            <View style={styles.interviewerTag}>
              <Text style={styles.interviewerName}>Sarah Jenkins</Text>
              <Text style={styles.interviewerRole}>Principal AI Interviewer</Text>
            </View>

            {/* Speaking / Audio Status */}
            <TouchableOpacity
              style={[styles.aiAudioBtn, aiSpeaking && styles.aiAudioBtnActive]}
              onPress={handleToggleAiSpeech}
              activeOpacity={0.8}
            >
              <Ionicons
                name={aiSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={18}
                color={aiSpeaking ? Colors.background : Colors.primary}
              />
              <Text style={[styles.aiAudioText, aiSpeaking && { color: Colors.background }]}>
                {aiSpeaking ? 'Speaking...' : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Anti-Cheating Eye Tracking Malpractice Warning Banner */}
          {gazeWarning ? (
            <View style={styles.gazeAlertBanner}>
              <View style={styles.gazeAlertIconCircle}>
                <Ionicons name="eye-off" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gazeAlertTitle}>{gazeWarning}</Text>
                <Text style={styles.gazeAlertCountdown}>
                  ⚠️ Malpractice Timer: {awaySeconds}s / 60s (Looking away &gt; 60s will VOID this interview)
                </Text>
              </View>
            </View>
          ) : null}

          {/* Sound wave visualizer when AI is speaking */}
          {aiSpeaking && (
            <View style={styles.aiWaveformBox}>
              <AudioWaveform isActive={true} color={Colors.primary} height={32} barCount={12} />
            </View>
          )}

          {/* Active Question Bubble Overlay */}
          <View style={styles.questionOverlay}>
            <View style={styles.questionMetaRow}>
              <Text style={styles.qIndexText}>
                QUESTION {questionIndex + 1} OF {totalQuestions}
              </Text>
              <Text style={styles.qCategoryText}>{sessionType} SESSION</Text>
            </View>
            <Text style={styles.questionText}>"{question?.questionText}"</Text>
          </View>

          {/* Candidate Floating Self-View (Picture-in-Picture) */}
          <View style={styles.candidateTile}>
            {cameraEnabled && cameraPermissionGranted ? (
              Platform.OS === 'web' ? (
                React.createElement('video', {
                  ref: (el: any) => {
                    webVideoRef.current = el;
                    if (el && mediaStreamRef.current) {
                      el.srcObject = mediaStreamRef.current;
                      el.play().catch(() => {});
                      if (eyeTrackerRef.current) {
                        eyeTrackerRef.current.start(el);
                      }
                    }
                  },
                  onloadedmetadata: () => {
                    if (webVideoRef.current && eyeTrackerRef.current) {
                      eyeTrackerRef.current.start(webVideoRef.current);
                    }
                  },
                  onplay: () => {
                    if (webVideoRef.current && eyeTrackerRef.current) {
                      eyeTrackerRef.current.start(webVideoRef.current);
                    }
                  },
                  autoPlay: true,
                  playsInline: true,
                  muted: true,
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    borderRadius: 12,
                    backgroundColor: '#101824',
                  },
                })
              ) : CameraView ? (
                <CameraView style={styles.nativeCamera} facing="front" />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Ionicons name="person" size={28} color={Colors.textMuted} />
                  <Text style={styles.cameraPlaceholderText}>Front Camera Active</Text>
                </View>
              )
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="videocam-off" size={22} color={Colors.textMuted} />
                <Text style={styles.cameraPlaceholderText}>
                  {!cameraPermissionGranted ? 'Camera Blocked' : 'Camera Off'}
                </Text>
                {!cameraPermissionGranted && Platform.OS !== 'web' && (
                  <TouchableOpacity
                    onPress={requestNativeCamera}
                    style={styles.enableCameraBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.enableCameraBtnText}>Grant Camera</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Gaze Status Tag */}
            <View
              style={[
                styles.gazeStatusBadge,
                gazeWarning ? styles.gazeStatusBadgeWarning : undefined,
              ]}
            >
              <Ionicons
                name={gazeWarning ? 'alert-circle' : 'eye'}
                size={9}
                color={gazeWarning ? '#FF3B30' : '#00F5D4'}
              />
              <Text
                style={[
                  styles.gazeStatusBadgeText,
                  gazeWarning && { color: '#FF3B30' },
                ]}
              >
                {gazeWarning ? `Away (${awaySeconds}s)` : 'Gaze: Screen'}
              </Text>
            </View>

            <View style={styles.candidateBadge}>
              <View
                style={[
                  styles.candidateDot,
                  { backgroundColor: micEnabled ? Colors.success : Colors.error },
                ]}
              />
              <Text style={styles.candidateBadgeText}>You (Candidate)</Text>
            </View>
          </View>
        </View>

        {/* Real-time Live Speech Transcript Overlay Box */}
        <View style={styles.transcriptContainer}>
          {Platform.OS !== 'web' && (
            <View style={styles.mobileSpeechHint}>
              <Ionicons name="mic-circle" size={15} color="#00F5D4" />
              <Text style={styles.mobileSpeechHintText}>
                Mobile: Tap below & use your phone keyboard mic 🎙️ (Voice Dictation) to speak or type.
              </Text>
            </View>
          )}
          <View style={styles.transcriptHeader}>
            <View style={styles.transcriptTitleRow}>
              <View
                style={[
                  styles.transcriptDot,
                  isAnswering && { backgroundColor: Colors.primary },
                ]}
              />
              <Text style={styles.transcriptTitle}>
                {isAnswering ? 'LIVE SPEECH TRANSCRIPTION' : 'YOUR SPOKEN ANSWER'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTranscriptInput((prev) => !prev)}
              style={styles.toggleEditBtn}
            >
              <Ionicons
                name={showTranscriptInput ? 'eye-outline' : 'pencil-outline'}
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.toggleEditText}>
                {showTranscriptInput ? 'Preview' : 'Edit Text'}
              </Text>
            </TouchableOpacity>
          </View>

          {showTranscriptInput ? (
            <TextInput
              style={styles.transcriptInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Your live speech will appear here. You can also type or edit..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          ) : (
            <ScrollView style={styles.transcriptScroll} nestedScrollEnabled>
              {speechStatus ? (
                <Text style={styles.speechStatusLine}>{speechStatus}</Text>
              ) : null}
              <Text
                style={[
                  styles.transcriptContent,
                  !userAnswer && styles.transcriptPlaceholder,
                ]}
              >
                {userAnswer
                  ? userAnswer
                  : isAnswering
                  ? 'Listening to your voice... Speak clearly into your microphone.'
                  : 'Press "Start Answering" below and speak. Your voice will automatically type here in real time.'}
              </Text>
            </ScrollView>
          )}

          {/* Real-time Live Microphone Volume Level Meter */}
          {isAnswering && (
            <View style={styles.micLevelRow}>
              <View style={styles.micLevelInfo}>
                <Ionicons
                  name="mic"
                  size={12}
                  color={micVolume > 5 ? '#00F5D4' : Colors.textMuted}
                />
                <Text style={styles.micLevelText}>
                  Mic Volume: {micVolume}%
                </Text>
                <Text
                  style={[
                    styles.micStatusTag,
                    micVolume > 5 && { color: '#00F5D4' },
                  ]}
                >
                  {micVolume > 5 ? '🟢 Sound Detected' : '⚪ Speak into mic...'}
                </Text>
              </View>
              <View style={styles.micTrack}>
                <View
                  style={[
                    styles.micFill,
                    { width: `${Math.max(6, micVolume)}%` },
                    micVolume > 5 && { backgroundColor: '#00F5D4' },
                  ]}
                />
              </View>
            </View>
          )}

          {isAnswering && (
            <View style={styles.waveformRow}>
              <AudioWaveform isActive={true} color={Colors.primary} height={20} barCount={18} />
            </View>
          )}
        </View>

        {/* AI Feedback Overlay (if evaluated) */}
        {feedback && (
          <View style={styles.feedbackOverlayCard}>
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={
                  feedback.status === 'CORRECT'
                    ? 'checkmark-circle'
                    : feedback.status === 'PARTIAL'
                    ? 'alert-circle'
                    : 'close-circle'
                }
                size={20}
                color={
                  feedback.status === 'CORRECT'
                    ? Colors.success
                    : feedback.status === 'PARTIAL'
                    ? Colors.warning
                    : Colors.error
                }
              />
              <Text style={styles.feedbackTitle}>
                Score: {feedback.score}/100 · {feedback.status}
              </Text>
              <Text style={styles.feedbackMetric}>
                Clarity: {feedback.clarityScore}% · Tech: {feedback.technicalAccuracyScore}%
              </Text>
            </View>
            <Text style={styles.feedbackSnippet} numberOfLines={2}>
              {feedback.feedbackText}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Video Call Control Bar */}
      <View style={styles.controlBar}>
        {/* Toggle Camera */}
        <TouchableOpacity
          style={[styles.controlIconBtn, !cameraEnabled && styles.controlIconBtnOff]}
          onPress={handleToggleCamera}
          activeOpacity={0.8}
        >
          <Ionicons
            name={cameraEnabled ? 'videocam' : 'videocam-off'}
            size={22}
            color={cameraEnabled ? Colors.textPrimary : Colors.error}
          />
        </TouchableOpacity>

        {/* Toggle Mic */}
        <TouchableOpacity
          style={[styles.controlIconBtn, !micEnabled && styles.controlIconBtnOff]}
          onPress={handleToggleMic}
          activeOpacity={0.8}
        >
          <Ionicons
            name={micEnabled ? 'mic' : 'mic-off'}
            size={22}
            color={micEnabled ? Colors.textPrimary : Colors.error}
          />
        </TouchableOpacity>

        {/* Main Speaking / Stop & Evaluate Action Button */}
        <TouchableOpacity
          style={[
            styles.mainAnswerBtn,
            isAnswering && styles.mainAnswerBtnActive,
            submitting && styles.mainAnswerBtnDisabled,
          ]}
          onPress={isAnswering ? onStopAnswering : onStartAnswering}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Ionicons
              name={isAnswering ? 'stop' : 'mic'}
              size={22}
              color={isAnswering ? '#FFF' : Colors.background}
            />
          )}
          <Text
            style={[
              styles.mainAnswerBtnText,
              isAnswering && { color: '#FFF' },
            ]}
          >
            {submitting
              ? 'Evaluating...'
              : isAnswering
              ? 'Finish Answer'
              : 'Start Answering'}
          </Text>
        </TouchableOpacity>

        {/* Next Question / Finish Button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={
            questionIndex >= totalQuestions - 1
              ? onFinishInterview
              : onNextQuestion
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              questionIndex >= totalQuestions - 1
                ? 'checkmark-done'
                : 'arrow-forward'
            }
            size={20}
            color={Colors.textPrimary}
          />
          <Text style={styles.nextBtnText}>
            {questionIndex >= totalQuestions - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05090E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#121C2B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  proctorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  proctorPillWarning: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.6)',
  },
  proctorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
  },
  proctorText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#00F5D4',
    letterSpacing: 0.6,
  },
  topGazeWarningBanner: {
    backgroundColor: '#D90429',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FF4D6D',
    zIndex: 9999,
  },
  topGazeWarningTitle: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
  },
  topGazeWarningTimer: {
    fontSize: 10,
    color: '#FFE5EC',
    marginTop: 1,
    fontWeight: Typography.medium,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1826',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  timerText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121D2D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#1E2F44',
  },
  switchModeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  videoArena: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  interviewerTile: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0C131F',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  interviewerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  interviewerHeaderOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  interviewerTag: {
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  interviewerName: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  interviewerRole: {
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  aiAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiAudioBtnActive: {
    backgroundColor: Colors.primary,
  },
  aiAudioText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  aiWaveformBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    zIndex: 10,
  },
  candidateTile: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 110,
    height: 145,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#0F1826',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    zIndex: 20,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nativeCamera: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121C2B',
  },
  cameraPlaceholderText: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  enableCameraBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enableCameraBtnText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  mobileSpeechHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  mobileSpeechHintText: {
    color: '#00F5D4',
    fontSize: 10,
    fontWeight: Typography.medium,
    flex: 1,
  },
  candidateBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 9, 14, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  candidateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  candidateBadgeText: {
    fontSize: 8,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  questionOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 130, // Leave room for candidate video tile
    backgroundColor: 'rgba(7, 12, 18, 0.92)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    zIndex: 10,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qIndexText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  qCategoryText: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  transcriptContainer: {
    backgroundColor: '#0C131F',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#192536',
    maxHeight: 110,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  transcriptTitle: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  toggleEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  toggleEditText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  transcriptScroll: {
    maxHeight: 50,
  },
  transcriptContent: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  transcriptPlaceholder: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  speechStatusLine: {
    fontSize: 11,
    color: '#00F5D4',
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  transcriptInput: {
    fontSize: 12,
    color: Colors.textPrimary,
    backgroundColor: '#121C2B',
    borderRadius: BorderRadius.sm,
    padding: 6,
    minHeight: 45,
    maxHeight: 70,
    textAlignVertical: 'top',
  },
  waveformRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  feedbackOverlayCard: {
    backgroundColor: 'rgba(12, 19, 31, 0.95)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  feedbackMetric: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  feedbackSnippet: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090F17',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#141E2D',
    gap: Spacing.sm,
  },
  controlIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#142030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F2F44',
  },
  controlIconBtnOff: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderColor: Colors.error,
  },
  mainAnswerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  mainAnswerBtnActive: {
    backgroundColor: '#FF3366',
    shadowColor: '#FF3366',
  },
  mainAnswerBtnDisabled: {
    opacity: 0.7,
  },
  mainAnswerBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.background,
    letterSpacing: 0.5,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#142030',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#1F2F44',
  },
  nextBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  gazeAlertBanner: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(235, 30, 60, 0.94)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FF4D6D',
    zIndex: 999,
    shadowColor: '#FF0033',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gazeAlertIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gazeAlertTitle: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  gazeAlertCountdown: {
    fontSize: 10,
    fontWeight: Typography.medium,
    color: '#FFE5EC',
    marginTop: 2,
  },
  gazeStatusBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 9, 14, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  gazeStatusBadgeWarning: {
    borderColor: 'rgba(255, 59, 48, 0.8)',
    backgroundColor: 'rgba(40, 10, 15, 0.9)',
  },
  gazeStatusBadgeText: {
    fontSize: 8,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },
  micLevelRow: {
    backgroundColor: '#0A121D',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#162334',
  },
  micLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  micLevelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  micStatusTag: {
    fontSize: 9,
    color: Colors.textMuted,
    marginLeft: 'auto',
    fontWeight: Typography.semiBold,
  },
  micTrack: {
    height: 4,
    backgroundColor: '#162232',
    borderRadius: 2,
    overflow: 'hidden',
  },
  micFill: {
    height: '100%',
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
});
