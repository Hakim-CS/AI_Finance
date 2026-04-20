import { API_BASE } from "@/lib/api";
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from './PreferencesContext';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  phone?: string;
  income?: number;
  saving_target?: number;
  avatar_url?: string;
}

interface AuthContextType {
  user:                User | null;
  token:               string | null;
  isLoading:           boolean;
  /** ISO date string if the account is in the 14-day deletion grace period, else null */
  deletionDate:        string | null;
  login:               (email: string, password: string) => Promise<void>;
  register:            (email: string, password: string, name?: string, username?: string) => Promise<void>;
  logout:              () => void;
  updateUser:          (updatedUser: Partial<User>) => void;
  /** Call after a successful POST /auth/account/restore to clear the pending deletion state */
  clearDeletionState:  () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,         setUser]         = useState<User | null>(null);
  const [token,        setToken]        = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState<boolean>(true);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loadPrefs } = usePreferences();

  // ── Rehydrate from localStorage on every page refresh ───────────────────────
  useEffect(() => {
    const storedToken        = localStorage.getItem('token');
    const storedUser         = localStorage.getItem('user');
    const storedDeletionDate = localStorage.getItem('deletionDate');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        if (storedDeletionDate) setDeletionDate(storedDeletionDate);
        loadPrefs(storedToken).catch(console.error);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('deletionDate');
      }
    }
    setIsLoading(false);

    // Listen for localStorage changes from other components (e.g. Settings soft-delete)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'deletionDate') {
        setDeletionDate(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Store user + token helper ───────────────────────────────────────────────
  const persistSession = useCallback(
    (newUser: User, newToken: string, pendingDeletion: string | null = null) => {
      setUser(newUser);
      setToken(newToken);
      setDeletionDate(pendingDeletion);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      if (pendingDeletion) {
        localStorage.setItem('deletionDate', pendingDeletion);
      } else {
        localStorage.removeItem('deletionDate');
      }
    },
    []
  );

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      const newUser: User = {
        id:         data.user.id,
        email:      data.user.email,
        name:       data.user.name,
        username:   data.user.username,
        phone:      data.user.phone,
        income:     Number(data.user.income) || 0,
        avatar_url: data.user.avatar_url || undefined,
      };

      // Handle grace-period login — store the deletion date but still log in
      const pendingDeletion: string | null =
        data.status === 'account_pending_deletion' ? data.deletion_date : null;

      persistSession(newUser, data.token, pendingDeletion);
      await loadPrefs(data.token);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, name?: string, username?: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, name, username }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Registration failed');
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setToken(null);
    setDeletionDate(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('deletionDate');
    navigate('/login');
  };

  // ── updateUser (partial merge) ───────────────────────────────────────────────
  const updateUser = (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // ── clearDeletionState — called after successful restore ────────────────────
  const clearDeletionState = () => {
    setDeletionDate(null);
    localStorage.removeItem('deletionDate');
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, deletionDate,
      login, register, logout, updateUser, clearDeletionState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
