import { useCallback, useEffect, useState, Dispatch, SetStateAction, FormEvent } from "react";
import { getApi, fetchApiCustom } from "../services/api.service";
import { getLang, setLang, type LangCode } from "../lib/i18n";
import type { UserSettings, ApiSettingsResponse, ApiTimezonesResponse } from "../lib/formTypes";

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
  handleSaveSettings: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleLangChange: (code: LangCode) => void;
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

  // Initialize lang from storage
  useEffect(() => {
    setLangState(getLang());
  }, []);

  // Fetch settings and timezones when navigating to settings face
  useEffect(() => {
    if (activeFace !== "back" || !username) return;

    let aborted = false;

    const fetchSettings = async () => {
      try {
        const data = await getApi<ApiSettingsResponse>("/settings");
        if (!aborted && data.data) setSettings(data.data);
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
    handleSaveSettings,
    handleLangChange,
  };
}