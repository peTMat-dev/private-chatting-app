/**
 * Theme System
 * 
 * Platform-agnostic theme system for web and React Native.
 * 
 * Usage:
 * ```tsx
 * import { useTheme, ThemeProvider } from '@/theme';
 * 
 * function MyComponent() {
 *   const { theme } = useTheme();
 *   return <View style={{ backgroundColor: theme.colors.background }}>Hello</View>;
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