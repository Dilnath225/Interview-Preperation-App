import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeStorage } from '../utils/storage';
import { api } from '../services/api';

export interface UserData {
  id: string;
  name: string;
  email: string;
  targetRole?: string | null;
  readinessScore?: number | null;
  skills?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  experienceLevel?: string | null;
  education?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  isVerified?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requireOtp?: boolean; email?: string; message?: string }>;
  register: (name: string, email: string, password: string, targetRole?: string) => Promise<{ success: boolean; requireOtp?: boolean; email?: string; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  resendOtp: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token from SafeStorage on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken = await SafeStorage.getItem('auth_token');
      const storedUser = await SafeStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        await api.setToken(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token validity in the background (non-blocking)
        api.getMe().then(async (res) => {
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            await SafeStorage.setItem('auth_user', JSON.stringify(res.data.user));
          } else {
            console.warn('[Auth] Token validation failed, clearing session');
            await clearSession();
          }
        }).catch(async (err) => {
          console.warn('[Auth] Background token validation error:', err);
        });
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async () => {
    await api.setToken(null);
    setToken(null);
    setUser(null);
    await SafeStorage.removeItem('auth_token');
    await SafeStorage.removeItem('auth_user');
  };

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      if (res.data.requireOtp) {
        return {
          success: false,
          requireOtp: true,
          email: res.data.email || email,
          message: res.message || 'Please verify your email with the 6-digit code.',
        };
      }
      const { user: userData, token: authToken } = res.data;
      if (userData && authToken) {
        setUser(userData);
        setToken(authToken);
        await api.setToken(authToken);
        await SafeStorage.setItem('auth_token', authToken);
        await SafeStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
    }
    return { success: false, message: res.message || 'Invalid email or password' };
  };

  const register = async (name: string, email: string, password: string, targetRole?: string) => {
    const res = await api.register(name, email, password, targetRole);
    if (res.success) {
      if (res.data?.requireOtp) {
        return {
          success: true,
          requireOtp: true,
          email: res.data.email || email,
          message: res.message || 'Verification code sent to your email.',
        };
      }
      // If direct registration (fallback)
      if (res.data?.user && res.data?.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        await api.setToken(res.data.token);
        await SafeStorage.setItem('auth_token', res.data.token);
        await SafeStorage.setItem('auth_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: true, requireOtp: true, email };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.verifyOtp(email, otp);
    if (res.success && res.data?.token && res.data?.user) {
      const { user: userData, token: authToken } = res.data;
      setUser(userData);
      setToken(authToken);
      await api.setToken(authToken);
      await SafeStorage.setItem('auth_token', authToken);
      await SafeStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true, message: res.message || 'Verification successful' };
    }
    return { success: false, message: res.message || 'Verification code failed' };
  };

  const resendOtp = async (email: string) => {
    const res = await api.resendOtp(email);
    return {
      success: res.success,
      message: res.message || (res.success ? 'New code dispatched to email' : 'Could not resend code'),
    };
  };

  const logout = async () => {
    await clearSession();
  };

  const refreshUser = async () => {
    const res = await api.getProfile();
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      await SafeStorage.setItem('auth_user', JSON.stringify(res.data.user));
    }
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      SafeStorage.setItem('auth_user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
