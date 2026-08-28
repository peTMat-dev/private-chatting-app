/**
 * Theme System Contract
 * 
 * This defines the platform-agnostic theme structure that both Web and future
 * React Native apps consume. Theme values are pure data - no CSS or platform
 * specific code.
 * 
 * Web: ThemeContext updates CSS variables from these values
 * Mobile: React Native consumes these values directly via StyleSheet
 */

export interface ThemeColors {
  // Primary accent colors (from cube_color user setting)
  green: string;           // Primary accent (buttons, links, highlights)
  greenStrong: string;     // Stronger variant for hover/active states
  greenSoft: string;       // Softer variant for backgrounds
  greenLabel: string;      // Text color on green backgrounds
  
  // Opacity variants for green (used throughout UI)
  green02: string;         // 2% opacity - very subtle backgrounds
  green05: string;         // 5% opacity - subtle backgrounds
  green08: string;         // 8% opacity - hover backgrounds
  green10: string;         // 10% opacity - subtle backgrounds
  green15: string;         // 15% opacity - input focus states
  green20: string;         // 20% opacity - hover states
  green25: string;         // 25% opacity - borders
  green30: string;         // 30% opacity - active states
  green35: string;         // 35% opacity - medium emphasis
  green40: string;         // 40% opacity - strong borders
  green50: string;         // 50% opacity - overlays
  green55: string;         // 55% opacity - medium-strong emphasis
  green70: string;         // 70% opacity - strong emphasis
  green85: string;         // 85% opacity - near-solid
  
  // Cube-specific colors (from cube_color2 user setting)
  cubeBorder: string;      // 3D cube face borders
  cubeGlow: string;        // Cube glow/shadow effects
  cubeShadow: string;      // Cube drop shadows
  
  // Background colors
  background: string;      // Main app background
  panel: string;           // Card/panel backgrounds
  panelMuted: string;      // Muted/subtle panel backgrounds
  
  // Text colors
  text: string;            // Primary text color
  textMuted: string;       // Secondary/muted text
  
  // Input/Form colors
  inputBg: string;         // Input field backgrounds
  inputBorder: string;     // Input field borders
  
  // Border colors
  border: string;          // Standard borders
  borderStrong: string;    // Strong/emphasized borders
  
  // Status colors
  error: string;           // Error state color
  errorBg: string;         // Error background
  errorBorder: string;     // Error border
  success: string;         // Success state color
  successBg: string;       // Success background
  warning: string;         // Warning state color
  warningBg: string;       // Warning background
}

export interface ThemeTypography {
  fontFamily: string;      // Primary font family
  fontSize: {
    xs: number;           // Extra small (10px)
    sm: number;           // Small (12px)
    md: number;           // Medium (14px)
    lg: number;           // Large (16px)
    xl: number;           // Extra large (20px)
    xxl: number;          // Double extra large (24px)
  };
  fontWeight: {
    normal: number;       // 400
    medium: number;       // 500
    semibold: number;     // 600
    bold: number;         // 700
  };
  lineHeight: {
    tight: number;        // 1.2
    normal: number;       // 1.5
    relaxed: number;      // 1.75
  };
}

export interface ThemeSpacing {
  xs: number;             // 4px
  sm: number;             // 8px
  md: number;             // 12px
  lg: number;             // 16px
  xl: number;             // 24px
  xxl: number;            // 32px
}

export interface ThemeRadius {
  sm: number;             // 4px
  md: number;             // 8px
  lg: number;             // 12px
  full: number;           // 9999px (circular)
}

export interface ThemeShadows {
  soft: string;           // Subtle shadow for cards
  strong: string;         // Strong shadow for modals/overlays
}

export interface ThemeAnimation {
  duration: {
    fast: number;         // 150ms
    normal: number;       // 300ms
    slow: number;         // 500ms
  };
  easing: {
    default: string;      // 'cubic-bezier(0.4, 0, 0.2, 1)'
    in: string;           // 'cubic-bezier(0.4, 0, 1, 1)'
    out: string;          // 'cubic-bezier(0, 0, 0.2, 1)'
    inOut: string;        // 'cubic-bezier(0.4, 0, 0.2, 1)'
  };
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  animation: ThemeAnimation;
}

/**
 * Theme type identifiers
 */
export type ThemeName = 'dark' | 'light';

/**
 * Default theme name
 */
export const DEFAULT_THEME: ThemeName = 'dark';

/**
 * Cookie name for theme persistence
 */
export const THEME_COOKIE_NAME = 'cubcha_theme';

/**
 * Validate theme name
 */
export function isValidTheme(value: string): value is ThemeName {
  return value === 'dark' || value === 'light';
}