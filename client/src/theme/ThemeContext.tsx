"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { Theme, ThemeName, isValidTheme, DEFAULT_THEME, THEME_COOKIE_NAME } from "./tokens";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";

/**
 * Get theme object by name
 */
function getThemeByName(name: ThemeName): Theme {
  switch (name) {
    case "light":
      return lightTheme;
    case "dark":
    default:
      return darkTheme;
  }
}

/**
 * Apply theme values to CSS variables on document root
 * This is the CSS bridge that allows existing CSS to work with ThemeContext
 */
function applyThemeToCSSVariables(theme: Theme): void {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  const { colors, shadows } = theme;
  
  // Background colors
  root.style.setProperty("--color-black", colors.background);
  root.style.setProperty("--color-panel", colors.panel);
  root.style.setProperty("--color-panel-muted", colors.panelMuted);
  
  // Accent colors
  root.style.setProperty("--color-green", colors.green);
  root.style.setProperty("--color-green-strong", colors.greenStrong);
  root.style.setProperty("--color-green-soft", colors.greenSoft);
  root.style.setProperty("--color-form-text", colors.text);
  
  // Input colors
  root.style.setProperty("--color-input-bg", colors.inputBg);
  
  // Border colors
  root.style.setProperty("--color-border", colors.border);
  root.style.setProperty("--color-border-strong", colors.borderStrong);
  
  // Shadows
  root.style.setProperty("--shadow-soft", shadows.soft);
  root.style.setProperty("--shadow-strong", shadows.strong);
  
  // Opacity variants for green
  root.style.setProperty("--color-green-02", colors.green02);
  root.style.setProperty("--color-green-05", colors.green05);
  root.style.setProperty("--color-green-08", colors.green08);
  root.style.setProperty("--color-green-10", colors.green10);
  root.style.setProperty("--color-green-15", colors.green15);
  root.style.setProperty("--color-green-20", colors.green20);
  root.style.setProperty("--color-green-25", colors.green25);
  root.style.setProperty("--color-green-30", colors.green30);
  root.style.setProperty("--color-green-35", colors.green35);
  root.style.setProperty("--color-green-40", colors.green40);
  root.style.setProperty("--color-green-50", colors.green50);
  root.style.setProperty("--color-green-55", colors.green55);
  root.style.setProperty("--color-green-70", colors.green70);
  root.style.setProperty("--color-green-85", colors.green85);
  
  // Status colors
  root.style.setProperty("--color-error", colors.error);
  root.style.setProperty("--color-error-bg", colors.errorBg);
  root.style.setProperty("--color-error-border", colors.errorBorder);
  root.style.setProperty("--color-success", colors.success);
  root.style.setProperty("--color-success-bg", colors.successBg);
  root.style.setProperty("--color-warning", colors.warning);
  root.style.setProperty("--color-warning-bg", colors.warningBg);
  
  // Cube-specific colors
  root.style.setProperty("--color-cube-border", colors.cubeBorder);
  root.style.setProperty("--color-cube-glow", colors.cubeGlow);
  root.style.setProperty("--color-cube-shadow", colors.cubeShadow);
  
  // Set data-theme attribute for any CSS that uses [data-theme] selectors
  root.setAttribute("data-theme", theme === lightTheme ? "light" : "dark");
}

/**
 * Set theme cookie for persistence
 */
function setThemeCookie(themeName: ThemeName): void {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE_NAME}=${themeName};path=/;max-age=31536000;SameSite=Lax`;
}

interface ThemeContextType {
  /** Current theme name ('dark' or 'light') */
  themeName: ThemeName;
  /** Current theme object with all design tokens */
  theme: Theme;
  /** Switch to a different theme */
  setTheme: (themeName: ThemeName) => void;
  /** Toggle between dark and light themes */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme name, read from cookie in layout.tsx for SSR */
  initialTheme?: ThemeName;
}

/**
 * Check if theme cookie exists (indicates user has made a choice before)
 */
function hasThemeCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${THEME_COOKIE_NAME}=`);
}

/**
 * Detect system color scheme preference
 */
function getSystemThemePreference(): ThemeName {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: ThemeProviderProps) {
  // initialTheme is read from the cubcha_theme cookie in layout.tsx and passed here
  // so the server-rendered and client-rendered initial theme always match (no hydration mismatch).
  const [themeName, setThemeNameState] = useState<ThemeName>(
    isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME
  );
  
  const theme = getThemeByName(themeName);
  
  // Detect system preference on first visit (no cookie)
  useEffect(() => {
    if (!hasThemeCookie()) {
      const systemPreference = getSystemThemePreference();
      if (systemPreference !== themeName) {
        setThemeNameState(systemPreference);
        setThemeCookie(systemPreference);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Apply theme to CSS variables whenever theme changes
  useEffect(() => {
    applyThemeToCSSVariables(theme);
  }, [theme]);
  
  const setTheme = useCallback((newThemeName: ThemeName) => {
    if (!isValidTheme(newThemeName)) return;
    setThemeNameState(newThemeName);
    setThemeCookie(newThemeName);
  }, []);
  
  const toggleTheme = useCallback(() => {
    const newThemeName: ThemeName = themeName === "dark" ? "light" : "dark";
    setTheme(newThemeName);
  }, [themeName, setTheme]);
  
  return (
    <ThemeContext.Provider value={{ themeName, theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}