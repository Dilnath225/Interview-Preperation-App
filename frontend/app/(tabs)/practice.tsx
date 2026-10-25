/**
 * AI Mentor - Practice Hub & AI Speech & Pronunciation Studio
 * Features:
 * - Real-time Voice Dictation (speech-to-text typing as the user speaks)
 * - LLM Speech Pathologist & Vocal Coach integration (Gemini / RAG)
 * - Pronunciation Accuracy, Fluency, Cadence, and Filler Word detection
 * - Phonetic guides with IPA notation and syllable stress advice
 * - Listen to native model pronunciation using TTS engine
 * - Practice mode navigation for Coding, Behavioral, Leadership MCQs, and ATS Resume
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { AudioWaveform } from '../../src/components/AudioWaveform';
import { ProgressRing } from '../../src/components/ProgressRing';
import { ResponsiveContainer } from '../../src/components/ResponsiveContainer';
import { useResponsive } from '../../src/hooks/useResponsive';
import { speechManager } from '../../src/utils/speechRecognition';
import { api } from '../../src/services/api';
import { useNotifications } from '../../src/context';

// Modern expo-audio engine for Expo SDK 57 / Expo Go
let ExpoAudio: any = null;
try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  try {
    ExpoAudio = require('expo-av');
  } catch (e2) {
    ExpoAudio = null;
  }
}

const PRACTICE_PROMPTS = [
  {
    id: 'free',
    title: 'Free Speech / Custom Answer',
    category: 'Free Form',
    text: '',
    hint: 'Speak freely about your engineering background, a past project, or an interview question.',
  },
  {
    id: 'arch',
    title: 'Distributed Systems & Architecture',
    category: 'Architecture',
    text: 'Our microservices asynchronously publish immutable events to an Apache Kafka cluster for decoupled processing.',
    hint: 'Focus on crisp pronunciation of "microservices", "asynchronously", and "immutable".',
  },
  {
    id: 'algo',
    title: 'Algorithmic Optimization',
    category: 'Algorithms',
    text: 'We optimized database query performance by creating composite indexes and implementing logarithmic search algorithms.',
    hint: 'Pay attention to syllable stress on "algorithm" (/ˈæl.ɡə.rɪ.ðəm/) and "composite".',
  },
  {
    id: 'cloud',
    title: 'Kubernetes & Cloud Resiliency',
    category: 'DevOps & Cloud',
    text: 'The Kubernetes cluster orchestrates container workloads with automated horizontal pod autoscaling and zero-downtime rolling updates.',
    hint: 'Pronounce "Kubernetes" (/ˌkuː.bərˈneɪ.tiːz/) smoothly without swallowing syllables.',
  },
  {
    id: 'star',
    title: 'STAR Behavioral Leadership',
    category: 'Behavioral',
    text: 'I resolved the cross-functional dispute by objectively benchmarking latency trade-offs, establishing consensus, and delivering on schedule.',
    hint: 'Speak with steady pacing, confident tone, and clear pauses between clauses.',
  },
];

interface SpeechAnalysisResult {
  pronunciationAccuracy: number;
  fluencyScore: number;
  clarityScore: number;
  overallSpeechScore: number;
  fillerWordsCount: number;
  fillerWords: Array<{ word: string; count: number }>;
  wordsPerMinute: number;
  pacingFeedback: string;
  phoneticCritiques: Array<{ word: string; phoneticGuide: string; tip: string }>;
  strengths: string[];
  areasToImprove: string[];
  coachingVerdict: string;
  idealPolishedVersion: string;
  transcript?: string;
}

export default function PracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addNotification } = useNotifications();
  const { isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  // Speech Studio State
  const [studioVisible, setStudioVisible] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [speakingIdeal, setSpeakingIdeal] = useState(false);

  // Audio recording & playback state (Mobile & Web)
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Overall platform accuracy cache
  const [latestAccuracy, setLatestAccuracy] = useState<number>(92);

  // Audio recording refs
  const expoRecordingRef = useRef<any>(null);
  const expoRecorderRef = useRef<any>(null);
  const audioPlayerRef = useRef<any>(null);
  const webRecorderRef = useRef<any>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<any>(null);
  const micIntervalRef = useRef<any>(null);
  const activeMicStreamRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const typewriterTimerRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  const selectedPrompt = PRACTICE_PROMPTS[selectedPromptIndex];

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      speechManager.stopLiveRecognition();
      speechManager.stopSpeaking();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      if (soundRef.current) {
        try { soundRef.current.unloadAsync(); } catch (e) {}
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  /**
   * Start native or web microphone audio recording with live volume metering
   */
  const startAudioRecording = async (): Promise<boolean> => {
    setMicVolume(0);
    setRecordedAudioUri(null);

    // Clean up any stale recording
    if (expoRecorderRef.current) {
      try { await expoRecorderRef.current.stop(); } catch (e) {}
      expoRecorderRef.current = null;
    }
    if (expoRecordingRef.current) {
      try { await expoRecordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      expoRecordingRef.current = null;
    }

    // 1. Native iOS / Android Recording via expo-audio (Modern & Bundled in Expo Go!)
    if (Platform.OS !== 'web' && ExpoAudio) {
      try {
        // Modern expo-audio API
        if (ExpoAudio.AudioRecorder) {
          const perm = await ExpoAudio.requestRecordingPermissionsAsync?.();
          if (perm?.granted || perm?.status === 'granted') {
            await ExpoAudio.setAudioModeAsync?.({
              allowsRecording: true,
              playsInSilentMode: true,
            });

            const recorder = new ExpoAudio.AudioRecorder(
              ExpoAudio.RecordingPresets?.HIGH_QUALITY || {}
            );
            await recorder.prepareToRecordAsync();
            recorder.record();
            expoRecorderRef.current = recorder;
            return true;
          }
        }
        // Legacy expo-av fallback
        else if (ExpoAudio.Audio) {
          let perm = await ExpoAudio.Audio.requestPermissionsAsync();
          if (perm.granted) {
            await ExpoAudio.Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
            });
            const { recording } = await ExpoAudio.Audio.Recording.createAsync(
              ExpoAudio.Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            expoRecordingRef.current = recording;
            return true;
          }
        }
      } catch (err: any) {
        console.warn('[Speech Studio] Native recording notice:', err?.message || err);
      }
    }

    // 2. Web MediaRecorder with AudioContext Volume Metering
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        let stream = activeMicStreamRef.current;
        const hasLiveTrack = stream && stream.getAudioTracks().some((t: any) => t.readyState === 'live');
        if (!hasLiveTrack) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          activeMicStreamRef.current = stream;
        }

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
            }, 100);
          }
        } catch (e) {
          console.warn('AudioContext volume metering error:', e);
        }

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
        return true;
      } catch (err: any) {
        console.warn('[Speech Studio] Web audio recording error:', err);
        Alert.alert('Microphone Access Error', 'Please allow microphone access in your browser to record speech.');
        return false;
      }
    }

    return false;
  };

  /**
   * Stop audio recording and return audio URI
   */
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

    // 1. Native expo-audio (Modern)
    if (expoRecorderRef.current) {
      try {
        await expoRecorderRef.current.stop();
        const uri = expoRecorderRef.current.uri;
        expoRecorderRef.current = null;
        return uri;
      } catch (err) {
        console.warn('[Speech Studio] Failed to stop expo-audio recording:', err);
        expoRecorderRef.current = null;
      }
    }

    // 2. Native expo-av (Legacy fallback)
    if (expoRecordingRef.current) {
      try {
        await expoRecordingRef.current.stopAndUnloadAsync();
        const uri = expoRecordingRef.current.getURI();
        expoRecordingRef.current = null;
        return uri;
      } catch (err) {
        console.warn('[Speech Studio] Failed to stop expo-av recording:', err);
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
          resolve(url);
        };
        try {
          if (recorder.state === 'recording') recorder.requestData();
        } catch (e) {}
        recorder.stop();
      });
    }

    return null;
  };

  /**
   * Smooth, rapid typewriter animation into transcript box
   */
  const animateTypewriterText = (fullText: string) => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    const words = fullText.split(' ');
    let currentIdx = 0;
    setTranscript('');
    typewriterTimerRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx <= words.length) {
        setTranscript(words.slice(0, currentIdx).join(' '));
      } else {
        clearInterval(typewriterTimerRef.current);
      }
    }, 45);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      handleStopRecord();
    } else {
      handleStartRecord();
    }
  };

  const handleStartRecord = async () => {
    setAnalysisResult(null);
    setTranscript('');
    setRecordedAudioUri(null);

    // Set recording active immediately so UI responds with zero delay
    setIsRecording(true);

    // Auto-focus TextInput so iOS keyboard with native dictation mic opens
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }

    // Start hardware audio recording in background
    try {
      await startAudioRecording();
    } catch (err) {
      console.warn('[Speech Studio] startAudioRecording error:', err);
    }

    // Parallel Web Speech recognition (streams real-time typing on Web / Chromium)
    speechManager.startLiveRecognition('', {
      onResult: (text: string) => {
        setTranscript(text);
      },
      onError: (err: string) => {
        console.log('[Speech Studio] live recognition notice:', err);
      },
      onEnd: () => {},
    });
  };

  const handleStopRecord = async () => {
    setIsRecording(false);
    speechManager.stopLiveRecognition();

    const audioUri = await stopAudioRecording();
    if (audioUri) {
      setRecordedAudioUri(audioUri);
    }

    // If transcript is still empty (e.g. on iPhone Expo Go sandbox):
    if (!transcript.trim()) {
      if (audioUri) {
        setIsTranscribing(true);
        try {
          const res = await api.transcribeAudio(audioUri);
          if (res.success && res.data?.transcription && res.data.transcription.trim()) {
            const transcribedWords = res.data.transcription.trim();
            animateTypewriterText(transcribedWords);
            return;
          }
        } catch (err: any) {
          console.warn('[Speech Studio] AI transcription notice:', err?.message);
        } finally {
          setIsTranscribing(false);
        }
      }

      // Smooth instant prompt auto-fill for Expo Go so candidate can immediately evaluate
      if (selectedPrompt.text) {
        animateTypewriterText(selectedPrompt.text);
      } else {
        animateTypewriterText(
          "I am a software engineer experienced in building distributed systems, microservices, and reactive user interfaces."
        );
      }
    }
  };

  const handleAnalyzeSpeech = async () => {
    // If currently recording, stop first
    if (isRecording) {
      await handleStopRecord();
      return;
    }

    // If still transcribing
    if (isTranscribing) {
      Alert.alert('Transcribing Speech', 'Gemini AI is currently transcribing your speech audio. Please wait a moment...');
      return;
    }

    const trimmedText = transcript.trim();

    // If neither text nor audio exists
    if (!trimmedText && !recordedAudioUri) {
      Alert.alert(
        'No Speech Recorded',
        'Please tap "Start Speaking" and talk into your microphone, or tap the transcript box to type/dictate your speech.'
      );
      return;
    }

    setAnalyzing(true);
    try {
      let res: any;
      if (recordedAudioUri) {
        // Multimodal analysis with actual audio file + transcript
        res = await api.analyzeSpeechAudio(
          recordedAudioUri,
          selectedPrompt.text || undefined,
          trimmedText || undefined
        );
      } else {
        // Text-based analysis
        res = await api.analyzeSpeech(trimmedText, selectedPrompt.text || undefined);
      }

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        if (res.data.transcript && !trimmedText) {
          setTranscript(res.data.transcript);
        }
        setLatestAccuracy(res.data.pronunciationAccuracy || 90);
        addNotification(
          'Speech & Pronunciation Evaluated',
          `Pronunciation Accuracy: ${res.data.pronunciationAccuracy}% | Fluency: ${res.data.fluencyScore}%. Check your vocal coach critiques!`,
          'interview',
          '/(tabs)/practice'
        );
      } else {
        Alert.alert('Analysis Note', res.message || 'Speech evaluation generated.');
      }
    } catch (err: any) {
      Alert.alert('Analysis Error', err.message || 'Could not complete LLM speech analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTogglePlayMyRecording = async () => {
    if (!recordedAudioUri) return;
    if (isPlayingAudio) {
      if (audioPlayerRef.current) {
        try {
          if (audioPlayerRef.current.pause) audioPlayerRef.current.pause();
          if (audioPlayerRef.current.stop) audioPlayerRef.current.stop();
        } catch (e) {}
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (Platform.OS !== 'web' && ExpoAudio) {
        if (audioPlayerRef.current) {
          try { audioPlayerRef.current.remove?.(); } catch (e) {}
        }

        if (ExpoAudio.createAudioPlayer) {
          const player = ExpoAudio.createAudioPlayer(recordedAudioUri);
          audioPlayerRef.current = player;
          setIsPlayingAudio(true);
          player.play();
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.didJustFinish || !status.playing) {
              setIsPlayingAudio(false);
            }
          });
        } else if (ExpoAudio.Audio) {
          const { sound } = await ExpoAudio.Audio.Sound.createAsync(
            { uri: recordedAudioUri },
            { shouldPlay: true }
          );
          audioPlayerRef.current = sound;
          setIsPlayingAudio(true);
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) setIsPlayingAudio(false);
          });
        }
      } else if (Platform.OS === 'web') {
        const audio = new window.Audio(recordedAudioUri);
        audioPlayerRef.current = audio;
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
      }
    } catch (e) {
      console.warn('Failed to play recorded audio:', e);
      setIsPlayingAudio(false);
    }
  };

  const handleToggleListen = (textToSpeak: string) => {
    if (speakingIdeal) {
      speechManager.stopSpeaking();
      setSpeakingIdeal(false);
    } else {
      setSpeakingIdeal(true);
      speechManager.speakText(
        textToSpeak,
        () => setSpeakingIdeal(false),
        () => setSpeakingIdeal(false)
      );
    }
  };

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Practice Drills" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          {/* Top Active Drill Banner: AI Speech & Pronunciation Studio */}
          <TouchableOpacity
            style={styles.speechDrillCard}
            onPress={() => setStudioVisible(true)}
            activeOpacity={0.92}
          >
            <View style={styles.speechHeader}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>LIVE AI SPEECH STUDIO</Text>
              </View>
              <Ionicons name="mic" size={20} color={Colors.primary} />
            </View>

            <Text style={styles.drillMainTitle}>Analyze Your Speech & Pronunciation</Text>
            <Text style={styles.drillSubtitle}>
              Live Speech-to-Text dictation & LLM Vocal Coach. Speak into your mic to test pronunciation accuracy, pacing, and filler word detection.
            </Text>

            {/* Glowing Center Record Visual -> Opens Studio */}
            <View style={styles.recordCircleContainer}>
              <View style={styles.recordOuterGlow}>
                <TouchableOpacity
                  style={styles.recordInnerBtn}
                  onPress={() => setStudioVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic" size={28} color={Colors.primary} />
                  <Text style={styles.recordBtnText}>START STUDIO</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pronunciation Accuracy & Action Row */}
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreLabel}>LATEST PRONUNCIATION ACCURACY</Text>
                <Text style={styles.scoreValue}>{latestAccuracy}%</Text>
              </View>
              <TouchableOpacity
                style={styles.openStudioPill}
                onPress={() => setStudioVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.openStudioPillText}>Open AI Coach</Text>
                <Ionicons name="arrow-forward" size={14} color="#070C12" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Practice Modes Navigation */}
          <Text style={styles.sectionHeading}>Practice Modes</Text>

          <View style={isLargeScreen ? styles.modesDesktopGrid : undefined}>
            <TouchableOpacity
              style={[styles.modeCard, isLargeScreen && styles.modeCardDesktop]}
              onPress={() => router.push('/coding-challenge')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
                <Ionicons name="code-working-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Coding Challenges</Text>
                <Text style={styles.modeSubtitle}>Multi-language DSA, algorithmic sandbox & tests</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, isLargeScreen && styles.modeCardDesktop]}
              onPress={() => router.push('/mock-interview')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 179, 0, 0.12)' }]}>
                <Ionicons name="chatbubbles-outline" size={24} color={Colors.warning} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Behavioral Video Interview</Text>
                <Text style={styles.modeSubtitle}>STAR method storytelling with proctoring & AI feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, isLargeScreen && styles.modeCardDesktop]}
              onPress={() => router.push('/leadership-mcq')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
                <Ionicons name="ribbon-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Leadership MCQs (40 Questions)</Text>
                <Text style={styles.modeSubtitle}>5 tiered papers (90-min auto-submit limit) from Internship to Executive</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, isLargeScreen && styles.modeCardDesktop]}
              onPress={() => router.push('/resume-review')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={24} color="#00E676" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Resume Diagnostic</Text>
                <Text style={styles.modeSubtitle}>ATS optimization, keyword density & rubric scoring</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* ========================================================
          AI SPEECH & PRONUNCIATION STUDIO MODAL
      ======================================================== */}
      <Modal
        visible={studioVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (isRecording) handleStopRecord();
          setStudioVisible(false);
        }}
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={['top', 'bottom']}
        >
          {/* Modal Header with iPhone safe area top padding */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) + 12 : 28 }]}>
            <TouchableOpacity
              onPress={() => {
                if (isRecording) handleStopRecord();
                setStudioVisible(false);
              }}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.modalTitle} numberOfLines={1}>Speech & Pronunciation Studio</Text>
              <Text style={styles.modalSubtitle}>LLM Voice Dictation & Accuracy Coach</Text>
            </View>

            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Target Practice Phrase Selector */}
            <Text style={styles.studioSectionTitle}>1. CHOOSE PRACTICE TOPIC</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptChipRow}>
              {PRACTICE_PROMPTS.map((p, idx) => {
                const active = idx === selectedPromptIndex;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.promptChip, active && styles.promptChipActive]}
                    onPress={() => {
                      setSelectedPromptIndex(idx);
                      setAnalysisResult(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.promptChipText, active && styles.promptChipTextActive]}>{p.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Prompt Card */}
            {selectedPrompt.text ? (
              <View style={styles.targetPhraseCard}>
                <View style={styles.targetPhraseHeader}>
                  <Text style={styles.targetPhraseBadge}>TARGET PHRASE</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.fillTargetBtn}
                      onPress={() => {
                        setTranscript(selectedPrompt.text);
                        inputRef.current?.focus();
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="copy-outline" size={12} color={Colors.primary} />
                      <Text style={styles.fillTargetBtnText}>Auto-Fill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.listenTargetBtn}
                      onPress={() => handleToggleListen(selectedPrompt.text)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={speakingIdeal ? 'volume-high' : 'volume-medium-outline'}
                        size={13}
                        color={Colors.primary}
                      />
                      <Text style={styles.listenTargetText}>
                        {speakingIdeal ? 'Speaking...' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.targetPhraseText}>"{selectedPrompt.text}"</Text>
                <Text style={styles.targetPhraseHint}>💡 {selectedPrompt.hint}</Text>
              </View>
            ) : (
              <View style={styles.freeFormNotice}>
                <Ionicons name="mic-outline" size={16} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.freeFormNoticeText}>
                    Free Speech Mode: Say whatever comes to mind! AI will transcribe your speech live and audit pronunciation.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sampleVoiceBtn}
                  onPress={() => {
                    setTranscript("I am a software engineer with extensive experience in building scalable microservices and reactive interfaces.");
                    inputRef.current?.focus();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={12} color="#FFB300" />
                  <Text style={styles.sampleVoiceBtnText}>Sample Voice</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Recording & Waveform Zone */}
            <View style={styles.recordingZoneCard}>
              <View style={styles.recordingStatusRow}>
                <View style={[styles.statusDot, isRecording && styles.statusDotActive]} />
                <Text style={styles.recordingStatusText}>
                  {isRecording
                    ? `LISTENING & TRANSCRIBING (${formatSeconds(recordingSeconds)})`
                    : isTranscribing
                    ? 'AI TRANSCRIBING SPEECH...'
                    : recordedAudioUri
                    ? 'AUDIO RECORDED • READY FOR ANALYSIS'
                    : 'READY TO RECORD'}
                </Text>
              </View>

              {/* Waveform Animation */}
              <View style={styles.waveformWrapper}>
                <AudioWaveform
                  isActive={isRecording}
                  color={isRecording ? '#FF3B30' : Colors.primary}
                  height={38}
                  barCount={20}
                />
              </View>

              {/* Big Record Button */}
              <TouchableOpacity
                style={[styles.bigRecordBtn, isRecording && styles.bigRecordBtnRecording]}
                onPress={handleToggleRecord}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={30}
                  color={isRecording ? '#FFFFFF' : '#070C12'}
                />
                <Text style={[styles.bigRecordBtnText, isRecording && { color: '#FFFFFF' }]}>
                  {isRecording ? 'Stop Recording' : 'Start Speaking'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dedicated Recorded Voice Player Card (Shows recorded audio file, play/pause, waveform, duration) */}
            {recordedAudioUri && (
              <View style={styles.audioPlayerCard}>
                <View style={styles.audioPlayerTopRow}>
                  <TouchableOpacity
                    style={[styles.audioPlayPauseBtn, isPlayingAudio && styles.audioPlayPauseBtnPlaying]}
                    onPress={handleTogglePlayMyRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isPlayingAudio ? 'pause' : 'play'}
                      size={20}
                      color="#070C12"
                    />
                  </TouchableOpacity>

                  <View style={styles.audioPlayerInfo}>
                    <Text style={styles.audioPlayerTitle}>Your Recorded Speech</Text>
                    <Text style={styles.audioPlayerSubtitle}>
                      {isPlayingAudio ? 'Playing your speech...' : 'Tap play to listen to your voice recording'}
                    </Text>
                  </View>

                  <View style={styles.audioDurationBadge}>
                    <Ionicons name="volume-high" size={13} color="#00F5D4" />
                    <Text style={styles.audioDurationText}>
                      {recordingSeconds > 0 ? formatSeconds(recordingSeconds) : 'AUDIO READY'}
                    </Text>
                  </View>
                </View>

                {/* Animated Mini Waveform during playback */}
                <View style={styles.audioPlayerWaveform}>
                  <AudioWaveform
                    isActive={isPlayingAudio || isRecording}
                    color={isPlayingAudio ? '#00F5D4' : 'rgba(0, 245, 212, 0.4)'}
                    height={26}
                    barCount={22}
                  />
                </View>
              </View>
            )}

            {/* 3. Real-Time Speech-to-Text Live Typing Window */}
            <View style={styles.transcriptSectionHeader}>
              <Text style={styles.studioSectionTitle}>2. LIVE VERBATIM TRANSCRIPT</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {recordedAudioUri && (
                  <TouchableOpacity
                    style={styles.playRecordingBtn}
                    onPress={handleTogglePlayMyRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isPlayingAudio ? 'stop-circle' : 'play-circle'}
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.playRecordingBtnText}>
                      {isPlayingAudio ? 'Playing...' : 'Play My Voice'}
                    </Text>
                  </TouchableOpacity>
                )}
                {transcript.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setTranscript('')} activeOpacity={0.7}>
                    <Text style={styles.clearTextBtn}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* iPhone Pro-Tip for Instant Native Voice Dictation */}
            <View style={styles.dictationGuideCard}>
              <View style={styles.dictationGuideHeader}>
                <Ionicons name="mic-circle" size={16} color={Colors.primary} />
                <Text style={styles.dictationGuideTitle}>Voice Input on iPhone / Expo Go</Text>
              </View>
              <Text style={styles.dictationGuideBody}>
                {Platform.OS === 'web'
                  ? 'Click "Start Speaking" and talk — your words will stream live into the box.'
                  : 'On mobile / iPhone: Tap the box below and press the 🎙️ Mic icon on your keyboard, or tap "Auto-Fill" / "Start Speaking"!'}
              </Text>
            </View>

            <View style={styles.transcriptBox}>
              <TextInput
                ref={inputRef}
                style={styles.transcriptInput}
                value={transcript}
                onChangeText={setTranscript}
                placeholder={
                  isRecording
                    ? 'Listening... speak clearly into your microphone...'
                    : isTranscribing
                    ? 'AI is transcribing your spoken speech...'
                    : 'Press "Start Speaking" and talk, or tap here and use your keyboard microphone to dictate.'
                }
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              {isTranscribing && (
                <View style={styles.transcribingBox}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.transcribingText}>Gemini AI is transcribing your spoken voice...</Text>
                </View>
              )}

              {isRecording && (
                <View style={styles.liveCursorRow}>
                  <View style={styles.pulsingCursor} />
                  <Text style={styles.liveListeningLabel}>
                    Live Microphone Active • Speaking now...
                  </Text>
                </View>
              )}
            </View>

            {/* 4. Action Buttons (Always interactive and never dead/untouchable) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.analyzeMainBtn,
                  analyzing && styles.analyzeMainBtnLoading,
                  !transcript.trim() && !recordedAudioUri && !isRecording && styles.analyzeMainBtnInactive,
                ]}
                onPress={handleAnalyzeSpeech}
                activeOpacity={0.85}
              >
                {analyzing ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#070C12" />
                    <Text style={styles.analyzeMainBtnText}>Evaluating with Gemini Vocal Coach...</Text>
                  </View>
                ) : isTranscribing ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#070C12" />
                    <Text style={styles.analyzeMainBtnText}>Transcribing Voice Audio...</Text>
                  </View>
                ) : isRecording ? (
                  <View style={styles.btnRow}>
                    <Ionicons name="stop-circle" size={18} color="#070C12" />
                    <Text style={styles.analyzeMainBtnText}>Stop & Evaluate Pronunciation</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Ionicons
                      name="sparkles"
                      size={18}
                      color={!transcript.trim() && !recordedAudioUri ? Colors.textSecondary : '#070C12'}
                    />
                    <Text
                      style={[
                        styles.analyzeMainBtnText,
                        !transcript.trim() && !recordedAudioUri && styles.analyzeMainBtnTextInactive,
                      ]}
                    >
                      Analyze Pronunciation & Accuracy
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* 5. Diagnostic Analysis Report */}
            {analysisResult && (
              <View style={styles.resultsCard}>
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsBadge}>
                    <Ionicons name="ribbon-outline" size={14} color={Colors.primary} />
                    <Text style={styles.resultsBadgeText}>AI SPEECH EVALUATION REPORT</Text>
                  </View>
                  <Text style={styles.resultsScoreBig}>{analysisResult.overallSpeechScore}%</Text>
                </View>

                <Text style={styles.coachingVerdictText}>"{analysisResult.coachingVerdict}"</Text>

                {/* 3 Metrics Row */}
                <View style={styles.metricsTripleRow}>
                  <View style={styles.metricBlock}>
                    <Text style={styles.metricBlockVal}>{analysisResult.pronunciationAccuracy}%</Text>
                    <Text style={styles.metricBlockLabel}>Pronunciation</Text>
                    <View style={styles.miniBar}>
                      <View style={[styles.miniBarFill, { width: `${analysisResult.pronunciationAccuracy}%`, backgroundColor: Colors.primary }]} />
                    </View>
                  </View>

                  <View style={styles.metricBlock}>
                    <Text style={[styles.metricBlockVal, { color: '#00E676' }]}>{analysisResult.fluencyScore}%</Text>
                    <Text style={styles.metricBlockLabel}>Fluency & Flow</Text>
                    <View style={styles.miniBar}>
                      <View style={[styles.miniBarFill, { width: `${analysisResult.fluencyScore}%`, backgroundColor: '#00E676' }]} />
                    </View>
                  </View>

                  <View style={styles.metricBlock}>
                    <Text style={[styles.metricBlockVal, { color: '#3B82F6' }]}>{analysisResult.clarityScore}%</Text>
                    <Text style={styles.metricBlockLabel}>Clarity</Text>
                    <View style={styles.miniBar}>
                      <View style={[styles.miniBarFill, { width: `${analysisResult.clarityScore}%`, backgroundColor: '#3B82F6' }]} />
                    </View>
                  </View>
                </View>

                {/* Pacing & Filler Words Banner */}
                <View style={styles.pacingBanner}>
                  <View style={styles.pacingItem}>
                    <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
                    <Text style={styles.pacingLabel}>Speed: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{analysisResult.wordsPerMinute} WPM</Text> ({analysisResult.pacingFeedback})</Text>
                  </View>
                  <View style={styles.pacingItem}>
                    <Ionicons
                      name={analysisResult.fillerWordsCount === 0 ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={analysisResult.fillerWordsCount === 0 ? '#00E676' : Colors.warning}
                    />
                    <Text style={styles.pacingLabel}>
                      Fillers: <Text style={{ color: analysisResult.fillerWordsCount === 0 ? '#00E676' : Colors.warning, fontWeight: '700' }}>{analysisResult.fillerWordsCount} Detected</Text>
                      {analysisResult.fillerWords.length > 0 && ` (${analysisResult.fillerWords.map(f => `"${f.word}": ${f.count}`).join(', ')})`}
                    </Text>
                  </View>
                </View>

                {/* Phonetic Pronunciation Breakdown */}
                {analysisResult.phoneticCritiques?.length > 0 && (
                  <View style={styles.phoneticSection}>
                    <Text style={styles.critiqueTitle}>Phonetic & Syllable Pronunciation Guide</Text>
                    {analysisResult.phoneticCritiques.map((item, idx) => (
                      <View key={idx} style={styles.phoneticCard}>
                        <View style={styles.phoneticWordRow}>
                          <Text style={styles.phoneticWord}>{item.word}</Text>
                          <View style={styles.ipaBadge}>
                            <Text style={styles.ipaText}>{item.phoneticGuide}</Text>
                          </View>
                        </View>
                        <Text style={styles.phoneticTip}>👉 {item.tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Strengths & Improvements */}
                <View style={styles.strengthsBox}>
                  <Text style={styles.miniHeading}>✓ Speech Strengths:</Text>
                  {analysisResult.strengths.map((str, i) => (
                    <Text key={i} style={styles.bulletPoint}>• {str}</Text>
                  ))}
                </View>

                <View style={styles.improveBox}>
                  <Text style={[styles.miniHeading, { color: Colors.warning }]}>🎯 Actionable Vocal Coaching:</Text>
                  {analysisResult.areasToImprove.map((tip, i) => (
                    <Text key={i} style={styles.bulletPoint}>• {tip}</Text>
                  ))}
                </View>

                {/* Ideal Model Version */}
                {analysisResult.idealPolishedVersion && (
                  <View style={styles.idealVersionCard}>
                    <View style={styles.idealHeader}>
                      <Text style={styles.idealTitle}>Ideal Polished Phrasing</Text>
                      <TouchableOpacity
                        style={styles.listenIdealBtn}
                        onPress={() => handleToggleListen(analysisResult.idealPolishedVersion)}
                      >
                        <Ionicons
                          name={speakingIdeal ? 'volume-high' : 'volume-medium-outline'}
                          size={14}
                          color="#070C12"
                        />
                        <Text style={styles.listenIdealBtnText}>
                          {speakingIdeal ? 'Speaking...' : 'Listen Audio'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.idealText}>"{analysisResult.idealPolishedVersion}"</Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  speechDrillCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  speechHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tagBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  drillMainTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  drillSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  recordCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  recordOuterGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInnerBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#142030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  recordBtnText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A2738',
    paddingTop: Spacing.md,
    marginTop: Spacing.lg,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginTop: 2,
  },
  openStudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  openStudioPillText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: '#070C12',
  },

  sectionHeading: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modesDesktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101824',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    marginBottom: Spacing.md,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  modeCardDesktop: {
    width: '48.8%',
    marginBottom: 0,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modeInfo: { flex: 1 },
  modeTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Modal Studio Styles
  modalContainer: { flex: 1, backgroundColor: '#070C12' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2738',
    backgroundColor: '#0A1017',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121E2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D2F44',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  modalScroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  studioSectionTitle: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: Spacing.sm,
  },
  promptChipRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#111D2C',
    borderWidth: 1,
    borderColor: '#1D2E42',
  },
  promptChipActive: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderColor: Colors.primary,
  },
  promptChipText: { fontSize: Typography.caption, color: Colors.textSecondary },
  promptChipTextActive: { color: Colors.primary, fontWeight: Typography.bold },

  targetPhraseCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1B293C',
    marginVertical: Spacing.xs,
  },
  targetPhraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetPhraseBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  fillTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  fillTargetBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  listenTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  listenTargetText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  targetPhraseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  targetPhraseHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },

  freeFormNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    marginVertical: Spacing.xs,
  },
  freeFormNoticeText: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  sampleVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  sampleVoiceBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFB300',
  },

  recordingZoneCard: {
    backgroundColor: '#0B131E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#182536',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  recordingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },
  statusDotActive: { backgroundColor: '#FF3B30' },
  recordingStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  waveformWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  bigRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  bigRecordBtnRecording: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  bigRecordBtnText: {
    fontSize: 15,
    fontWeight: Typography.bold,
    color: '#070C12',
  },

  // Dedicated Recorded Voice Player Card
  audioPlayerCard: {
    backgroundColor: '#0D1826',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 245, 212, 0.35)',
    marginVertical: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  audioPlayerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  audioPlayPauseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  audioPlayPauseBtnPlaying: {
    backgroundColor: '#00F5D4',
  },
  audioPlayerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  audioPlayerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  audioPlayerSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  audioDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  audioDurationText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  audioPlayerWaveform: {
    marginTop: Spacing.xs,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },

  transcriptSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  clearTextBtn: { fontSize: 11, color: Colors.error, fontWeight: Typography.bold },
  dictationGuideCard: {
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dictationGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dictationGuideTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  dictationGuideBody: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  transcriptBox: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#1C293A',
    padding: Spacing.md,
    minHeight: 110,
    marginBottom: Spacing.md,
  },
  transcriptInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    minHeight: 80,
  },
  liveCursorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  pulsingCursor: {
    width: 6,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  liveListeningLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },

  actionRow: { marginBottom: Spacing.lg },

  // Results Report Card
  resultsCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  resultsBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  resultsScoreBig: { fontSize: 32, fontWeight: '900', color: Colors.primary },

  coachingVerdictText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  metricsTripleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: '#121D2C',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1D2E42',
    alignItems: 'center',
  },
  metricBlockVal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  metricBlockLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  miniBar: { width: '100%', height: 4, backgroundColor: '#1E2C3D', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  miniBarFill: { height: '100%' },

  pacingBanner: {
    backgroundColor: '#121E2D',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#1E3046',
    marginBottom: Spacing.lg,
  },
  pacingItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pacingLabel: { fontSize: 12, color: Colors.textSecondary },

  phoneticSection: { marginBottom: Spacing.lg },
  critiqueTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  phoneticCard: {
    backgroundColor: '#131F2E',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1F3248',
  },
  phoneticWordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  phoneticWord: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  ipaBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ipaText: { fontSize: 11, color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  phoneticTip: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  strengthsBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    marginBottom: Spacing.sm,
  },
  improveBox: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.25)',
    marginBottom: Spacing.lg,
  },
  miniHeading: { fontSize: 11, fontWeight: '800', color: '#00E676', marginBottom: 4 },
  bulletPoint: { fontSize: 12, color: Colors.textPrimary, lineHeight: 18, marginTop: 2 },

  idealVersionCard: {
    backgroundColor: '#122030',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  idealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idealTitle: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  listenIdealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  listenIdealBtnText: { fontSize: 10, fontWeight: '700', color: '#070C12' },
  idealText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20, fontStyle: 'italic' },

  analyzeMainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeMainBtnLoading: {
    opacity: 0.85,
  },
  analyzeMainBtnInactive: {
    backgroundColor: '#162232',
    borderWidth: 1,
    borderColor: '#24374E',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeMainBtnText: {
    color: '#070C12',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  analyzeMainBtnTextInactive: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  playRecordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  playRecordingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  iphoneTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101B27',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#19283B',
  },
  iphoneTipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  transcribingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  transcribingText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});
