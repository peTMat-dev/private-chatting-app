/// <reference lib="dom" />
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  type Theme,
  type ThemeName,
  isValidTheme,
  isValidHexColor,
  withAccentColor,
  DEFAULT_THEME,
  DEFAULT_CUBE_COLOR,
} from './tokens';
import { darkTheme } from './dark';
import { lightTheme } from './light';

function getThemeByName(name: ThemeName): Theme {
  switch (name) {
    case 'light':
      return lightTheme;
    case 'dark':
    default:
      return darkTheme;
  }
}

/** Storage key for the persisted cube accent color (same key as the web client) */
const ACCENT_STORAGE_KEY = 'cubcha_cube_color';

/** Load the persisted accent color: localStorage on web, SecureStore on native */
async function loadStoredAccentColor(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(ACCENT_STORAGE_KEY);
    }
    return await SecureStore.getItemAsync(ACCENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist the accent color: localStorage on web, SecureStore on native */
async function persistAccentColor(color: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(ACCENT_STORAGE_KEY, color);
      return;
    }
    await SecureStore.setItemAsync(ACCENT_STORAGE_KEY, color);
  } catch {
    // Accent persistence is non-critical - ignore storage failures
  }
}

interface ThemeContextType {
  /** Current theme name ('dark' or 'light') */
  themeName: ThemeName;
  /** Current theme object with all design tokens (accent color applied) */
  theme: Theme;
  /** Current cube accent color (#RRGGBB, from the cube_color user setting) */
  accentColor: string;
  /** Switch to a different theme */
  setTheme: (themeName: ThemeName) => void;
  /** Change the cube accent color (validates + persists) */
  setAccentColor: (color: string) => void;
  /** Toggle between dark and light themes */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>(
    isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME
  );
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_CUBE_COLOR);

  // Restore the persisted accent color on mount so the user's saved choice
  // is applied before the settings face loads
  useEffect(() => {
    let cancelled = false;
    loadStoredAccentColor().then((stored) => {
      if (!cancelled && stored && isValidHexColor(stored)) {
        setAccentColorState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Theme with the accent color applied to all accent ("green*") tokens
  const theme = useMemo(
    () => withAccentColor(getThemeByName(themeName), accentColor),
    [themeName, accentColor]
  );

  const setTheme = useCallback((newThemeName: ThemeName) => {
    if (!isValidTheme(newThemeName)) return;
    setThemeNameState(newThemeName);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    if (!isValidHexColor(color)) return;
    setAccentColorState(color);
    void persistAccentColor(color);
  }, []);

  const toggleTheme = useCallback(() => {
    const newThemeName: ThemeName = themeName === 'dark' ? 'light' : 'dark';
    setTheme(newThemeName);
  }, [themeName, setTheme]);

  return (
    <ThemeContext.Provider value={{ themeName, theme, accentColor, setTheme, setAccentColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}