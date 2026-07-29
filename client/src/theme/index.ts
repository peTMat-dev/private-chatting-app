/**
 * Theme System
 * 
 * Platform-agnostic theme system for web and future React Native apps.
 * 
 * Usage:
 * ```tsx
 * import { useTheme, ThemeProvider } from '@/theme';
 * 
 * function MyComponent() {
 *   const { theme, themeName, toggleTheme } = useTheme();
 *   return <div style={{ color: theme.colors.green }}>Hello</div>;
 * }
 * ```
 */

// Types and constants
export {
  type Theme,
  type ThemeColors,
  type ThemeTypography,
  type ThemeSpacing,
  type ThemeRadius,
  type ThemeShadows,
  type ThemeAnimation,
  type ThemeName,
  DEFAULT_THEME,
  THEME_COOKIE_NAME,
  isValidTheme,
} from './tokens';

// Theme objects
export { darkTheme } from './dark';
export { lightTheme } from './light';

// Context and hooks
export { ThemeProvider, useTheme } from './ThemeContext';