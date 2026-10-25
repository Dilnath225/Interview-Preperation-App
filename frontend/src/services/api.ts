import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const CURRENT_LAN_IP = '192.168.1.178';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      return `http://${host}:5000/api`;
    }
    return `http://${CURRENT_LAN_IP}:5000/api`;
  }

  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.debuggerHost,
    (Constants as any).manifest?.debuggerHost,
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as any).experienceUrl,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const match = candidate.match(/(?:exp:\/\/|https?:\/\/)?([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
      if (match && match[1] && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:5000/api`;
      }
    }
  }

  // Fallback to active local network IP
  return `http://${CURRENT_LAN_IP}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();
console.log(`[API Base URL configured for ${Platform.OS}]:`, API_BASE_URL);
const TOKEN_KEY = 'ai_mentor_auth_token';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds (AI ATS evaluation & RAG need more time)
  headers: {
    Accept: 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Helper for storage compatibility (Web vs Native)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch (e) {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch (e) {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {}
  },
};

let inMemoryToken: string | null = null;

axiosInstance.interceptors.request.use(async (config) => {
  try {
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
        if (Platform.OS !== 'web') {
          (config.headers as any)['Content-Type'] = 'multipart/form-data';
        }
      }
    } else if (config.data && typeof config.data === 'object') {
      if (config.headers && !(config.headers as any)['Content-Type']) {
        (config.headers as any)['Content-Type'] = 'application/json';
      }
    }
    let token = inMemoryToken;
    if (!token) {
      token = await storage.getItem(TOKEN_KEY);
      if (token) {
        inMemoryToken = token;
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    if (token) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('Error reading token from storage', err);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[API] 401 Unauthorized encountered on:', error.config?.url);
      if (error.config?.url?.includes('/auth/me')) {
        inMemoryToken = null;
        delete axiosInstance.defaults.headers.common['Authorization'];
        await storage.removeItem(TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

class ApiClient {
  async setToken(token: string | null) {
    inMemoryToken = token;
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await storage.setItem(TOKEN_KEY, token);
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      await storage.removeItem(TOKEN_KEY);
    }
  }

  async getToken(): Promise<string | null> {
    if (inMemoryToken) return inMemoryToken;
    return await storage.getItem(TOKEN_KEY);
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any,
    headers?: any
  ): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const reqHeaders = { ...(headers || {}) };
      if (data instanceof FormData) {
        delete reqHeaders['Content-Type'];
      }
      const response = await axiosInstance({ method, url: endpoint, data, headers: reqHeaders });
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body) {
        return {
          success: body.success !== false,
          data: (body.data !== undefined ? body.data : body) as T,
          message: body.message,
        };
      }
      return { success: true, data: body as T };
    } catch (err: any) {
      console.warn(`[API] Error on ${endpoint}:`, err.message);
      let message = err.response?.data?.message || err.message || 'Network request failed';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = `Connection to ${API_BASE_URL} timed out. Please ensure your PC Wi-Fi network is set to 'Private network' in Windows Settings so your phone can connect.`;
      }
      return {
        success: false,
        message,
      };
    }
  }

  // --- Auth Endpoints ---
  async register(name: string, email: string, pass: string, targetRole?: string) {
    return this.request<{ requireOtp?: boolean; email?: string; message?: string; user?: any; token?: string }>('post', '/auth/register', { name, email, password: pass, targetRole });
  }

  async verifyOtp(email: string, otp: string) {
    const res = await this.request<{ user: any; token: string }>('post', '/auth/verify-otp', { email, otp });
    if (res.success && res.data?.token) {
      await this.setToken(res.data.token);
    }
    return res;
  }

  async resendOtp(email: string) {
    return this.request<{ success: boolean; message?: string }>('post', '/auth/resend-otp', { email });
  }

  async login(email: string, pass: string) {
    const res = await this.request<{ user?: any; token?: string; requireOtp?: boolean; email?: string }>('post', '/auth/login', { email, password: pass });
    if (res.success && res.data?.token) {
      await this.setToken(res.data.token);
    }
    return res;
  }

  async getMe() {
    return this.request<{ user: any }>('get', '/auth/me');
  }

  // --- User & Profile Endpoints ---
  async getProfile() {
    return this.request<{ user: any; stats: any; recentInterviews: any[] }>('get', '/user/profile');
  }

  async updateProfile(data: {
    name?: string;
    targetRole?: string;
    skills?: string;
    bio?: string;
    phone?: string;
    experienceLevel?: string;
    education?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    avatarUrl?: string;
  }) {
    return this.request<{ user: any }>('put', '/user/profile', data);
  }

  async uploadAvatar(fileOrAsset: any) {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      if (fileOrAsset.file) {
        formData.append('avatar', fileOrAsset.file, fileOrAsset.name || 'avatar.jpg');
      } else if (fileOrAsset.uri) {
        try {
          const resp = await fetch(fileOrAsset.uri);
          const blob = await resp.blob();
          formData.append('avatar', blob, 'avatar.jpg');
        } catch (e) {
          console.warn('Failed to convert web avatar uri to blob:', e);
        }
      }
    } else {
      const filename = fileOrAsset.uri?.split('/').pop() || 'avatar.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      formData.append('avatar', {
        uri: fileOrAsset.uri,
        name: filename,
        type: mimeType,
      } as any);
    }
    return this.request<{ avatarUrl: string }>('post', '/user/avatar', formData);
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request<any>('post', '/user/change-password', { oldPassword, newPassword });
  }

  async deleteAccount() {
    return this.request<any>('delete', '/user/profile');
  }

  // --- Mock Interview Endpoints ---
  async startInterview(type: string, role?: string, difficulty?: string) {
    return this.request<any>('post', '/interviews/start', { type, role, difficulty });
  }

  async submitAnswer(sessionId: string, questionId: string, userAnswer: string) {
    return this.request<any>('post', '/interviews/answer', { sessionId, questionId, userAnswer });
  }

  async submitAudioAnswer(sessionId: string, questionId: string, audioUri: string) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('questionId', questionId);
    
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append('audio', blob, 'answer.webm');
      } catch (err) {
        console.warn('Failed to fetch audio blob on web', err);
      }
    } else {
      // For React Native Native (iOS/Android)
      const filename = audioUri.split('/').pop() || 'answer.m4a';
      const ext = filename.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';
      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    return this.request<any>('post', `/interviews/${sessionId}/questions/${questionId}/answer-audio`, formData);
  }

  async transcribeAudio(audioUri: string) {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append('audio', blob, 'answer.webm');
      } catch (err) {
        console.warn('Failed to fetch audio blob on web', err);
      }
    } else {
      const filename = audioUri.split('/').pop() || 'answer.m4a';
      const ext = filename.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';
      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: mimeType,
      } as any);
    }
    return this.request<{ transcription: string }>('post', '/interviews/transcribe', formData);
  }

  async completeInterview(sessionId: string, answers?: Array<{ questionId: string; userAnswer: string }>) {
    return this.request<any>('post', `/interviews/${sessionId}/complete`, { answers });
  }

  async getInterviewHistory() {
    return this.request<{ sessions: any[] }>('get', '/interviews');
  }

  async analyzeSpeech(transcript: string, targetPhrase?: string) {
    return this.request<{
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
    }>('post', '/interviews/speech-analysis', { transcript, targetPhrase });
  }

  async analyzeSpeechAudio(audioUri: string, targetPhrase?: string, transcript?: string) {
    const formData = new FormData();
    if (targetPhrase) formData.append('targetPhrase', targetPhrase);
    if (transcript) formData.append('transcript', transcript);

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append('audio', blob, 'speech.webm');
      } catch (err) {
        console.warn('Failed to fetch audio blob on web', err);
      }
    } else {
      const filename = audioUri.split('/').pop() || 'speech.m4a';
      const ext = filename.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';
      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    return this.request<{
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
    }>('post', '/interviews/speech-analysis', formData);
  }

  // --- Coding Challenges & Technical Assessment ---
  async getCodingChallenges(category?: string, difficulty?: string) {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (difficulty) query.append('difficulty', difficulty);
    return this.request<{ challenges: any[] }>('get', `/coding?${query.toString()}`);
  }

  async getChallengeBySlug(slug: string, language = 'javascript') {
    return this.request<any>('get', `/coding/${slug}?language=${language}`);
  }

  async runSampleCode(challengeId: string, code: string, language = 'javascript') {
    return this.request<any>('post', '/coding/run-sample', { challengeId, code, language });
  }

  async runAllCode(challengeId: string, code: string, language = 'javascript') {
    return this.request<any>('post', '/coding/run-all', { challengeId, code, language });
  }

  async startTechnicalAssessment(
    options: { count?: number; role?: string; level?: string; language?: string } | number = 5,
    legacyLanguage = 'javascript'
  ) {
    let payload: { count: number; role?: string; level?: string; language: string };
    if (typeof options === 'object') {
      payload = {
        count: options.count ?? 5,
        role: options.role ?? 'Software Engineer',
        level: options.level ?? 'Junior',
        language: options.language ?? 'javascript',
      };
    } else {
      payload = {
        count: options,
        role: 'Software Engineer',
        level: 'Junior',
        language: legacyLanguage,
      };
    }
    return this.request<{
      assessmentId: string;
      questions: any[];
      totalQuestions: number;
      timeLimitMinutes: number;
      language: string;
      role?: string;
      level?: string;
    }>('post', '/coding/assessment/start', payload);
  }

  async submitTechnicalAssessment(
    assessmentId: string,
    answers: Array<{ challengeId: string; code: string; language?: string }>
  ) {
    return this.request<{
      assessmentId: string;
      overallScore: number;
      passed: boolean;
      grade: string;
      feedback: {
        overallScore: number;
        passed: boolean;
        grade: string;
        summary: string;
        strengths: string[];
        actionableAdvice: string[];
        questionBreakdown: any[];
      };
    }>('post', '/coding/assessment/submit', { assessmentId, answers });
  }

  async getTechnicalAssessment(assessmentId: string) {
    return this.request<any>('get', `/coding/assessment/${assessmentId}`);
  }

  async submitCode(challengeId: string, code: string, language = 'typescript') {
    return this.request<any>('post', '/coding/submit', { challengeId, code, language });
  }

  // --- AI Chat Mentor ---
  async sendChatMessage(
    message: string,
    context = 'GENERAL',
    attachment?: { name: string; type: string; data: string }
  ) {
    return this.request<{ message: any }>('post', '/chat/message', {
      message,
      context,
      attachment,
    });
  }

  async getChatHistory() {
    return this.request<{ history: any[] }>('get', '/chat/history');
  }

  // --- Resume ATS Diagnostic ---
  async getResumeHistory() {
    return this.request<{ resumes: any[] }>('get', '/resume/history');
  }
  async uploadResume(
    file: any,
    targetRole?: string,
    industry?: string,
    jobDescription?: string
  ) {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      if (file.file) {
        formData.append('resume', file.file, file.name || 'resume.pdf');
      } else if (file.uri) {
        try {
          const resp = await fetch(file.uri);
          const blob = await resp.blob();
          formData.append('resume', blob, file.name || 'resume.pdf');
        } catch (fetchErr) {
          console.warn('Failed to convert web uri to blob:', fetchErr);
          formData.append('resume', {
            uri: file.uri,
            name: file.name || 'resume.pdf',
            type: file.mimeType || 'application/pdf',
          } as any);
        }
      }
    } else {
      formData.append('resume', {
        uri: file.uri,
        name: file.name || 'resume.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);
    }

    if (targetRole) formData.append('targetRole', targetRole);
    if (industry) formData.append('industry', industry);
    if (jobDescription) formData.append('jobDescription', jobDescription);
    
    return this.request<any>('post', '/resume/analyze', formData);
  }

  // --- Proctoring & Gaze Detection ---
  async detectGaze(imageBase64: string) {
    return this.request<any>('post', '/interviews/gaze-detection', { image_base64: imageBase64 });
  }
}

export const api = new ApiClient();
