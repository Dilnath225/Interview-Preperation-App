import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return `http://${ip}:5000/api`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();
const TOKEN_KEY = 'ai_mentor_auth_token';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Error reading token from SecureStore', err);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized request. Logging out...');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      // Trigger a redirect if needed, handled by AuthContext
    }
    return Promise.reject(error);
  }
);

class ApiClient {
  async setToken(token: string | null) {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const response = await axiosInstance({ method, url: endpoint, data });
      return { success: true, data: response.data as T };
    } catch (err: any) {
      console.warn(`[API] Error on ${endpoint}:`, err.message);
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Network request failed',
      };
    }
  }

  // --- Auth Endpoints ---
  async register(name: string, email: string, pass: string, targetRole?: string) {
    return this.request<{ user: any; token: string }>('post', '/auth/register', { name, email, password: pass, targetRole });
  }

  async login(email: string, pass: string) {
    const res = await this.request<{ user: any; token: string }>('post', '/auth/login', { email, password: pass });
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

  async updateProfile(data: { name?: string; targetRole?: string; skills?: string }) {
    return this.request<{ user: any }>('put', '/user/profile', data);
  }

  // --- Mock Interview Endpoints ---
  async startInterview(type: string, role?: string, difficulty?: string) {
    return this.request<any>('post', '/interviews/start', { type, role, difficulty });
  }

  async submitAnswer(sessionId: string, questionId: string, userAnswer: string) {
    return this.request<any>('post', '/interviews/answer', { sessionId, questionId, userAnswer });
  }

  async completeInterview(sessionId: string) {
    return this.request<any>('post', `/interviews/${sessionId}/complete`);
  }

  async getInterviewHistory() {
    return this.request<{ sessions: any[] }>('get', '/interviews');
  }

  // --- Coding Challenges ---
  async getCodingChallenges(category?: string, difficulty?: string) {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (difficulty) query.append('difficulty', difficulty);
    return this.request<{ challenges: any[] }>('get', `/coding?${query.toString()}`);
  }

  async getChallengeBySlug(slug: string) {
    return this.request<any>('get', `/coding/${slug}`);
  }

  async submitCode(challengeId: string, code: string, language = 'typescript') {
    return this.request<any>('post', '/coding/submit', { challengeId, code, language });
  }

  // --- AI Chat Mentor ---
  async sendChatMessage(message: string, context = 'GENERAL') {
    return this.request<{ message: any }>('post', '/chat/message', { message, context });
  }

  async getChatHistory() {
    return this.request<{ history: any[] }>('get', '/chat/history');
  }

  // --- Resume ATS Diagnostic ---
  async getResumeHistory() {
    return this.request<{ resumes: any[] }>('get', '/resume/history');
  }
}

export const api = new ApiClient();
