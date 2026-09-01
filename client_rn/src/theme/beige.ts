/**
 * Beige Theme (light warm cream)
 *
 * A warm, sepia-toned light variant: beige background (#fff0db) with dark
 * warm-brown text. Selected via the "beige" system_color_theme value.
 *
 * Note: the user's cube_color accent is applied on top of this theme by
 * withAccentColor(), so the accent, text and border tokens below are sensible
 * warm-toned fallbacks that get re-derived from the accent at runtime.
 */

import { Theme } from './tokens';

export const beigeTheme: Theme = {
  colors: {
    // Primary accent colors (user cube_color is applied on top of these;
    // darker base green for contrast on the light beige background)
    green: '#059669',
    greenStrong: '#047857',
    greenSoft: '#10b981',
    greenLabel: '#4a3b28',

    // Opacity variants (warm brown base, rgb(120, 96, 60))
    green02: 'rgba(120, 96, 60, 0.02)',
    green05: 'rgba(120, 96, 60, 0.05)',
    green08: 'rgba(120, 96, 60, 0.08)',
    green10: 'rgba(120, 96, 60, 0.1)',
    green15: 'rgba(120, 96, 60, 0.15)',
    green20: 'rgba(120, 96, 60, 0.2)',
    green25: 'rgba(120, 96, 60, 0.25)',
    green30: 'rgba(120, 96, 60, 0.3)',
    green35: 'rgba(120, 96, 60, 0.35)',
    green40: 'rgba(120, 96, 60, 0.4)',
    green50: 'rgba(120, 96, 60, 0.5)',
    green55: 'rgba(120, 96, 60, 0.55)',
    green70: 'rgba(120, 96, 60, 0.7)',
    green85: 'rgba(120, 96, 60, 0.85)',

    // Cube-specific colors (warm brown - cube_color2 will control these later)
    cubeBorder: 'rgba(150, 120, 70, 0.35)',
    cubeGlow: 'rgba(150, 120, 70, 0.25)',
    cubeShadow: 'rgba(0, 0, 0, 0.1)',

    // Background colors (user-requested beige #fff0db)
    background: '#fff0db',
    panel: '#fff8ea',
    panelMuted: '#f7e7cc',

    // Text colors (dark warm brown)
    text: '#4a3b28',
    textMuted: 'rgba(74, 59, 40, 0.7)',

    // Input/Form colors
    inputBg: '#fffaef',
    inputBorder: 'rgba(120, 96, 60, 0.3)',

    // Border colors
    border: 'rgba(120, 96, 60, 0.3)',
    borderStrong: 'rgba(120, 96, 60, 0.6)',

    // Status colors
    error: '#dc2626',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    errorBorder: 'rgba(220, 38, 38, 0.4)',
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.95)',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
  },

  typography: {
    fontFamily: 'var(--font-geist-sans, "Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },

  shadows: {
    soft: '0 2px 10px rgba(0, 0, 0, 0.05)',
    strong: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },

  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};