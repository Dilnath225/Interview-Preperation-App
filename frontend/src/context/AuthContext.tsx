import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeStorage } from '../utils/storage';
import { api } from '../services/api';

interface UserData {
  id: string;
  name: string;
  email: string;
  targetRole?: string | null;
  readinessScore?: number | null;
  skills?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, targetRole?: string) => Promise<{ success: boolean; message?: string }>;
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
        // so the app doesn't hang if the backend is slow or unreachable
        api.getMe().then(async (res) => {
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            await SafeStorage.setItem('auth_user', JSON.stringify(res.data.user));
          } else {
            // Token expired or invalid — clear session
            console.warn('[Auth] Token validation failed, clearing session');
            await clearSession();
          }
        }).catch(async (err) => {
          console.warn('[Auth] Background token validation error:', err);
          // Don't clear session on network errors (timeout, no connection)
          // so the user can still use cached data offline
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
      const { user: userData, token: authToken } = res.data;
      setUser(userData);
      setToken(authToken);
      await api.setToken(authToken);
      await SafeStorage.setItem('auth_token', authToken);
      await SafeStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string, targetRole?: string) => {
    const res = await api.register(name, email, password, targetRole);
    if (res.success && res.data) {
      const { user: userData, token: authToken } = res.data;
      setUser(userData);
      setToken(authToken);
      await api.setToken(authToken);
      await SafeStorage.setItem('auth_token', authToken);
      await SafeStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
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
    setUser((prev) => (prev ? { ...prev, ...data } : null));
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
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
