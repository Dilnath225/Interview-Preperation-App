import { Platform } from 'react-native';

// Conditionally import expo-speech (not available in Expo Go)
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.warn('expo-speech not available, using web SpeechSynthesis fallback');
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
}

class SpeechManager {
  private recognitionInstance: any = null;
  private isListening: boolean = false;
  private activeTranscript: string = '';
  private baseTranscript: string = '';
  private restartTimeout: any = null;

  /**
   * Check if live browser/device speech recognition is supported
   */
  isRecognitionSupported(): boolean {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  }

  /**
   * Start live speech recognition (real-time speech-to-text typing)
   */
  startLiveRecognition(
    initialText: string,
    listener: SpeechRecognitionListener
  ): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      if (listener.onError) {
        listener.onError('Speech recognition is only supported in web browsers currently.');
      }
      return false;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('Web Speech Recognition API is not supported in this browser.');
      if (listener.onError) {
        listener.onError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge, or type your answer.');
      }
      return false;
    }

    this.stopLiveRecognition();

    try {
      this.baseTranscript = initialText ? initialText.trim() + ' ' : '';
      this.activeTranscript = this.baseTranscript.trim();
      this.isListening = true;

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (listener.onStart) listener.onStart();
      };

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
        this.activeTranscript = combined;
        listener.onResult(combined, !!finalWords);
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error || 'unknown';
        console.warn('Speech recognition error:', errorType);

        if (errorType === 'not-allowed') {
          if (listener.onError) {
            listener.onError('Microphone access blocked. Please allow microphone permissions in your browser address bar.');
          }
        } else if (errorType === 'audio-capture') {
          if (listener.onError) {
            listener.onError('Microphone not detected or in use by another application.');
          }
        } else if (errorType === 'network') {
          if (listener.onError) {
            listener.onError('Network connection error with speech service. You can type your answer manually.');
          }
        } else if (errorType !== 'no-speech' && errorType !== 'aborted') {
          if (listener.onError) {
            listener.onError(`Speech recognition status: ${errorType}`);
          }
        }
      };

      recognition.onend = () => {
        // In Chrome, continuous recognition can automatically stop after silence.
        // If the user hasn't explicitly stopped listening, keep session active:
        if (this.isListening) {
          // Commit finalized words into baseTranscript before restart
          this.baseTranscript = this.activeTranscript ? this.activeTranscript + ' ' : this.baseTranscript;
          this.restartTimeout = setTimeout(() => {
            if (this.isListening) {
              try {
                recognition.start();
              } catch (e) {
                // If already running or cannot restart
              }
            }
          }, 250);
        } else {
          if (listener.onEnd) listener.onEnd();
        }
      };

      recognition.start();
      this.recognitionInstance = recognition;
      return true;
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition:', err);
      this.isListening = false;
      if (listener.onError) {
        listener.onError(err?.message || 'Failed to start speech recognition.');
      }
      return false;
    }
  }

  /**
   * Stop speech recognition
   */
  stopLiveRecognition() {
    this.isListening = false;
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
