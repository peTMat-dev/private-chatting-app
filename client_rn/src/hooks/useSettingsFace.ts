import { useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { getApi, fetchApiCustom } from '../services/api.service';
import { type LangCode } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import type { UserSettings, ApiSettingsResponse, ApiTimezonesResponse } from '../lib/formTypes';
import { useTheme, type ThemeName, isValidHexColor, DEFAULT_CUBE_COLOR } from '../theme';

export type ColorTheme = ThemeName;
export { DEFAULT_CUBE_COLOR };
export const PRESET_COLORS = [
  { name: 'Green', hex: '#06ec90' }, { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Blue', hex: '#3B82F6' }, { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' }, { name: 'Orange', hex: '#F97316' },
  { name: 'Red', hex: '#EF4444' }, { name: 'Yellow', hex: '#EAB308' },
];

interface UseSettingsFaceOptions {
  username: string; activeFace: string;
  showAlert: (message: string, title?: string) => void;
}
interface UseSettingsFaceReturn {
  settings: UserSettings | null;
  setSettings: Dispatch<SetStateAction<UserSettings | null>>;
  settingsError: string | null;
  setSettingsError: Dispatch<SetStateAction<string | null>>;
  savingSettings: boolean; settingsSaved: boolean;
  timezones: Array<{ timezone_name: string; display_name: string }>;
  lang: LangCode;
  showLangSelect: boolean; setShowLangSelect: Dispatch<SetStateAction<boolean>>;
  showMaxParticipantsSelect: boolean; setShowMaxParticipantsSelect: Dispatch<SetStateAction<boolean>>;
  showTimezoneSelect: boolean; setShowTimezoneSelect: Dispatch<SetStateAction<boolean>>;
  showThemeSelect: boolean; setShowThemeSelect: Dispatch<SetStateAction<boolean>>;
  showColorPicker: boolean; setShowColorPicker: Dispatch<SetStateAction<boolean>>;
  handleSaveSettings: () => Promise<void>;
  handleLangChange: (code: LangCode) => void;
  handleThemeChange: (theme: ColorTheme) => void;
  handleCubeColorChange: (color: string) => void;
  handleColorDoubleTap: (color: string) => void;
}

export function useSettingsFace({ username, activeFace, showAlert }: UseSettingsFaceOptions): UseSettingsFaceReturn {
  const { setTheme: setThemeCtx, themeName, setAccentColor } = useTheme();
  const { setLang: setLangCtx } = useLanguage();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [timezones, setTimezones] = useState<Array<{ timezone_name: string; display_name: string }>>([]);
  const [lang, setLangState] = useState<LangCode>('en');
  const [showLangSelect, setShowLangSelect] = useState(false);
  const [showMaxParticipantsSelect, setShowMaxParticipantsSelect] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [showThemeSelect, setShowThemeSelect] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (activeFace !== 'back' || !username) return;
    let aborted = false;
    (async () => {
      try {
        const data = await getApi<ApiSettingsResponse>('/settings');
        if (!aborted && data.data) {
          setSettings(data.data);
          if (data.data.system_color_theme && data.data.system_color_theme !== themeName)
            setThemeCtx(data.data.system_color_theme);
          if (data.data.user_language) setLangState(data.data.user_language as LangCode);
          // Apply cube accent color from server settings
          if (data.data.cube_color && isValidHexColor(data.data.cube_color)) {
            setAccentColor(data.data.cube_color);
          }
        }
      } catch (err) { if (!aborted) setSettingsError((err as Error).message); }
    })();
    (async () => {
      try {
        const data = await getApi<ApiTimezonesResponse>('/settings/timezones');
        if (!aborted && data.data) setTimezones(data.data);
      } catch (err) { console.error('Failed to fetch timezones:', err); }
    })();
    return () => { aborted = true; };
  }, [activeFace, username, setAccentColor]);

  const handleSaveSettings = useCallback(async () => {
    if (!settings || !username) return;
    setSavingSettings(true); setSettingsError(null); setSettingsSaved(false);
    try {
      await fetchApiCustom<ApiSettingsResponse>('/settings', { method: 'PUT', body: JSON.stringify({ ...settings }) });
      setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) { setSettingsError((err as Error).message); }
    finally { setSavingSettings(false); }
  }, [settings, username]);

  const handleLangChange = useCallback((code: LangCode) => {
    setLangCtx(code); setLangState(code);
    if (settings) setSettings({ ...settings, user_language: code });
    setShowLangSelect(false);
  }, [settings, setLangCtx]);

  const handleThemeChange = useCallback((theme: ColorTheme) => {
    setThemeCtx(theme);
    if (settings) setSettings({ ...settings, system_color_theme: theme });
    setShowThemeSelect(false);
  }, [settings, setThemeCtx]);

  const handleCubeColorChange = useCallback((color: string) => {
    if (!isValidHexColor(color)) return;
    // Apply immediately (and persist locally), like the web client's applyCubeColor()
    setAccentColor(color);
    if (settings) setSettings({ ...settings, cube_color: color });
  }, [settings, setAccentColor]);

  const handleColorDoubleTap = useCallback((_c: string) => { setShowColorPicker(false); }, []);

  return {
    settings, setSettings, settingsError, setSettingsError, savingSettings, settingsSaved,
    timezones, lang, showLangSelect, setShowLangSelect,
    showMaxParticipantsSelect, setShowMaxParticipantsSelect,
    showTimezoneSelect, setShowTimezoneSelect,
    showThemeSelect, setShowThemeSelect,
    showColorPicker, setShowColorPicker,
    handleSaveSettings, handleLangChange, handleThemeChange, handleCubeColorChange, handleColorDoubleTap,
  };
}
