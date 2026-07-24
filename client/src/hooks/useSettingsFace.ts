import { useCallback, useEffect, useState, Dispatch, SetStateAction, FormEvent } from "react";
import { getApi, fetchApiCustom } from "../services/api.service";
import { getLang, setLang, type LangCode } from "../lib/i18n";
import type { UserSettings, ApiSettingsResponse, ApiTimezonesResponse } from "../lib/formTypes";

// Theme type
export type ColorTheme = 'light' | 'dark';

// Default cube color
export const DEFAULT_CUBE_COLOR = '#06ec90';

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
  handleSaveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleLangChange: (code: LangCode) => void;
  handleThemeChange: (theme: ColorTheme) => void;
  handleCubeColorChange: (color: string) => void;
  handleColorDoubleTap: (color: string) => void;
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

  // Initialize lang, theme, and cube color from storage
  useEffect(() => {
    setLangState(getLang());
    // Apply stored theme on mount
    applyTheme(getStoredTheme());
    // Apply stored cube color on mount
    applyCubeColor(getStoredCubeColor());
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
    
    applyCubeColor(color);
    if (settings) setSettings({ ...settings, cube_color: color });
    setShowColorPicker(false);
  }, [settings]);

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
    handleSaveSettings,
    handleLangChange,
    handleThemeChange,
    handleCubeColorChange,
    handleColorDoubleTap,
  };
}
