"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Contact from "../components/Contact";

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
};

type ContactItem = {
  id: number;
  displayName: string;
  status: boolean;
  addedAt: string;
};

type ApiChatsResponse = {
  success: boolean;
  count?: number;
  data?: Array<{ id: number; name: string; lastMessage: string }>;
  error?: string;
};

type ApiContactsResponse = {
  success: boolean;
  count?: number;
  data?: ContactItem[];
  error?: string;
};

type PublicUser = {
  id: number;
  displayName: string;
};

type ApiPublicUsersResponse = {
  success: boolean;
  count?: number;
  data?: PublicUser[];
  error?: string;
  message?: string;
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

const postJson = async (
  path: string,
  payload: unknown
): Promise<{ ok: boolean; data: any }> => {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data };
};

export default function HomeCube() {
  const [activeFace, setActiveFace] = useState<CubeFace>("front");
  const [yTicks, setYTicks] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userContacts, setUserContacts] = useState<ContactItem[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [timezones, setTimezones] = useState<Array<{ timezone_name: string; display_name: string }>>([]);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
  const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; message: string; onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; message: string; title?: string } | null>(null);
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

  useEffect(() => {
    let aborted = false;
    const fetchContacts = async () => {
      if (!username) {
        return;
      }
      try {
        const url = buildApiUrl(`/contacts?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiContactsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setContactsError(data.error || "Unable to load contacts");
          return;
        }
        if (!aborted) setUserContacts(data.data || []);
      } catch (err) {
        if (!aborted) setContactsError((err as Error).message);
      }
    };
    fetchContacts();
    return () => {
      aborted = true;
    };
  }, [username]);

  useEffect(() => {
    if (publicUsers.length === 0) {
      fetchPublicUsers();
    }
  }, []);

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

  const fetchPublicUsers = async () => {
    setLoadingPublicUsers(true);
    try {
      const url = buildApiUrl("/contacts/public-users");
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiPublicUsersResponse;
      if (!res.ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Unable to load public users" });
        return;
      }
      setPublicUsers((data.data as PublicUser[]) || []);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setLoadingPublicUsers(false);
    }
  };

  const handleAddPublicUser = async (userId: number, displayName: string) => {
    if (!userId || !displayName) return;
    
    setConfirmDialog({
      show: true,
      message: `Add ${displayName} to your contacts?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const { ok, data } = await postJson("/contacts/add-public", {
            username,
            contactUserId: userId,
          });
          if (!ok || !data.success) {
            setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to add contact" });
            return;
          }
          setAlertDialog({ show: true, title: "Success", message: data.message || "Contact added successfully!" });
          fetchUserContacts();
        } catch (err) {
          setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
        }
      }
    });
  };

  const handleSendRequest = async () => {
    if (!requestDisplayName.trim()) {
      setAlertDialog({ show: true, title: "Error", message: "Please enter a display name" });
      return;
    }

    try {
      const { ok, data } = await postJson("/contacts/request", {
        username,
        displayName: requestDisplayName.trim(),
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to send request" });
        return;
      }
      setAlertDialog({ show: true, title: "Success", message: data.message || "Request sent successfully!" });
      setShowRequestInput(false);
      setRequestDisplayName("");
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    }
  };

  const fetchUserContacts = async () => {
    if (!username) return;
    try {
      const url = buildApiUrl(`/contacts?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiContactsResponse;
      if (!res.ok || !data.success) {
        setContactsError(data.error || "Unable to load contacts");
        return;
      }
      setUserContacts(data.data || []);
      setContactsError(null);
    } catch (err) {
      setContactsError((err as Error).message);
    }
  };

  const sortedPublicUsers = useMemo(() => {
    const sorted = [...publicUsers];
    sorted.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      return b.displayName.localeCompare(a.displayName);
    });
    return sorted;
  }, [publicUsers, sortOrder]);

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

          {/* Left: Contacts */}
          <section className="cube-face cube-face-left">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Contacts</h2>
                  <button className="ghost-btn" type="button" onClick={goRight}>Back to Chats</button>
                </div>
                
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowPublicUserSelect(!showPublicUserSelect);
                        setShowRequestInput(false);
                        if (!showPublicUserSelect && publicUsers.length === 0) {
                          fetchPublicUsers();
                        }
                      }}
                      style={{ width: "100%" }}
                    >
                      <span className="add-icon">+</span> Add Public User
                    </button>
                    
                    {showPublicUserSelect && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                            onClick={() => setSortOrder("asc")}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          >
                            A-Z
                          </button>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                            onClick={() => setSortOrder("desc")}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          >
                            Z-A
                          </button>
                        </div>
                        <select
                          className="auth-input"
                          size={6}
                          style={{ cursor: "pointer", width: "100%" }}
                          onChange={(e) => {
                            const userId = parseInt(e.target.value);
                            const user = sortedPublicUsers.find(u => u.id === userId);
                            if (user) {
                              handleAddPublicUser(user.id, user.displayName);
                              setShowPublicUserSelect(false);
                            }
                          }}
                          disabled={loadingPublicUsers}
                        >
                          {loadingPublicUsers ? (
                            <option>Loading users...</option>
                          ) : sortedPublicUsers.length === 0 ? (
                            <option>No public users available</option>
                          ) : (
                            sortedPublicUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.displayName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowRequestInput(!showRequestInput);
                        setShowPublicUserSelect(false);
                      }}
                      style={{ width: "100%" }}
                    >
                      <span className="add-icon">+</span> Request by Name
                    </button>
                    
                    {showRequestInput && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <input
                          type="text"
                          className="auth-input"
                          placeholder="Enter display name"
                          value={requestDisplayName}
                          onChange={(e) => setRequestDisplayName(e.target.value)}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <button
                          className="auth-btn"
                          onClick={() => {
                            handleSendRequest();
                            setShowRequestInput(false);
                          }}
                          disabled={!requestDisplayName.trim()}
                          style={{ width: "100%" }}
                        >
                          Send Request
                        </button>
                        <p style={{ fontSize: "0.7rem", color: "rgba(3, 160, 98, 0.5)", margin: "0.5rem 0 0 0", textAlign: "center" }}>
                          Note: Backend not yet implemented
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {contactsError ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true" />
                    <h2>Could not load contacts</h2>
                    <p>{contactsError}</p>
                  </div>
                ) : userContacts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true" />
                    <h2>No contacts yet</h2>
                    <p>Use the buttons above to add contacts.</p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush chats-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {userContacts.map((c) => (
                      <li key={c.id} className="list-group-item contact-item">
                        <div className="contact-header">{c.displayName}</div>
                        <div className="contact-meta">
                          Added: {new Date(c.addedAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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

        {/* Custom Confirm Dialog - Inside cube context */}
        {confirmDialog?.show && (
          <div 
            className="auth-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 3rem)",
              maxWidth: "280px", 
              padding: "1.25rem",
              zIndex: 100,
              boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)"
            }}
            >
              <p style={{ color: "var(--color-green)", fontSize: "0.9rem", margin: "0 0 1rem 0", textAlign: "center" }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setConfirmDialog(null)}
                  style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={confirmDialog.onConfirm}
                  style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                >
                  Confirm
                </button>
              </div>
            </div>
        )}

        {/* Custom Alert Dialog - Inside cube context */}
        {alertDialog?.show && (
          <div 
            className="auth-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 3rem)",
              maxWidth: "280px", 
              padding: "1.25rem",
              zIndex: 100,
              boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)"
            }}
            >
              {alertDialog.title && (
                <h3 style={{ color: "var(--color-green)", fontSize: "1rem", margin: "0 0 0.75rem 0", fontWeight: 600, textAlign: "center" }}>
                  {alertDialog.title}
                </h3>
              )}
              <p style={{ color: "rgba(3, 160, 98, 0.8)", fontSize: "0.85rem", margin: "0 0 1rem 0", textAlign: "center" }}>
                {alertDialog.message}
              </p>
              <button
                type="button"
                className="auth-btn"
                onClick={() => setAlertDialog(null)}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
              >
                OK
              </button>
            </div>
        )}
      </div>
    </div>

  );
}
