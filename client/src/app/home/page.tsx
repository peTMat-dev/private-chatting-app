"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Contact from "../components/Contact";

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
};

type ApiChatsResponse = {
  success: boolean;
  count?: number;
  data?: Array<{ id: number; name: string; lastMessage: string }>;
  error?: string;
};

type UserSettings = {
  user_language: string;
  default_max_chat_participants: number;
  public: boolean;
  user_timezone: string;
};

type ApiSettingsResponse = {
  success: boolean;
  data?: UserSettings;
  error?: string;
};

type ApiTimezonesResponse = {
  success: boolean;
  data?: Array<{ timezone_name: string; display_name: string }>;
  error?: string;
};

// Cube faces: front=Chats, left=Contacts, right=Chat view (placeholder), back=Settings
type CubeFace = "front" | "left" | "right" | "back";

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const resolveApiBaseUrl = (): string => {
  if (ENV_API_BASE) return ENV_API_BASE.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  return "";
};
const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

export default function HomeCube() {
  const [activeFace, setActiveFace] = useState<CubeFace>("front");
  const [yTicks, setYTicks] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [timezones, setTimezones] = useState<Array<{ timezone_name: string; display_name: string }>>([]);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const username = useMemo(() => {
    try {
      return localStorage.getItem("cubcha_username") || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let aborted = false;
    const fetchChats = async () => {
      if (!username) {
        return;
      }
      try {
        const url = buildApiUrl(`/chats?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiChatsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setError(data.error || "Unable to load chats");
          return;
        }
        const list: ContactSummary[] = (data.data || []).map((d) => ({
          id: d.id,
          name: d.name,
          lastMessage: d.lastMessage || "",
        }));
        if (!aborted) setContacts(list);
      } catch (err) {
        if (!aborted) setError((err as Error).message);
      }
    };
    fetchChats();
    return () => {
      aborted = true;
    };
  }, [username]);

  // Fetch user settings and timezones when navigating to settings face
  useEffect(() => {
    if (activeFace !== "back" || !username) return;
    
    let aborted = false;
    
    const fetchSettings = async () => {
      try {
        const url = buildApiUrl(`/settings?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiSettingsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setSettingsError(data.error || "Unable to load settings");
          return;
        }
        if (!aborted && data.data) setSettings(data.data);
      } catch (err) {
        if (!aborted) setSettingsError((err as Error).message);
      }
    };

    const fetchTimezones = async () => {
      try {
        const url = buildApiUrl("/settings/timezones");
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiTimezonesResponse;
        if (res.ok && data.success && data.data) {
          if (!aborted) setTimezones(data.data);
        }
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

  const facesByTicks: CubeFace[] = ["front", "left", "back", "right"];
  const rotation = useMemo(() => {
    const baseX = -5;
    const baseY = -15;
    const x = baseX;
    const y = baseY + yTicks * 90;
    return { x, y };
  }, [yTicks]);

  const goLeft = () => {
    setYTicks((t) => {
      const next = t + 1;
      setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
      return next;
    });
  };
  const goRight = () => {
    setYTicks((t) => {
      const next = t - 1;
      setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 40;
    if (absDx < threshold && absDy < threshold) return;
    if (absDx > absDy) {
      if (dx < 0) goLeft(); else goRight();
    }
    touchStartRef.current = null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goLeft();
        break;
      case "ArrowRight":
        event.preventDefault();
        goRight();
        break;
      default:
        break;
    }
  };

  const openChat = (_id: number | string) => {
    // Rotation-only for now: move to the right face
    setActiveFace("right");
    setYTicks((t) => t - 1);
  };

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || !username) return;

    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);

    try {
      const url = buildApiUrl("/settings");
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          ...settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSettingsError(data.error || "Failed to save settings");
        return;
      }

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setSettingsError((err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div
      className="mobile-auth-screen fade-in"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="auth-cube-stage">
        <div
          className="auth-cube"
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          {/* Front: Chats list */}
          <section className="cube-face cube-face-front">
            <section className="auth-stack">
              <article className="auth-card cube-face-panel">
                <div className="cube-face-content">
                  <div className="cube-face-header">
                    <h2>List of chats</h2>
                    <button className="ghost-btn" type="button" onClick={goLeft}>Contacts</button>
                  </div>
                  {error ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>Could not load chats</h2>
                      <p>{error}</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>No active chats yet</h2>
                      <p>When users message you, they’ll appear here.</p>
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush chats-list">
                      {contacts.map((c) => (
                        <Contact key={c.id} contact_name={c.name} onClick={() => openChat(c.id)}>
                          {c.lastMessage}
                        </Contact>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </section>
          </section>

          {/* Left: Contacts placeholder */}
          <section className="cube-face cube-face-left">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Contacts</h2>
                  <button className="ghost-btn" type="button" onClick={goRight}>Back to Chats</button>
                </div>
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true" />
                  <h2>Contacts coming soon</h2>
                  <p>This page will list your saved contacts.</p>
                </div>
              </div>
            </article>
          </section>

          {/* Back: User Settings */}
          <section className="cube-face cube-face-back">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>User Settings</h2>
                  <button className="ghost-btn" type="button" onClick={goRight}>Back to Chats</button>
                </div>
                
                {settingsError && !settings ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true" />
                    <h3>Could not load settings</h3>
                    <p>{settingsError}</p>
                  </div>
                ) : !settings ? (
                  <div className="empty-state">
                    <p>Loading settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="d-flex flex-column" style={{ gap: "1rem" }}>
                    {settingsSaved && (
                      <div className="auth-alert" style={{ background: "rgba(3, 160, 98, 0.12)", border: "1px solid rgba(3, 160, 98, 0.4)" }}>
                        <strong>Success!</strong> Settings saved successfully.
                      </div>
                    )}
                    
                    {settingsError && (
                      <div className="auth-alert">
                        <strong>Error:</strong> {settingsError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="user-language" className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        Language <small style={{ color: "var(--color-form-text)", opacity: 0.7, fontSize: "0.75rem", fontWeight: "normal" }}>(e.g., en, es, fr)</small>
                      </label>
                      <input
                        id="user-language"
                        type="text"
                        className="auth-input"
                        value={settings.user_language}
                        onChange={(e) => setSettings({ ...settings, user_language: e.target.value })}
                        placeholder="en"
                        maxLength={32}
                        style={{ maxWidth: "150px" }}
                      />
                    </div>

                    <div>
                      <label htmlFor="max-participants" className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        Max Chat Participants <small style={{ color: "var(--color-form-text)", opacity: 0.7, fontSize: "0.75rem", fontWeight: "normal" }}>(2-100)</small>
                      </label>
                      <select
                        id="max-participants"
                        className="auth-input"
                        value={settings.default_max_chat_participants}
                        onChange={(e) => setSettings({ ...settings, default_max_chat_participants: parseInt(e.target.value) })}
                        style={{ cursor: "pointer", maxWidth: "150px" }}
                      >
                        {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="user-timezone" className="auth-label" style={{ marginBottom: "0.25rem", display: "block" }}>
                        Timezone
                      </label>
                      <select
                        id="user-timezone"
                        className="auth-input"
                        value={settings.user_timezone}
                        onChange={(e) => setSettings({ ...settings, user_timezone: e.target.value })}
                        style={{ cursor: "pointer", maxWidth: "150px" }}
                      >
                        {timezones.map((tz) => (
                          <option key={tz.timezone_name} value={tz.timezone_name}>
                            {tz.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        id="profile-public"
                        type="checkbox"
                        checked={settings.public}
                        onChange={(e) => setSettings({ ...settings, public: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer", margin: 0 }}
                      />
                      <label htmlFor="profile-public" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                        Make profile public
                      </label>
                    </div>

                    <button type="submit" className="auth-btn" disabled={savingSettings} style={{ marginTop: "0.25rem" }}>
                      {savingSettings ? "Saving..." : "Save Settings"}
                    </button>
                  </form>
                )}
              </div>
            </article>
          </section>

          {/* Right: Chat view placeholder */}
          <section className="cube-face cube-face-right">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Chat</h2>
                  <button className="ghost-btn" type="button" onClick={goLeft}>Contacts</button>
                </div>
                <p className="hero-copy">Open a conversation from the Chats face.</p>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
