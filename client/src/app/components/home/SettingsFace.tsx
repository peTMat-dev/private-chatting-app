"use client";

import { FormEvent, Dispatch, SetStateAction } from "react";
import { LANGUAGES, type LangCode, type Translations } from "../../../lib/i18n";
import { type UserSettings } from "../../../lib/formTypes";
import { type ColorTheme } from "../../../hooks/useSettingsFace";

type Props = {
  settings: UserSettings | null;
  setSettings: Dispatch<SetStateAction<UserSettings | null>>;
  settingsError: string | null;
  savingSettings: boolean;
  settingsSaved: boolean;
  handleSaveSettings: (event: FormEvent<HTMLFormElement>) => void;
  timezones: Array<{ timezone_name: string; display_name: string }>;
  lang: LangCode;
  showLangSelect: boolean;
  setShowLangSelect: Dispatch<SetStateAction<boolean>>;
  handleLangChange: (code: LangCode) => void;
  showMaxParticipantsSelect: boolean;
  setShowMaxParticipantsSelect: Dispatch<SetStateAction<boolean>>;
  showTimezoneSelect: boolean;
  setShowTimezoneSelect: Dispatch<SetStateAction<boolean>>;
  showThemeSelect: boolean;
  setShowThemeSelect: Dispatch<SetStateAction<boolean>>;
  handleThemeChange: (theme: ColorTheme) => void;
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  tr: Translations;
};

export default function SettingsFace({
  settings, setSettings, settingsError, savingSettings, settingsSaved, handleSaveSettings,
  timezones, lang, showLangSelect, setShowLangSelect, handleLangChange,
  showMaxParticipantsSelect, setShowMaxParticipantsSelect,
  showTimezoneSelect, setShowTimezoneSelect,
  showThemeSelect, setShowThemeSelect, handleThemeChange,
  handleHeaderTripleTap, handleFooterTripleTap, tr,
}: Props) {
  return (
          <section className="cube-face cube-face-back">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                  <h2>{tr.userSettings}</h2>
                </div>
                
                {settingsError && !settings ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true" />
                    <h3>{tr.couldNotLoadSettings}</h3>
                    <p>{settingsError}</p>
                  </div>
                ) : !settings ? (
                  <div className="empty-state">
                    <p>{tr.loadingSettings}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="d-flex flex-column" style={{ gap: "1rem" }}>
                    {settingsSaved && (
                      <div className="auth-alert" style={{ background: "rgba(3, 160, 98, 0.12)", border: "1px solid rgba(3, 160, 98, 0.4)" }}>
                        <strong>{tr.settingsSaved}</strong> {tr.settingsSavedMsg}
                      </div>
                    )}
                    
                    {settingsError && (
                      <div className="auth-alert">
                        <strong>Error:</strong> {settingsError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="user-language" className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        {tr.language}
                      </label>
                      <button
                        id="user-language"
                        type="button"
                        className="auth-input"
                        onClick={() => setShowLangSelect(!showLangSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {LANGUAGES.find((l) => l.code === lang)?.label}
                      </button>
                      {showLangSelect && (
                        <div
                          className="auth-input"
                          style={{
                            maxWidth: "180px",
                            marginTop: "0.5rem",
                            maxHeight: "220px",
                            overflowY: "auto",
                            padding: "0",
                          }}
                        >
                          {LANGUAGES.map((l) => (
                            <div
                              key={l.code}
                              onClick={() => handleLangChange(l.code)}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: lang === l.code ? "rgba(3, 160, 98, 0.15)" : "transparent",
                                color: lang === l.code ? "#00FFFF" : "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)"; }}
                              onMouseLeave={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              {l.label}{lang === l.code ? " ✓" : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        {tr.maxChatParticipants} <small style={{ color: "var(--color-form-text)", opacity: 0.7, fontSize: "0.75rem", fontWeight: "normal" }}>(2-100)</small>
                      </label>
                      <button
                        type="button"
                        className="auth-input"
                        onClick={() => setShowMaxParticipantsSelect(!showMaxParticipantsSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {settings.default_max_chat_participants}
                      </button>
                      
                      {showMaxParticipantsSelect && (
                        <div
                          className="auth-input"
                          style={{ 
                            maxWidth: "180px", 
                            marginTop: "0.5rem",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0"
                          }}
                        >
                          {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
                            <div
                              key={num}
                              onClick={() => {
                                setSettings({ ...settings, default_max_chat_participants: num });
                                setShowMaxParticipantsSelect(false);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: settings.default_max_chat_participants === num 
                                  ? "rgba(3, 160, 98, 0.15)" 
                                  : "transparent",
                                color: "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                if (settings.default_max_chat_participants !== num) {
                                  e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (settings.default_max_chat_participants !== num) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="auth-label" style={{ marginBottom: "0.25rem", display: "block" }}>
                        {tr.timezone}
                      </label>
                      <button
                        type="button"
                        className="auth-input"
                        onClick={() => setShowTimezoneSelect(!showTimezoneSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {timezones.find(tz => tz.timezone_name === settings.user_timezone)?.display_name || settings.user_timezone}
                      </button>
                      
                      {showTimezoneSelect && (
                        <div
                          className="auth-input"
                          style={{ 
                            maxWidth: "180px", 
                            marginTop: "0.5rem",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0"
                          }}
                        >
                          {timezones.map((tz) => (
                            <div
                              key={tz.timezone_name}
                              onClick={() => {
                                setSettings({ ...settings, user_timezone: tz.timezone_name });
                                setShowTimezoneSelect(false);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: settings.user_timezone === tz.timezone_name 
                                  ? "rgba(3, 160, 98, 0.15)" 
                                  : "transparent",
                                color: "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s",
                                fontSize: "0.85rem"
                              }}
                              onMouseEnter={(e) => {
                                if (settings.user_timezone !== tz.timezone_name) {
                                  e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (settings.user_timezone !== tz.timezone_name) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              {tz.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="auth-label" style={{ marginBottom: "0.25rem", display: "block" }}>
                        {tr.colorTheme}
                      </label>
                      <button
                        type="button"
                        className="auth-input"
                        onClick={() => setShowThemeSelect(!showThemeSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {settings.system_color_theme === 'light' ? tr.lightTheme : tr.darkTheme}
                      </button>
                      
                      {showThemeSelect && (
                        <div
                          className="auth-input"
                          style={{ 
                            maxWidth: "180px", 
                            marginTop: "0.5rem",
                            padding: "0"
                          }}
                        >
                          <div
                            onClick={() => handleThemeChange('dark')}
                            style={{
                              padding: "0.5rem 0.75rem",
                              cursor: "pointer",
                              backgroundColor: settings.system_color_theme === 'dark' 
                                ? "rgba(3, 160, 98, 0.15)" 
                                : "transparent",
                              color: "var(--color-green)",
                              borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              if (settings.system_color_theme !== 'dark') {
                                e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (settings.system_color_theme !== 'dark') {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            {tr.darkTheme}{settings.system_color_theme === 'dark' ? " ✓" : ""}
                          </div>
                          <div
                            onClick={() => handleThemeChange('light')}
                            style={{
                              padding: "0.5rem 0.75rem",
                              cursor: "pointer",
                              backgroundColor: settings.system_color_theme === 'light' 
                                ? "rgba(3, 160, 98, 0.15)" 
                                : "transparent",
                              color: "var(--color-green)",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              if (settings.system_color_theme !== 'light') {
                                e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (settings.system_color_theme !== 'light') {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            {tr.lightTheme}{settings.system_color_theme === 'light' ? " ✓" : ""}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        id="profile-public"
                        type="checkbox"
                        checked={settings.public_st}
                        onChange={(e) => setSettings({ ...settings, public_st: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer", margin: 0 }}
                      />
                      <label htmlFor="profile-public" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                        {tr.makeProfilePublic}
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        id="allow-contact-requests"
                        type="checkbox"
                        checked={settings.can_be_added_to_contacts}
                        onChange={(e) => setSettings({ ...settings, can_be_added_to_contacts: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer", margin: 0 }}
                      />
                      <label htmlFor="allow-contact-requests" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                        {tr.allowContactRequests}
                      </label>
                    </div>

                    <button type="submit" className="auth-btn" disabled={savingSettings} style={{ marginTop: "0.25rem" }}>
                    {savingSettings ? tr.saving : tr.saveSettings}
                    </button>
                  </form>
                )}
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </div>
            </article>
          </section>
  );
}