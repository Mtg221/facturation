import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { setAccessToken } from '../services/api.service';
import type { User } from '../types/auth.types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAccessToken(token);
    authService
      .getMe()
      .then((userData) => setUser(userData))
      .catch(() => {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, motDePasse: string) => {
    const response = await authService.login({ email, motDePasse });
    setAccessToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
