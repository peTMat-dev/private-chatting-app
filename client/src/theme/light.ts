/**
 * Light Theme
 * 
 * Proper light theme with WCAG-compliant contrast ratios.
 * Uses darker green variants for better readability on white backgrounds.
 */

import { Theme } from './tokens';

export const lightTheme: Theme = {
  colors: {
    // Primary accent colors (darker green for white background contrast)
    green: '#059669',
    greenStrong: '#047857',
    greenSoft: '#10b981',
    greenLabel: '#1f2937',
    
    // Opacity variants (using darker green for light theme)
    green02: 'rgba(5, 150, 105, 0.02)',
    green05: 'rgba(5, 150, 105, 0.05)',
    green08: 'rgba(5, 150, 105, 0.08)',
    green10: 'rgba(5, 150, 105, 0.1)',
    green15: 'rgba(5, 150, 105, 0.15)',
    green20: 'rgba(5, 150, 105, 0.2)',
    green25: 'rgba(5, 150, 105, 0.25)',
    green30: 'rgba(5, 150, 105, 0.3)',
    green35: 'rgba(5, 150, 105, 0.35)',
    green40: 'rgba(5, 150, 105, 0.4)',
    green50: 'rgba(5, 150, 105, 0.5)',
    green55: 'rgba(5, 150, 105, 0.55)',
    green70: 'rgba(5, 150, 105, 0.7)',
    green85: 'rgba(5, 150, 105, 0.85)',
    
    // Cube-specific colors (placeholder - will be implemented in Phase 4)
    cubeBorder: 'rgba(5, 150, 105, 0.3)',
    cubeGlow: 'rgba(5, 150, 105, 0.2)',
    cubeShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Background colors
    background: '#f0f2f5',
    panel: '#ffffff',
    panelMuted: '#f8f9fa',
    
    // Text colors (dark text for light background)
    text: '#1f2937',
    textMuted: '#4b5563',
    
    // Input/Form colors
    inputBg: '#f9fafb',
    inputBorder: 'rgba(5, 150, 105, 0.3)',
    
    // Border colors
    border: 'rgba(5, 150, 105, 0.3)',
    borderStrong: 'rgba(5, 150, 105, 0.6)',
    
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