import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '../api';
import { registerLogoutCallback } from '../api/client';
import type { MyProfileResponse } from '../types';

interface AuthContextType {
  user: MyProfileResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const doLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    registerLogoutCallback(doLogout);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      userApi.getMyProfile()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    const profileRes = await userApi.getMyProfile();
    setUser(profileRes.data);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    doLogout();
  };

  const signup = async (email: string, password: string, nickname: string) => {
    await authApi.signup({ email, password, nickname });
  };

  const refreshUser = async () => {
    const res = await userApi.getMyProfile();
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
