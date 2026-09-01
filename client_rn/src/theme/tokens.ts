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

/**
 * Default cube accent color (#06ec90 green)
 */
export const DEFAULT_CUBE_COLOR = '#06ec90';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Validate a hex color string in #RRGGBB format
 * (same rule enforced by the server for the cube_color setting)
 */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

/**
 * Convert a #RRGGBB hex color to an rgba() string with the given alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!isValidHexColor(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Relative luminance (0..1) of a #RRGGBB color (WCAG formula).
 * Used to pick a readable text color for placement on top of the accent.
 */
function relativeLuminance(hex: string): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * lin(parseInt(hex.slice(1, 3), 16)) +
    0.7152 * lin(parseInt(hex.slice(3, 5), 16)) +
    0.0722 * lin(parseInt(hex.slice(5, 7), 16))
  );
}

/** Extract the alpha value from an rgba() string, or the fallback if not rgba */
function extractAlpha(color: string, fallback: number): number {
  const match = /rgba\([^)]+,\s*([\d.]+)\)/.exec(color);
  return match ? parseFloat(match[1]) : fallback;
}

/**
 * Return a copy of the theme with every accent-derived token recalculated
 * from the given cube accent color (the `cube_color` user setting).
 *
 * Follows the accent: the main accent + all of its opacity variants, ALL text
 * (headings, field labels, body, muted text), standard borders/input borders
 * and the success status color. Text placed ON accent backgrounds (greenLabel)
 * is computed as an automatic contrast color (dark text on bright accents,
 * white text on dark accents). Cube-specific tokens (cubeBorder/cubeGlow/
 * cubeShadow) are intentionally left untouched - they belong to the separate
 * cube_color2 setting.
 */
export function withAccentColor(theme: Theme, accent: string): Theme {
  if (!isValidHexColor(accent)) return theme;
  // Keep each base theme's alphas when re-tinting rgba tokens (dark/light differ)
  const retint = (color: string, fallback: number) =>
    hexToRgba(accent, extractAlpha(color, fallback));
  return {
    ...theme,
    colors: {
      ...theme.colors,
      green: accent,
      greenStrong: accent,
      greenSoft: accent,
      green02: hexToRgba(accent, 0.02),
      green05: hexToRgba(accent, 0.05),
      green08: hexToRgba(accent, 0.08),
      green10: hexToRgba(accent, 0.1),
      green15: hexToRgba(accent, 0.15),
      green20: hexToRgba(accent, 0.2),
      green25: hexToRgba(accent, 0.25),
      green30: hexToRgba(accent, 0.3),
      green35: hexToRgba(accent, 0.35),
      green40: hexToRgba(accent, 0.4),
      green50: hexToRgba(accent, 0.5),
      green55: hexToRgba(accent, 0.55),
      green70: hexToRgba(accent, 0.7),
      green85: hexToRgba(accent, 0.85),
      // All text follows the chosen accent color
      text: accent,
      textMuted: retint(theme.colors.textMuted, 0.7),
      // Text placed on accent backgrounds: automatic contrast (was static #67c6a0)
      greenLabel: relativeLuminance(accent) > 0.5 ? '#020202' : '#ffffff',
      // Standard borders + input borders tinted with accent (cube* excluded)
      border: retint(theme.colors.border, 0.4),
      borderStrong: retint(theme.colors.borderStrong, 0.7),
      inputBorder: retint(theme.colors.inputBorder, 0.4),
      // Success status follows accent
      success: accent,
      successBg: hexToRgba(accent, 0.95),
    },
  };
}