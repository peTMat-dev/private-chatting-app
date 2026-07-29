/**
 * Dark Theme
 * 
 * Extracted from current globals.css :root values.
 * This is the default theme for the application.
 */

import { Theme } from './tokens';

export const darkTheme: Theme = {
  colors: {
    // Primary accent colors (bright green #06ec90)
    green: '#06ec90',
    greenStrong: '#06ec90',
    greenSoft: '#06ec90',
    greenLabel: '#67c6a0',
    
    // Opacity variants (using darker green rgb(3, 160, 98) for subtle effects)
    green02: 'rgba(3, 160, 98, 0.02)',
    green05: 'rgba(3, 160, 98, 0.05)',
    green08: 'rgba(3, 160, 98, 0.08)',
    green10: 'rgba(3, 160, 98, 0.1)',
    green15: 'rgba(3, 160, 98, 0.15)',
    green20: 'rgba(3, 160, 98, 0.2)',
    green25: 'rgba(3, 160, 98, 0.25)',
    green30: 'rgba(3, 160, 98, 0.3)',
    green35: 'rgba(3, 160, 98, 0.35)',
    green40: 'rgba(3, 160, 98, 0.4)',
    green50: 'rgba(3, 160, 98, 0.5)',
    green55: 'rgba(3, 160, 98, 0.55)',
    green70: 'rgba(3, 160, 98, 0.7)',
    green85: 'rgba(3, 160, 98, 0.85)',
    
    // Cube-specific colors (placeholder - will be implemented in Phase 4)
    cubeBorder: 'rgba(3, 160, 98, 0.4)',
    cubeGlow: 'rgba(6, 236, 144, 0.4)',
    cubeShadow: 'rgba(6, 236, 144, 0.2)',
    
    // Background colors
    background: '#020202',
    panel: '#050505',
    panelMuted: '#0b0b0b',
    
    // Text colors
    text: '#67c6a0',
    textMuted: 'rgba(3, 160, 98, 0.7)',
    
    // Input/Form colors
    inputBg: '#010101',
    inputBorder: 'rgba(3, 160, 98, 0.4)',
    
    // Border colors
    border: 'rgba(3, 160, 98, 0.4)',
    borderStrong: 'rgba(3, 160, 98, 0.7)',
    
    // Status colors
    error: '#ff6b6b',
    errorBg: 'rgba(255, 80, 80, 0.12)',
    errorBorder: 'rgba(255, 80, 80, 0.55)',
    success: '#06ec90',
    successBg: 'rgba(6, 236, 144, 0.95)',
    warning: '#f0a830',
    warningBg: 'rgba(240, 168, 48, 0.12)',
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
    soft: '0 0 20px rgba(6, 236, 144, 0.2)',
    strong: '0 0 40px rgba(6, 236, 144, 0.4)',
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