// contexts/ThemeContext.tsx
// Provides the active color set app-wide. Defaults to the system's
// light/dark setting, but the user can override with a manual choice
// (persisted so it's remembered next launch).

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../theme/theme';

const THEME_KEY = '@jp_flashcards/theme_preference_v1';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPreference(value);
      }
      setLoaded(true);
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setPreference(pref);
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => {});
  };

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, isDark, themePreference: preference, setThemePreference }),
    [colors, isDark, preference]
  );

  // Brief blank frame while the saved preference loads — avoids a
  // flash of the wrong theme on launch. Resolves almost instantly.
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
