import { useCallback, useEffect, useState, Dispatch, SetStateAction, FormEvent } from "react";
import { getApi, fetchApiCustom } from "../services/api.service";
import { getLang, setLang, type LangCode } from "../lib/i18n";
import type { UserSettings, ApiSettingsResponse, ApiTimezonesResponse } from "../lib/formTypes";

// Theme type
export type ColorTheme = 'light' | 'dark';

// Default cube color (accent color)
export const DEFAULT_CUBE_COLOR = '#06ec90';

// Default cube color 2 (same as accent color)
export const DEFAULT_CUBE_COLOR2 = '#06ec90';

// Preset colors for the color picker
export const PRESET_COLORS = [
  { name: 'Green', hex: '#06ec90' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Yellow', hex: '#EAB308' },
];

// Preset colors for the cube color 2 picker (same as accent color presets)
export const CUBE_COLOR2_PRESET_COLORS = [
  { name: 'Green', hex: '#06ec90' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Yellow', hex: '#EAB308' },
];

// Helper to apply theme to document
const applyTheme = (theme: ColorTheme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cubcha_theme', theme);
};

// Helper to get stored theme
const getStoredTheme = (): ColorTheme => {
  const stored = localStorage.getItem('cubcha_theme');
  return (stored === 'light' || stored === 'dark') ? stored : 'dark';
};

// Helper to apply cube color to document
const applyCubeColor = (color: string) => {
  document.documentElement.style.setProperty('--color-green', color);
  localStorage.setItem('cubcha_cube_color', color);
};

// Helper to get stored cube color
const getStoredCubeColor = (): string => {
  const stored = localStorage.getItem('cubcha_cube_color');
  return stored && /^#[0-9A-Fa-f]{6}$/.test(stored) ? stored : DEFAULT_CUBE_COLOR;
};

// Helper to convert hex color to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper to apply cube color 2 to document
const applyCubeColor2 = (color: string) => {
  document.documentElement.style.setProperty('--color-cube2', color);
  
  // Convert hex to RGB for derived variables
  const rgb = hexToRgb(color);
  if (rgb) {
    // Create border color with 0.4 opacity (darker version)
    const borderColor = `rgba(${Math.round(rgb.r * 0.2)}, ${Math.round(rgb.g * 0.63)}, ${Math.round(rgb.b * 0.63)}, 0.4)`;
    // Create label color (softer/muted version)
    const labelColor = `rgb(${Math.round(rgb.r * 0.4 + 100)}, ${Math.round(rgb.g * 0.78 + 50)}, ${Math.round(rgb.b * 0.63 + 60)})`;
    
    document.documentElement.style.setProperty('--color-cube2-border', borderColor);
    document.documentElement.style.setProperty('--color-cube2-label', labelColor);
  }
  
  localStorage.setItem('cubcha_cube_color2', color);
};

// Helper to get stored cube color 2
const getStoredCubeColor2 = (): string => {
  const stored = localStorage.getItem('cubcha_cube_color2');
  return stored && /^#[0-9A-Fa-f]{6}$/.test(stored) ? stored : DEFAULT_CUBE_COLOR2;
};

interface UseSettingsFaceOptions {
  username: string;
  activeFace: string;
  showAlert: (message: string, title?: string) => void;
}

interface UseSettingsFaceReturn {
  settings: UserSettings | null;
  setSettings: Dispatch<SetStateAction<UserSettings | null>>;
  settingsError: string | null;
  setSettingsError: Dispatch<SetStateAction<string | null>>;
  savingSettings: boolean;
  settingsSaved: boolean;
  timezones: Array<{ timezone_name: string; display_name: string }>;
  lang: LangCode;
  showLangSelect: boolean;
  setShowLangSelect: Dispatch<SetStateAction<boolean>>;
  showMaxParticipantsSelect: boolean;
  setShowMaxParticipantsSelect: Dispatch<SetStateAction<boolean>>;
  showTimezoneSelect: boolean;
  setShowTimezoneSelect: Dispatch<SetStateAction<boolean>>;
  showThemeSelect: boolean;
  setShowThemeSelect: Dispatch<SetStateAction<boolean>>;
  showColorPicker: boolean;
  setShowColorPicker: Dispatch<SetStateAction<boolean>>;
  showCubeColor2Picker: boolean;
  setShowCubeColor2Picker: Dispatch<SetStateAction<boolean>>;
  handleSaveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleLangChange: (code: LangCode) => void;
  handleThemeChange: (theme: ColorTheme) => void;
  handleCubeColorChange: (color: string) => void;
  handleColorDoubleTap: (color: string) => void;
  handleCubeColor2Change: (color: string) => void;
  handleCubeColor2DoubleTap: (color: string) => void;
}

export function useSettingsFace({
  username,
  activeFace,
  showAlert,
}: UseSettingsFaceOptions): UseSettingsFaceReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [timezones, setTimezones] = useState<Array<{ timezone_name: string; display_name: string }>>([]);
  const [lang, setLangState] = useState<LangCode>("en");
  const [showLangSelect, setShowLangSelect] = useState(false);
  const [showMaxParticipantsSelect, setShowMaxParticipantsSelect] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [showThemeSelect, setShowThemeSelect] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCubeColor2Picker, setShowCubeColor2Picker] = useState(false);

  // Initialize lang, theme, cube color, and cube color 2 from storage
  useEffect(() => {
    setLangState(getLang());
    // Apply stored theme on mount
    applyTheme(getStoredTheme());
    // Apply stored cube color on mount
    applyCubeColor(getStoredCubeColor());
    // Apply stored cube color 2 on mount
    applyCubeColor2(getStoredCubeColor2());
  }, []);

  // Fetch settings and timezones when navigating to settings face
  useEffect(() => {
    if (activeFace !== "back" || !username) return;

    let aborted = false;

    const fetchSettings = async () => {
      try {
        const data = await getApi<ApiSettingsResponse>("/settings");
        if (!aborted && data.data) {
          setSettings(data.data);
          // Apply theme from server settings
          if (data.data.system_color_theme) {
            applyTheme(data.data.system_color_theme);
          }
          // Apply cube color from server settings
          if (data.data.cube_color) {
            applyCubeColor(data.data.cube_color);
          }
          // Apply cube color 2 from server settings
          if (data.data.cube_color2) {
            applyCubeColor2(data.data.cube_color2);
          }
        }
      } catch (err) {
        if (!aborted) setSettingsError((err as Error).message);
      }
    };

    const fetchTimezones = async () => {
      try {
        const data = await getApi<ApiTimezonesResponse>("/settings/timezones");
        if (!aborted && data.data) setTimezones(data.data);
      } catch (err) {
        console.error("Failed to fetch timezones:", err);
      }
    };

    fetchSettings();
    fetchTimezones();

    return () => {
      aborted = true;
    };
  }, [activeFace, username]);

  const handleSaveSettings = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || !username) return;

    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);

    try {
      await fetchApiCustom<ApiSettingsResponse>("/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
        }),
      });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setSettingsError((err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  }, [settings, username]);

  // Helper to save settings immediately (for double-click)
  const saveSettingsImmediately = useCallback(async (updatedSettings: UserSettings) => {
    if (!username) return;

    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);

    try {
      await fetchApiCustom<ApiSettingsResponse>("/settings", {
        method: "PUT",
        body: JSON.stringify(updatedSettings),
      });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setSettingsError((err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  }, [username]);

  const handleLangChange = useCallback((code: LangCode) => {
    setLang(code);
    setLangState(code);
    if (settings) setSettings({ ...settings, user_language: code });
    setShowLangSelect(false);
  }, [settings]);

  const handleThemeChange = useCallback((theme: ColorTheme) => {
    applyTheme(theme);
    if (settings) setSettings({ ...settings, system_color_theme: theme });
    setShowThemeSelect(false);
  }, [settings]);

  const handleCubeColorChange = useCallback((color: string) => {
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) return;
    
    applyCubeColor(color);
    if (settings) setSettings({ ...settings, cube_color: color });
  }, [settings]);

  const handleColorDoubleTap = useCallback((color: string) => {
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) return;
    
    // Double tap applies the color, saves immediately, and closes the picker
    applyCubeColor(color);
    if (settings) {
      const updatedSettings = { ...settings, cube_color: color };
      setSettings(updatedSettings);
      saveSettingsImmediately(updatedSettings);
    }
    setShowColorPicker(false);
  }, [settings, saveSettingsImmediately]);

  const handleCubeColor2Change = useCallback((color: string) => {
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) return;
    
    applyCubeColor2(color);
    if (settings) setSettings({ ...settings, cube_color2: color });
  }, [settings]);

  const handleCubeColor2DoubleTap = useCallback((color: string) => {
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) return;
    
    // Double tap applies the color, saves immediately, and closes the picker
    applyCubeColor2(color);
    if (settings) {
      const updatedSettings = { ...settings, cube_color2: color };
      setSettings(updatedSettings);
      saveSettingsImmediately(updatedSettings);
    }
    setShowCubeColor2Picker(false);
  }, [settings, saveSettingsImmediately]);

  return {
    settings,
    setSettings,
    settingsError,
    setSettingsError,
    savingSettings,
    settingsSaved,
    timezones,
    lang,
    showLangSelect,
    setShowLangSelect,
    showMaxParticipantsSelect,
    setShowMaxParticipantsSelect,
    showTimezoneSelect,
    setShowTimezoneSelect,
    showThemeSelect,
    setShowThemeSelect,
    showColorPicker,
    setShowColorPicker,
    showCubeColor2Picker,
    setShowCubeColor2Picker,
    handleSaveSettings,
    handleLangChange,
    handleThemeChange,
    handleCubeColorChange,
    handleColorDoubleTap,
    handleCubeColor2Change,
    handleCubeColor2DoubleTap,
  };
}
