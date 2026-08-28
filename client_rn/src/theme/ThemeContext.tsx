import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Theme, type ThemeName, isValidTheme, DEFAULT_THEME } from './tokens';
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
  initialTheme?: ThemeName;
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>(
    isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME
  );

  const theme = getThemeByName(themeName);

  const setTheme = useCallback((newThemeName: ThemeName) => {
    if (!isValidTheme(newThemeName)) return;
    setThemeNameState(newThemeName);
  }, []);

  const toggleTheme = useCallback(() => {
    const newThemeName: ThemeName = themeName === 'dark' ? 'light' : 'dark';
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
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}