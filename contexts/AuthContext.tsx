// contexts/AuthContext.tsx
// Manages the Supabase auth session app-wide, plus a "continue as
// guest" bypass so the app isn't hard-gated behind login — guests can
// use everything the app already does today; logging in is additive,
// not a requirement, unless you later decide to gate specific features
// (e.g. subscriptions) behind having an account.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

const GUEST_MODE_KEY = '@jp_flashcards/guest_mode_v1';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  guestMode: boolean;
  setGuestMode: (value: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_MODE_KEY).then((v) => setGuestModeState(v === 'true'));

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const setGuestMode = (value: boolean) => {
    setGuestModeState(value);
    AsyncStorage.setItem(GUEST_MODE_KEY, String(value)).catch(() => {});
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      guestMode,
      setGuestMode,
      signUp,
      signIn,
      signOut,
      resetPassword,
    }),
    [session, loading, guestMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
