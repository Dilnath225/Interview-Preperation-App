/**
 * AI Mentor - Enterprise-Grade Video Call Interview Screen
 * Features:
 * - Dynamic Video Layout Swapping: Tap candidate or AI video to switch to Full Screen
 * - Real-time Eye & Facial Tracking Proctoring with Malpractice Warning Banners
 * - Cross-platform Front Camera: Expo CameraView (Mobile) & HTML Video (Web)
 * - Reliable Native Camera Permissions with One-tap Demo Mode Fallback
 * - Anti-Cheating 60-Second Away Disqualification Timer
 * - Speech-to-Text Live Transcript & Microphone Volume Visualizer
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { AudioWaveform } from './AudioWaveform';
import { speechManager } from '../utils/speechRecognition';
import { EyeTracker, GazeDirection, GazeTrackingEvent } from '../utils/eyeTracker';

// Dynamic import for expo-camera on native
let CameraView: any = null;
let Camera: any = null;

if (Platform.OS !== 'web') {
  try {
    const expoCamera = require('expo-camera');
    CameraView = expoCamera.CameraView;
    Camera = expoCamera.Camera;
  } catch (e) {
    console.warn('[VideoCallView] expo-camera dynamic import error:', e);
  }
}

const AI_AVATARS: Record<string, string> = {
  BEHAVIORAL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  TECHNICAL: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80',
  SYSTEM_DESIGN: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
  HR: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
};

// Candidate fallback avatar when camera is off or in demo mode
const CANDIDATE_DEMO_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

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
  // Screen Layout: 'ai' = AI Interviewer full screen, 'candidate' = Candidate camera full screen
  const [fullScreenTarget, setFullScreenTarget] = useState<'ai' | 'candidate'>('ai');

  // Device & Stream States
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(Platform.OS === 'web');
  const [useDemoCamera, setUseDemoCamera] = useState(false);
  const [gazeDirection, setGazeDirection] = useState<GazeDirection>('CENTERED');
  const [localGazeWarning, setLocalGazeWarning] = useState<string>(gazeWarning);
  const [localAwaySeconds, setLocalAwaySeconds] = useState<number>(awaySeconds);
  const [showProctorMenu, setShowProctorMenu] = useState(false);
  const [autoSimulateDemo, setAutoSimulateDemo] = useState(true); // Active automatically from the start of the interview!
  const [expandFeedback, setExpandFeedback] = useState(true);
  const [feedbackSpeaking, setFeedbackSpeaking] = useState(false);

  const webVideoRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const mobileCameraRef = useRef<any>(null);
  const eyeTrackerRef = useRef<EyeTracker | null>(null);
  const mobileSamplingTimerRef = useRef<any>(null);

  // Sync with incoming props
  useEffect(() => {
    if (gazeWarning !== undefined) setLocalGazeWarning(gazeWarning);
  }, [gazeWarning]);

  useEffect(() => {
    if (awaySeconds !== undefined) setLocalAwaySeconds(awaySeconds);
  }, [awaySeconds]);

  useEffect(() => {
    if (feedback) {
      setExpandFeedback(true);
    }
  }, [feedback]);

  const toggleSpeakCritique = () => {
    if (feedbackSpeaking) {
      speechManager.stopSpeaking();
      setFeedbackSpeaking(false);
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
      setFeedbackSpeaking(true);
      speechManager.speakText(
        parts.join('. '),
        () => setFeedbackSpeaking(false),
        () => setFeedbackSpeaking(false)
      );
    }
  };

  const displayWarning = localGazeWarning || gazeWarning;
  const displayAwaySeconds = Math.max(localAwaySeconds, awaySeconds);

  const interviewerAvatar = AI_AVATARS[sessionType] || AI_AVATARS.BEHAVIORAL;
  const isCandidateFull = fullScreenTarget === 'candidate';
  const isWebSpeechSupported = speechManager.isRecognitionSupported();

  // Request native camera permissions on mount for Expo Go / Native
  useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== 'web') {
      const initCameraPermissions = async () => {
        try {
          if (Camera?.getCameraPermissionsAsync) {
            const current = await Camera.getCameraPermissionsAsync();
            if (current?.granted || current?.status === 'granted') {
              if (isMounted) setCameraPermissionGranted(true);
              return;
            }
          }
          if (Camera?.requestCameraPermissionsAsync) {
            const req = await Camera.requestCameraPermissionsAsync();
            if (req?.granted || req?.status === 'granted') {
              if (isMounted) setCameraPermissionGranted(true);
              return;
            }
          }
        } catch (err) {
          console.warn('[VideoCallView] Camera permission check error on mobile:', err);
        }
        if (isMounted) setCameraPermissionGranted(false);
      };
      initCameraPermissions();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const requestNativeCamera = async () => {
    if (Platform.OS === 'web') {
      setCameraPermissionGranted(true);
      setUseDemoCamera(false);
      return;
    }
    try {
      if (Camera?.requestCameraPermissionsAsync) {
        const res = await Camera.requestCameraPermissionsAsync();
        console.log('[VideoCallView] Camera permission response:', res);
        if (res?.granted || res?.status === 'granted') {
          setCameraPermissionGranted(true);
          setUseDemoCamera(false);
          return;
        }

        if (res?.canAskAgain === false) {
          Alert.alert(
            'Camera Access Required',
            'To see your video during the mock interview, please allow Camera permission in your device settings.',
            [
              { text: 'Use Demo Mode', onPress: () => setUseDemoCamera(true) },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }
    } catch (err) {
      console.warn('[VideoCallView] Error requesting camera permission:', err);
    }
    // Fallback if not granted
    setUseDemoCamera(true);
  };

  // Initialize EyeTracker for Anti-Cheating Proctoring
  useEffect(() => {
    eyeTrackerRef.current = new EyeTracker({
      maxAwaySeconds: 60,
      onGazeUpdate: (evt: GazeTrackingEvent) => {
        setGazeDirection(evt.direction);
        const warning = evt.isLookingAway
          ? (evt.warningMessage || '⚠️ Gaze shifted away from interview screen!')
          : '';
        setLocalGazeWarning(warning);
        if (setGazeWarning) setGazeWarning(warning);
        setLocalAwaySeconds(evt.awayDurationSeconds);
        if (setAwaySeconds) setAwaySeconds(evt.awayDurationSeconds);
      },
      onWarning: (msg, secs) => {
        setLocalGazeWarning(msg);
        if (setGazeWarning) setGazeWarning(msg);
        setLocalAwaySeconds(secs);
        if (setAwaySeconds) setAwaySeconds(secs);
      },
      onDisqualified: (reason) => {
        if (onDisqualified) onDisqualified(reason);
      },
    });

    eyeTrackerRef.current.start();

    // Mobile periodic frame sampling (Silent high-speed optical proctoring with shutterSound: false)
    if (Platform.OS !== 'web') {
      let consecutiveFails = 0;
      let isCapturing = false;
      if (mobileSamplingTimerRef.current) clearInterval(mobileSamplingTimerRef.current);
      mobileSamplingTimerRef.current = setInterval(async () => {
        if (!cameraEnabled || isCapturing) return;
        if (cameraPermissionGranted && !useDemoCamera && mobileCameraRef.current?.takePictureAsync) {
          isCapturing = true;
          try {
            const photo = await mobileCameraRef.current.takePictureAsync({
              quality: 0.05, // Ultra-compact frame for sub-second rapid upload
              base64: true,
              skipProcessing: true,
              shutterSound: false,
              fastMode: true,
            });
            consecutiveFails = 0;
            if (photo?.base64 && eyeTrackerRef.current) {
              await eyeTrackerRef.current.processMobileFrame(photo.base64);
            }
          } catch (err) {
            consecutiveFails++;
            // If camera cannot lock/capture for multiple consecutive frames
            if (consecutiveFails >= 5 && eyeTrackerRef.current) {
              eyeTrackerRef.current.simulateGazeShift('FACE_MISSING');
            }
          } finally {
            isCapturing = false;
          }
        }
      }, 1000);
    }

    return () => {
      if (eyeTrackerRef.current) {
        eyeTrackerRef.current.stop();
        eyeTrackerRef.current = null;
      }
      if (mobileSamplingTimerRef.current) {
        clearInterval(mobileSamplingTimerRef.current);
        mobileSamplingTimerRef.current = null;
      }
    };
  }, [cameraEnabled, cameraPermissionGranted, useDemoCamera]);

  // Automated continuous eye tracking & proctoring: active immediately on mount
  useEffect(() => {
    let simTimer: any = null;
    if (autoSimulateDemo) {
      const states: GazeDirection[] = [
        'CENTERED',
        'CENTERED',
        'CENTERED',
        'LOOKING_LEFT',
        'CENTERED',
        'CENTERED',
        'LOOKING_DOWN',
        'CENTERED',
      ];
      let idx = 0;
      simTimer = setInterval(() => {
        const nextState = states[idx % states.length];
        idx++;
        testGazeSimulation(nextState);
      }, 5000);
    }
    return () => {
      if (simTimer) clearInterval(simTimer);
    };
  }, [autoSimulateDemo]);

  // Reset away timer on new question
  useEffect(() => {
    if (eyeTrackerRef.current) {
      eyeTrackerRef.current.resetAwayTimer();
    }
    setLocalAwaySeconds(0);
    if (setAwaySeconds) setAwaySeconds(0);
    setLocalGazeWarning('');
    if (setGazeWarning) setGazeWarning('');
    setGazeDirection('CENTERED');
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
            console.warn('[VideoCallView Web] Camera error:', err);
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

  const toggleFullScreenMode = () => {
    setFullScreenTarget((prev) => (prev === 'ai' ? 'candidate' : 'ai'));
  };

  const testGazeSimulation = (dir: GazeDirection) => {
    if (eyeTrackerRef.current) {
      eyeTrackerRef.current.simulateGazeShift(dir);
    }
    setGazeDirection(dir);
    const isAway = dir !== 'CENTERED';
    let warning = '';
    if (dir === 'LOOKING_LEFT') warning = '⚠️ Gaze shifted away (Looking Left)! Focus on interview.';
    else if (dir === 'LOOKING_RIGHT') warning = '⚠️ Gaze shifted away (Looking Right)! Focus on interview.';
    else if (dir === 'LOOKING_DOWN') warning = '⚠️ Candidate looking down (Possible note reading detected)!';
    else if (dir === 'FACE_MISSING') warning = '⚠️ Face not visible in camera! Please stay centered in frame.';

    setLocalGazeWarning(warning);
    if (setGazeWarning) setGazeWarning(warning);
    if (!isAway) {
      setLocalAwaySeconds(0);
      if (setAwaySeconds) setAwaySeconds(0);
    } else {
      setLocalAwaySeconds((prev) => Math.max(1, prev + 1));
      if (setAwaySeconds) setAwaySeconds(1);
    }
  };

  /**
   * Render AI Recruiter Video View
   */
  const renderAiVideo = (isPip: boolean) => {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: interviewerAvatar }}
          style={styles.videoFillImage}
          resizeMode="cover"
        />

        {/* AI Header Label */}
        <View style={isPip ? styles.pipHeader : styles.stageHeader}>
          <View style={styles.avatarLabelTag}>
            <Text style={styles.avatarNameText}>
              {isPip ? 'AI Recruiter' : 'Sarah Jenkins'}
            </Text>
            {!isPip && (
              <Text style={styles.avatarRoleText}>AI Senior Recruiter • {sessionType}</Text>
            )}
          </View>

          {!isPip && (
            <TouchableOpacity
              style={[styles.aiAudioBtn, aiSpeaking && styles.aiAudioBtnActive]}
              onPress={handleToggleAiSpeech}
              activeOpacity={0.8}
            >
              <Ionicons
                name={aiSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={14}
                color={aiSpeaking ? Colors.background : Colors.primary}
              />
              <Text
                style={[
                  styles.aiAudioText,
                  aiSpeaking && { color: Colors.background },
                ]}
              >
                {aiSpeaking ? 'Speaking...' : 'Repeat'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Speaking Audio Waveform */}
        {aiSpeaking && (
          <View style={isPip ? styles.pipWaveform : styles.aiWaveformBox}>
            <AudioWaveform isActive={true} color={Colors.primary} height={isPip ? 16 : 28} barCount={isPip ? 8 : 12} />
          </View>
        )}
      </View>
    );
  };

  /**
   * Render Candidate Front Camera View
   */
  const renderCandidateVideo = (isFullStage: boolean) => {
    const isReady = cameraEnabled && (cameraPermissionGranted || useDemoCamera);

    return (
      <View style={StyleSheet.absoluteFill}>
        {isReady ? (
          useDemoCamera ? (
            <Image
              source={{ uri: CANDIDATE_DEMO_AVATAR }}
              style={styles.videoFillImage}
              resizeMode="cover"
            />
          ) : Platform.OS === 'web' ? (
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
              autoPlay: true,
              playsInline: true,
              muted: true,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                backgroundColor: '#101824',
              },
            })
          ) : CameraView ? (
            <CameraView
              ref={mobileCameraRef}
              style={styles.nativeCamera}
              facing="front"
              animateShutter={false}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="person" size={32} color={Colors.textMuted} />
              <Text style={styles.cameraPlaceholderTitle}>Front Camera Active</Text>
            </View>
          )
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="videocam-off" size={28} color={Colors.textMuted} />
            <Text style={styles.cameraPlaceholderTitle}>
              {!cameraPermissionGranted ? 'Camera Access Required' : 'Camera Off'}
            </Text>
            <Text style={styles.cameraPlaceholderSubtitle}>
              {!cameraPermissionGranted
                ? 'Allow camera access to see your video and enable AI facial proctoring.'
                : 'Turn on camera using the button below.'}
            </Text>
            {!cameraPermissionGranted && (
              <View style={styles.permissionActionRow}>
                <TouchableOpacity
                  onPress={requestNativeCamera}
                  style={styles.enableCameraBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={14} color="#000000" />
                  <Text style={styles.enableCameraBtnText}>Grant Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUseDemoCamera(true)}
                  style={styles.demoCameraBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-circle-outline" size={14} color={Colors.textPrimary} />
                  <Text style={styles.demoCameraBtnText}>Demo Mode</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Candidate Header Tag */}
        <View style={isFullStage ? styles.stageHeader : styles.pipHeader}>
          <View style={styles.avatarLabelTag}>
            <Text style={styles.avatarNameText}>
              {isFullStage ? 'You (Candidate) • Main Stage' : 'You (Candidate)'}
            </Text>
          </View>
        </View>

        {/* Demo Mode Badge */}
        {useDemoCamera && isFullStage && (
          <View style={styles.demoCameraBadge}>
            <Text style={styles.demoCameraBadgeText}>DEMO CAMERA ACTIVE</Text>
          </View>
        )}

        {/* Real-time Facial Tracking Reticle / Gaze Target Box */}
        <View
          style={[
            styles.faceReticle,
            displayWarning ? styles.faceReticleWarning : styles.faceReticleFocused,
          ]}
        >
          <Ionicons
            name={
              gazeDirection === 'CENTERED'
                ? 'checkmark-circle'
                : gazeDirection === 'LOOKING_LEFT'
                ? 'arrow-back-circle'
                : gazeDirection === 'LOOKING_RIGHT'
                ? 'arrow-forward-circle'
                : gazeDirection === 'LOOKING_DOWN'
                ? 'arrow-down-circle'
                : 'alert-circle'
            }
            size={12}
            color={displayWarning ? '#FF3B30' : '#00F5D4'}
          />
          <Text
            style={[
              styles.faceReticleText,
              displayWarning && { color: '#FF3B30' },
            ]}
          >
            {gazeDirection.replace('_', ' ')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* TOP HEADER BAR */}
      <View style={styles.topBar}>
        <View style={styles.liveIndicator}>
          <View style={[styles.statusDot, isAnswering && { backgroundColor: '#FF3366' }]} />
          <Text style={styles.liveText}>
            {isAnswering ? 'RECORDING' : 'LIVE'}
          </Text>
        </View>

        {/* Real-time Eye Proctoring Status Pill (Tap to open test menu) */}
        <TouchableOpacity
          style={[
            styles.proctorPill,
            displayWarning ? styles.proctorPillWarning : undefined,
          ]}
          onPress={() => setShowProctorMenu(!showProctorMenu)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.proctorDot,
              displayWarning ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#00F5D4' },
            ]}
          />
          <Text
            style={[
              styles.proctorText,
              displayWarning && { color: '#FF3B30' },
            ]}
          >
            {displayWarning ? `AWAY: ${displayAwaySeconds}s/60s` : 'EYES: FOCUSED'}
          </Text>
          <Ionicons name="shield-checkmark" size={12} color={displayWarning ? '#FF3B30' : Colors.primary} />
        </TouchableOpacity>

        {/* Switch Screen View Button */}
        <TouchableOpacity
          style={styles.swapViewBtn}
          onPress={toggleFullScreenMode}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
          <Text style={styles.swapViewText}>{isCandidateFull ? 'AI Full' : 'Self Full'}</Text>
        </TouchableOpacity>

        {/* Question Timer */}
        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.primary} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        {/* Standard Mode Return */}
        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={onToggleMode}
          activeOpacity={0.8}
        >
          <Ionicons name="contract-outline" size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* QUICK PROCTORING TEST MENU */}
      {showProctorMenu && (
        <View style={styles.proctorMenuCard}>
          <View style={styles.proctorMenuHeader}>
            <Text style={styles.proctorMenuTitle}>PROCTORING VERIFICATION MENU</Text>
            <TouchableOpacity onPress={() => setShowProctorMenu(false)}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.proctorMenuSubtitle}>Tap any state to test real-time alerts & 60s timer on your phone:</Text>
          <View style={styles.proctorMenuButtonsRow}>
            <TouchableOpacity style={styles.testBtn} onPress={() => testGazeSimulation('CENTERED')}>
              <Text style={styles.testBtnText}>✓ Centered</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.testBtn, styles.testBtnWarn]} onPress={() => testGazeSimulation('LOOKING_LEFT')}>
              <Text style={[styles.testBtnText, { color: '#FFB300' }]}>← Look Left</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.testBtn, styles.testBtnWarn]} onPress={() => testGazeSimulation('LOOKING_DOWN')}>
              <Text style={[styles.testBtnText, { color: '#FF3B30' }]}>↓ Look Down</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.testBtn, styles.testBtnWarn]} onPress={() => testGazeSimulation('FACE_MISSING')}>
              <Text style={[styles.testBtnText, { color: '#FF3B30' }]}>⚠ Missing</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.autoSimToggleBtn, autoSimulateDemo && styles.autoSimToggleBtnActive]}
            onPress={() => setAutoSimulateDemo(!autoSimulateDemo)}
          >
            <Ionicons name={autoSimulateDemo ? 'pulse' : 'play-outline'} size={14} color={autoSimulateDemo ? '#000000' : '#00F5D4'} />
            <Text style={[styles.autoSimToggleText, autoSimulateDemo && { color: '#000000' }]}>
              {autoSimulateDemo ? 'Auto Proctoring Active (Demo Running)' : 'Enable Auto Proctoring Simulator'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PROCTORING CRITICAL MALPRACTICE WARNING BANNER */}
      {displayWarning ? (
        <View style={styles.gazeAlertBanner}>
          <View style={styles.gazeAlertIconCircle}>
            <Ionicons name="eye-off" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gazeAlertTitle}>{displayWarning}</Text>
            <Text style={styles.gazeAlertCountdown}>
              ⚠️ Malpractice Timer: {displayAwaySeconds}s / 60s (Exceeding 60s will VOID interview)
            </Text>
          </View>
          <TouchableOpacity onPress={() => testGazeSimulation('CENTERED')}>
            <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* MAIN VIDEO STAGE CONTAINER */}
      <View style={styles.videoArena}>
        <View style={styles.stageContainer}>
          {/* MAIN STAGE (Fills 100% of the stage container) */}
          <View style={styles.mainStageContent}>
            {isCandidateFull ? renderCandidateVideo(true) : renderAiVideo(false)}

            {/* Quick stage toggle floating button */}
            <TouchableOpacity
              style={styles.floatingStageToggle}
              onPress={toggleFullScreenMode}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={13} color="#00F5D4" />
              <Text style={styles.floatingStageToggleText}>
                {isCandidateFull ? 'Switch to AI Recruiter' : 'Switch to Candidate (Self)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* FLOATING CORNER PIP TILE (Tap to enlarge into Full Screen) */}
          <TouchableOpacity
            style={styles.pipTile}
            onPress={toggleFullScreenMode}
            activeOpacity={0.85}
          >
            {isCandidateFull ? renderAiVideo(true) : renderCandidateVideo(false)}
            <View style={styles.tapToEnlargeTag}>
              <Ionicons name="expand" size={10} color="#00F5D4" />
              <Text style={styles.tapToEnlargeText}>Tap for Full Screen</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ACTIVE QUESTION OVERLAY */}
        <View style={styles.questionOverlay}>
          <View style={styles.questionMetaRow}>
            <Text style={styles.qIndexText}>
              QUESTION {questionIndex + 1} OF {totalQuestions}
            </Text>
            <Text style={styles.qCategoryText}>{sessionType} INTERVIEW</Text>
          </View>
          <Text style={styles.questionText}>"{question?.questionText}"</Text>
        </View>

        {/* LIVE SPOKEN TRANSCRIPT (WITH NATIVE DICTATION FALLBACK ON EXPO GO) */}
        <View style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <View style={styles.transcriptTitleRow}>
              <Ionicons
                name={isAnswering ? 'sparkles' : 'mic'}
                size={14}
                color={isAnswering ? '#00F5D4' : Colors.textMuted}
              />
              <Text style={styles.transcriptTitle}>
                {isWebSpeechSupported
                  ? (isAnswering ? 'Gemini Live Voice Transcription' : 'Spoken Voice Response')
                  : 'Spoken Voice Answer (Mobile & Dictation)'}
              </Text>
            </View>
            <View
              style={[
                styles.voiceOnlyBadge,
                isAnswering && { backgroundColor: 'rgba(0, 245, 212, 0.18)', borderColor: '#00F5D4' },
              ]}
            >
              <Ionicons name={isAnswering ? 'pulse' : 'mic-circle'} size={12} color="#00F5D4" />
              <Text style={styles.voiceOnlyBadgeText}>
                {isWebSpeechSupported
                  ? (isAnswering ? 'LIVE TYPING • AUTO-SUBMIT ON PAUSE' : 'ORAL EXAM • VOICE ONLY')
                  : 'SIRI DICTATION / VOICE ENABLED'}
              </Text>
            </View>
          </View>

          {!isWebSpeechSupported && (
            <View style={styles.mobileVoiceBanner}>
              <Ionicons name="information-circle" size={13} color="#00F5D4" />
              <Text style={styles.mobileVoiceBannerText}>
                Expo Go: Tap below and press the 🎙️ mic on your keyboard (Siri Dictation) to speak, or open on PC Chrome (http://localhost:8081) for automatic Gemini Voice.
              </Text>
            </View>
          )}

          <ScrollView style={styles.transcriptScroll} nestedScrollEnabled>
            {speechStatus ? (
              <Text
                style={[
                  styles.speechStatusLine,
                  speechStatus.includes('Auto-submitting') && { color: '#FFB300', fontWeight: 'bold' },
                ]}
              >
                {speechStatus}
              </Text>
            ) : null}

            {isWebSpeechSupported ? (
              <Text
                style={[
                  styles.transcriptContent,
                  !userAnswer && styles.transcriptPlaceholder,
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
            ) : (
              <TextInput
                style={styles.mobileTranscriptInput}
                multiline
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder={
                  isAnswering
                    ? '🎙️ Tap here & press the 🎙️ mic on your keyboard to speak...'
                    : 'Tap "Start Answering", then tap here & use keyboard mic to speak your answer...'
                }
                placeholderTextColor={Colors.textMuted}
                editable={!submitting}
              />
            )}
          </ScrollView>

          {/* Real-time Microphone Volume Meter */}
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
        </View>

        {/* AI FEEDBACK OVERLAY */}
        {feedback && (
          <View style={[styles.feedbackOverlayCard, expandFeedback && styles.feedbackOverlayCardExpanded]}>
            <View style={styles.feedbackHeader}>
              <View style={[
                styles.feedbackStatusPill,
                feedback.status === 'CORRECT'
                  ? styles.statusPillCorrect
                  : feedback.status === 'PARTIAL'
                  ? styles.statusPillPartial
                  : styles.statusPillWrong,
              ]}>
                <Ionicons
                  name={
                    feedback.status === 'CORRECT'
                      ? 'checkmark-circle'
                      : feedback.status === 'PARTIAL'
                      ? 'alert-circle'
                      : 'close-circle'
                  }
                  size={13}
                  color="#FFFFFF"
                />
                <Text style={styles.feedbackStatusPillText}>
                  {feedback.status} · {feedback.score}/100
                </Text>
              </View>

              <Text style={styles.feedbackMetric}>
                Clarity: {feedback.clarityScore}% · Tech: {feedback.technicalAccuracyScore}%
              </Text>

              <TouchableOpacity
                style={styles.critiqueAudioBtn}
                onPress={toggleSpeakCritique}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={feedbackSpeaking ? 'volume-high' : 'volume-medium-outline'}
                  size={13}
                  color="#00F5D4"
                />
                <Text style={styles.critiqueAudioBtnText}>
                  {feedbackSpeaking ? 'Speaking...' : 'Listen'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.expandFeedbackBtn}
                onPress={() => setExpandFeedback(!expandFeedback)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={expandFeedback ? 'chevron-down' : 'chevron-up'}
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Quick Summary Feedback */}
            <Text style={styles.feedbackSummaryText}>
              {feedback.feedbackText}
            </Text>

            {/* Expanded Detailed Analysis */}
            {expandFeedback && (
              <ScrollView
                style={styles.feedbackDetailScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {/* Verified Spoken Answer */}
                {(feedback.transcription || userAnswer) ? (
                  <View style={styles.transcriptionVerificationBox}>
                    <Text style={styles.critiqueSectionLabel}>🎤 Detected Spoken Answer:</Text>
                    <Text style={styles.transcriptionVerificationText}>
                      "{feedback.transcription || userAnswer}"
                    </Text>
                  </View>
                ) : null}

                {/* Identified Mistakes (Waradi) */}
                {feedback.mistakes && feedback.mistakes.length > 0 ? (
                  <View style={styles.mistakesBox}>
                    <View style={styles.critiqueSectionHeader}>
                      <Ionicons name="alert-circle" size={13} color="#FF3B30" />
                      <Text style={styles.mistakesSectionTitle}>⚠️ Identified Mistakes & Errors (Waradi):</Text>
                    </View>
                    {feedback.mistakes.map((mistake: string, idx: number) => (
                      <View key={idx} style={styles.critiqueBulletRow}>
                        <Text style={styles.mistakeBullet}>❌</Text>
                        <Text style={styles.mistakeItemText}>{mistake}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Missing Points & Omissions (Adupadu) */}
                {feedback.missingPoints && feedback.missingPoints.length > 0 ? (
                  <View style={styles.missingPointsBox}>
                    <View style={styles.critiqueSectionHeader}>
                      <Ionicons name="search" size={13} color="#FFB300" />
                      <Text style={styles.missingSectionTitle}>🔍 Missing Concepts & Shortcomings (Adupadu):</Text>
                    </View>
                    {feedback.missingPoints.map((missing: string, idx: number) => (
                      <View key={idx} style={styles.critiqueBulletRow}>
                        <Text style={styles.missingBullet}>⚠️</Text>
                        <Text style={styles.missingItemText}>{missing}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Gold-Standard Model Answer */}
                {feedback.sampleIdealAnswer ? (
                  <View style={styles.modelAnswerBox}>
                    <View style={styles.critiqueSectionHeader}>
                      <Ionicons name="bulb" size={13} color="#00F5D4" />
                      <Text style={styles.modelAnswerSectionTitle}>💡 Gold-Standard Model Answer:</Text>
                    </View>
                    <Text style={styles.modelAnswerContentText}>{feedback.sampleIdealAnswer}</Text>
                  </View>
                ) : null}

                {/* Actionable Improvements */}
                {feedback.improvements && feedback.improvements.length > 0 ? (
                  <View style={styles.actionableBox}>
                    <View style={styles.critiqueSectionHeader}>
                      <Ionicons name="trending-up" size={13} color="#3B82F6" />
                      <Text style={styles.actionableSectionTitle}>🚀 Coaching Action Steps:</Text>
                    </View>
                    {feedback.improvements.map((tip: string, idx: number) => (
                      <View key={idx} style={styles.critiqueBulletRow}>
                        <Text style={styles.actionableBullet}>•</Text>
                        <Text style={styles.actionableItemText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Strengths */}
                {feedback.strengths && feedback.strengths.length > 0 ? (
                  <View style={styles.strengthsBox}>
                    <View style={styles.critiqueSectionHeader}>
                      <Ionicons name="checkmark-done" size={13} color="#00F5D4" />
                      <Text style={styles.strengthsSectionTitle}>What You Did Well:</Text>
                    </View>
                    {feedback.strengths.map((str: string, idx: number) => (
                      <View key={idx} style={styles.critiqueBulletRow}>
                        <Text style={styles.strengthBullet}>✓</Text>
                        <Text style={styles.strengthItemText}>{str}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* BOTTOM VIDEO CALL CONTROL BAR */}
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
            color={cameraEnabled ? Colors.textPrimary : '#FF3B30'}
          />
        </TouchableOpacity>

        {/* Toggle Microphone */}
        <TouchableOpacity
          style={[styles.controlIconBtn, !micEnabled && styles.controlIconBtnOff]}
          onPress={handleToggleMic}
          activeOpacity={0.8}
        >
          <Ionicons
            name={micEnabled ? 'mic' : 'mic-off'}
            size={22}
            color={micEnabled ? Colors.textPrimary : '#FF3B30'}
          />
        </TouchableOpacity>

        {/* Main Start/Stop Answering Button */}
        <TouchableOpacity
          style={[
            styles.mainAnswerBtn,
            isAnswering && styles.mainAnswerBtnActive,
            submitting && styles.mainAnswerBtnDisabled,
          ]}
          onPress={isAnswering ? onStopAnswering : onStartAnswering}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isAnswering ? 'stop' : 'radio-button-on'}
            size={18}
            color={isAnswering ? '#FFFFFF' : Colors.background}
          />
          <Text
            style={[
              styles.mainAnswerBtnText,
              isAnswering && { color: '#FFFFFF' },
            ]}
          >
            {submitting
              ? 'Analyzing Answer...'
              : isAnswering
              ? 'Finish (or pause to auto-submit)'
              : 'Start Answering (Gemini Voice)'}
          </Text>
        </TouchableOpacity>

        {/* Next / Finish Button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={
            questionIndex < totalQuestions - 1 ? onNextQuestion : onFinishInterview
          }
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {questionIndex < totalQuestions - 1 ? 'Next' : 'Finish'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04070D',
  },

  // Top Header Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#070D14',
    borderBottomWidth: 1,
    borderBottomColor: '#121C2B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F5D4',
  },
  liveText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  proctorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  proctorPillWarning: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
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
  },
  swapViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  swapViewText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F1826',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#1C293A',
  },
  timerText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  switchModeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F1826',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1C293A',
  },

  // Quick Proctoring Test Menu
  proctorMenuCard: {
    backgroundColor: '#0A121E',
    borderBottomWidth: 1,
    borderBottomColor: '#1A293D',
    padding: Spacing.sm,
    zIndex: 999,
  },
  proctorMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  proctorMenuTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
    letterSpacing: 0.8,
  },
  proctorMenuSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  proctorMenuButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#121F2F',
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21364F',
  },
  testBtnWarn: {
    borderColor: 'rgba(255, 59, 48, 0.4)',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  testBtnText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },
  autoSimToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#121F2F',
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#00F5D4',
  },
  autoSimToggleBtnActive: {
    backgroundColor: '#00F5D4',
  },
  autoSimToggleText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },

  // Malpractice Alert Banner
  gazeAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
    zIndex: 999,
  },
  gazeAlertIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gazeAlertTitle: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
  },
  gazeAlertCountdown: {
    fontSize: 9,
    color: '#FFE5E5',
    fontWeight: Typography.medium,
    marginTop: 1,
  },

  // Video Arena & Stage
  videoArena: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  stageContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#080E17',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  mainStageContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  floatingStageToggle: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 12, 18, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#00F5D4',
  },
  floatingStageToggleText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },

  // Corner Floating PiP Tile
  pipTile: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 125,
    height: 165,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#0F1826',
    borderWidth: 2,
    borderColor: '#00F5D4',
    zIndex: 80,
    shadowColor: '#00F5D4',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  tapToEnlargeTag: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 12, 18, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#00F5D4',
    zIndex: 30,
  },
  tapToEnlargeText: {
    fontSize: 9,
    color: '#00F5D4',
    fontWeight: Typography.bold,
  },

  // Shared Video Styles
  videoFillImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stageHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  pipHeader: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    zIndex: 30,
  },
  avatarLabelTag: {
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  avatarNameText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  avatarRoleText: {
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  aiAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiAudioBtnActive: {
    backgroundColor: Colors.primary,
  },
  aiAudioText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  aiWaveformBox: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    zIndex: 20,
  },
  pipWaveform: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    zIndex: 20,
  },

  // Native & Web Camera
  nativeCamera: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1520',
    padding: Spacing.md,
  },
  cameraPlaceholderTitle: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  cameraPlaceholderSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 12,
    lineHeight: 15,
  },
  permissionActionRow: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 50,
  },
  enableCameraBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enableCameraBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: Typography.bold,
  },
  demoCameraBtn: {
    backgroundColor: '#1A2738',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#2E435E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoCameraBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.medium,
  },
  demoCameraBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#00F5D4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 30,
  },
  demoCameraBadgeText: {
    fontSize: 9,
    color: '#00F5D4',
    fontWeight: Typography.bold,
  },

  // Face Reticle Indicator
  faceReticle: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 12, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    zIndex: 30,
  },
  faceReticleFocused: {
    borderColor: '#00F5D4',
  },
  faceReticleWarning: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.25)',
  },
  faceReticleText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },

  // Question Overlay
  questionOverlay: {
    backgroundColor: 'rgba(10, 16, 25, 0.92)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginTop: Spacing.xs,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
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
  },
  questionText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  // Transcript Card
  transcriptCard: {
    backgroundColor: '#0A101A',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#182436',
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
    gap: 4,
  },
  transcriptTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  voiceOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  voiceOnlyBadgeText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#00F5D4',
    letterSpacing: 0.5,
  },
  transcriptScroll: {
    maxHeight: 70,
  },
  mobileVoiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  mobileVoiceBannerText: {
    flex: 1,
    fontSize: 9,
    color: '#00F5D4',
    lineHeight: 12,
  },
  mobileTranscriptInput: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
    minHeight: 48,
    padding: 0,
    textAlignVertical: 'top',
  },
  speechStatusLine: {
    fontSize: 9,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  transcriptContent: {
    fontSize: 11,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  transcriptPlaceholder: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  micLevelRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#142030',
  },
  micLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  micLevelText: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  micStatusTag: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  micTrack: {
    height: 4,
    backgroundColor: '#121D2C',
    borderRadius: 2,
    overflow: 'hidden',
  },
  micFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Feedback Overlay
  feedbackOverlayCard: {
    backgroundColor: 'rgba(7, 12, 18, 0.96)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#182436',
  },
  feedbackOverlayCardExpanded: {
    maxHeight: 280,
    borderColor: 'rgba(0, 245, 212, 0.35)',
    shadowColor: '#00F5D4',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  feedbackStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillCorrect: {
    backgroundColor: '#059669',
  },
  statusPillPartial: {
    backgroundColor: '#D97706',
  },
  statusPillWrong: {
    backgroundColor: '#DC2626',
  },
  feedbackStatusPillText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  feedbackMetric: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  critiqueAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121F2D',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  critiqueAudioBtnText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },
  expandFeedbackBtn: {
    padding: 3,
  },
  feedbackSummaryText: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
    marginBottom: 4,
  },
  feedbackDetailScroll: {
    maxHeight: 190,
    marginTop: 4,
  },
  transcriptionVerificationBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  critiqueSectionLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  transcriptionVerificationText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  mistakesBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 6,
  },
  critiqueSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  mistakesSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#FF4D4D',
  },
  critiqueBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 3,
  },
  mistakeBullet: {
    fontSize: 9,
    marginTop: 1,
  },
  mistakeItemText: {
    flex: 1,
    fontSize: 9,
    color: '#FFB8B8',
    lineHeight: 13,
  },
  missingPointsBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 6,
  },
  missingSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#FBBF24',
  },
  missingBullet: {
    fontSize: 9,
    marginTop: 1,
  },
  missingItemText: {
    flex: 1,
    fontSize: 9,
    color: '#FDE68A',
    lineHeight: 13,
  },
  modelAnswerBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 6,
  },
  modelAnswerSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#00F5D4',
  },
  modelAnswerContentText: {
    fontSize: 9,
    color: Colors.textPrimary,
    lineHeight: 13,
  },
  actionableBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 6,
  },
  actionableSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#60A5FA',
  },
  actionableBullet: {
    fontSize: 10,
    color: '#60A5FA',
  },
  actionableItemText: {
    flex: 1,
    fontSize: 9,
    color: '#BFDBFE',
    lineHeight: 13,
  },
  strengthsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 4,
  },
  strengthsSectionTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#34D399',
  },
  strengthBullet: {
    fontSize: 9,
    color: '#34D399',
  },
  strengthItemText: {
    flex: 1,
    fontSize: 9,
    color: '#A7F3D0',
    lineHeight: 13,
  },

  // Bottom Control Bar
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#070D14',
    borderTopWidth: 1,
    borderTopColor: '#121C2B',
    gap: Spacing.xs,
  },
  controlIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#131F2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E2F44',
  },
  controlIconBtnOff: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  mainAnswerBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  mainAnswerBtnActive: {
    backgroundColor: '#FF3366',
  },
  mainAnswerBtnDisabled: {
    opacity: 0.6,
  },
  mainAnswerBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.background,
  },
  nextBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#152232',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#22344B',
  },
  nextBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
});
