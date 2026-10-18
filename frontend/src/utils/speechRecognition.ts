import { Platform } from 'react-native';

// Conditionally import expo-speech (Text-to-Speech)
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  // Graceful fallback to web SpeechSynthesis
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
  onSilenceCountdown?: (secondsRemaining: number) => void;
  onAutoSubmit?: () => void;
}

class SpeechManager {
  private recognitionInstance: any = null;
  private isListening: boolean = false;
  private activeTranscript: string = '';
  private baseTranscript: string = '';
  private restartTimeout: any = null;

  // Real-time voice activity & auto-submit engine
  private activeListener: SpeechRecognitionListener | null = null;
  private silenceStartTime: number = 0;
  private hasVoiceSpoken: boolean = false;
  private isAutoSubmitTriggered: boolean = false;

  /**
   * Check if live browser speech recognition (Google Speech / Webkit) is supported
   */
  isRecognitionSupported(): boolean {
    if (typeof window !== 'undefined') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  }

  /**
   * Start live speech recognition (real-time verbatim speech-to-text typing)
   */
  startLiveRecognition(
    initialText: string,
    listener: SpeechRecognitionListener
  ): boolean {
    this.stopLiveRecognition();

    this.activeListener = listener;
    this.baseTranscript = initialText ? initialText.trim() + ' ' : '';
    this.activeTranscript = this.baseTranscript.trim();
    this.isListening = true;
    this.hasVoiceSpoken = false;
    this.silenceStartTime = 0;
    this.isAutoSubmitTriggered = false;

    if (listener.onStart) listener.onStart();

    // Browser Web Speech Recognition (Google Chrome / Edge / Safari / Gemini Live engine)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let finalWords = '';
            let interimWords = '';

            for (let i = 0; i < event.results.length; ++i) {
              const item = event.results[i];
              if (item && item[0]) {
                if (item.isFinal) {
                  finalWords += item[0].transcript + ' ';
                } else {
                  interimWords += item[0].transcript;
                }
              }
            }

            const combined = (this.baseTranscript + finalWords + interimWords).trim();
            if (combined) {
              this.hasVoiceSpoken = true;
              this.silenceStartTime = 0; // candidate actively uttered words!
              this.activeTranscript = combined;
              this.activeListener?.onResult(combined, !!finalWords);
              this.activeListener?.onSilenceCountdown?.(0);
            }
          };

          recognition.onerror = (event: any) => {
            const errorType = event.error || 'unknown';
            if (errorType === 'not-allowed') {
              this.activeListener?.onError?.(
                'Microphone permission denied. Please click the camera/mic icon in your browser address bar and choose Allow.'
              );
            } else if (errorType === 'network') {
              console.warn('[SpeechManager] Speech recognition network notice');
            } else if (errorType !== 'no-speech') {
              console.log('[SpeechManager] Browser WebSpeech notice:', errorType);
            }
          };

          recognition.onend = () => {
            if (this.isListening) {
              this.baseTranscript = this.activeTranscript ? this.activeTranscript + ' ' : this.baseTranscript;
              if (this.restartTimeout) clearTimeout(this.restartTimeout);
              this.restartTimeout = setTimeout(() => {
                if (this.isListening) {
                  try {
                    recognition.start();
                  } catch (e) {
                    try {
                      // If browser closed the previous instance, instantiate fresh
                      const FreshClass = window.SpeechRecognition || window.webkitSpeechRecognition;
                      if (FreshClass) {
                        const fresh = new FreshClass();
                        fresh.continuous = true;
                        fresh.interimResults = true;
                        fresh.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
                        fresh.onresult = recognition.onresult;
                        fresh.onerror = recognition.onerror;
                        fresh.onend = recognition.onend;
                        fresh.start();
                        this.recognitionInstance = fresh;
                      }
                    } catch (err2) {}
                  }
                }
              }, 200);
            } else {
              if (this.activeListener?.onEnd) this.activeListener.onEnd();
            }
          };

          recognition.start();
          this.recognitionInstance = recognition;
          return true;
        } catch (err: any) {
          console.warn('[SpeechManager] WebSpeech initialization error:', err?.message);
        }
      }
    }

    return false;
  }

  /**
   * Feed microphone volume activity to drive silence detection and countdown / auto-submit.
   * NEVER generates simulated or fake words.
   */
  feedVoiceCadence(volume: number) {
    if (!this.isListening || this.isAutoSubmitTriggered) return;

    const now = Date.now();

    // 1. Voice Detected: candidate is actively speaking
    if (volume > 7) {
      this.hasVoiceSpoken = true;
      this.silenceStartTime = 0;
      this.activeListener?.onSilenceCountdown?.(0);
    }
    // 2. Silence Detected: candidate has spoken and now paused
    else if (this.hasVoiceSpoken && !this.isAutoSubmitTriggered) {
      if (this.silenceStartTime === 0) {
        this.silenceStartTime = now;
      } else {
        const silenceElapsed = now - this.silenceStartTime;

        // After 1.2s silence, show countdown
        if (silenceElapsed >= 1200 && silenceElapsed < 2600) {
          const remainingSec = Math.max(1, Math.ceil((2600 - silenceElapsed) / 1000));
          this.activeListener?.onSilenceCountdown?.(remainingSec);
        }
        // After 2.6s silence, automatically submit the candidate's answer
        else if (silenceElapsed >= 2600) {
          console.log('[SpeechManager] Silence timeout reached (2.6s) -> Auto-submitting spoken answer!');
          this.isAutoSubmitTriggered = true;
          this.silenceStartTime = 0;
          this.hasVoiceSpoken = false;
          this.activeListener?.onSilenceCountdown?.(0);
          this.activeListener?.onAutoSubmit?.();
        }
      }
    }
  }

  /**
   * Stop speech recognition
   */
  stopLiveRecognition() {
    this.isListening = false;
    this.activeListener = null;
    this.hasVoiceSpoken = false;
    this.silenceStartTime = 0;
    this.isAutoSubmitTriggered = false;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
  }

  /**
   * Speak question or text using AI voice (Text-to-Speech)
   * Uses expo-speech on native, Web SpeechSynthesis on web
   */
  speakText(
    text: string,
    onDone?: () => void,
    onError?: (err: any) => void
  ) {
    if (!text) return;

    // Web SpeechSynthesis
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop any pending speech
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        // Select a natural English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('David') ||
              v.name.includes('Alex'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          if (onDone) onDone();
        };

        utterance.onerror = (e) => {
          if (onError) onError(e);
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('Web speech synthesis failed:', err);
      }
    }

    // Native fallback via expo-speech (if native module is linked)
    if (Speech && Speech.speak) {
      try {
        Speech.stop();
        Speech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.95,
          onDone: onDone,
          onError: onError,
        });
        return;
      } catch (err) {
        console.warn('expo-speech speak failed:', err);
      }
    }

    // If neither TTS is available, complete immediately
    if (onDone) onDone();
  }

  /**
   * Stop active speech output
   */
  stopSpeaking() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (Speech && Speech.stop) {
      try {
        Speech.stop();
      } catch (e) {}
    }
  }
}

export const speechManager = new SpeechManager();
