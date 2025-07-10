'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, setSession, removeSession, getSessionExpiry, refreshSession } from '@/lib/session';

interface User {
  id: number;
  email: string;
  username: string;
  role: 'student' | 'admin' | 'instructor';
  avatar_url?: string;
  total_points: number;
  level: number;
  created_at: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ user: User | null; success: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = getSession('authToken');
      const expiryTime = getSessionExpiry('authToken');
      
      if (!token || !expiryTime) {
        setLoading(false);
        return;
      }

      // Check if session has expired
      const now = new Date().getTime();
      
      if (now > expiryTime) {
        // Session expired, clear storage
        removeSession('authToken');
        setUser(null);
        setLoading(false);
        return;
      }

      // Session is still valid, verify with server
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        // Refresh the session expiry time (5 minutes from now)
        refreshSession('authToken', 5);
      } else {
        // Token invalid, clear session
        removeSession('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      removeSession('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ user: User | null; success: boolean }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Set session with 5-minute expiry
        setSession('authToken', data.token, 5);
        
        return { user: data.user, success: true };
      }
      return { user: null, success: false };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, success: false };
    }
  };

  const logout = () => {
    removeSession('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 