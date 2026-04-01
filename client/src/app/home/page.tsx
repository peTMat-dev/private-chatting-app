"use client";

import { useEffect, useMemo, useState } from "react";
import Contact from "../components/Contact";
import { buildApiUrl, postJson } from "../../lib/api";
import { LANGUAGES, getLang, setLang, t, type LangCode } from "../../lib/i18n";
import { useCubeNavigation, type CubeFace } from "../../lib/useCubeNavigation";

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
};

type ContactItem = {
  id: number;
  displayName: string;
  status_st: boolean;
  addedAt: string;
  isPublic: boolean;
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
  isAlreadyContact: boolean;
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

// Cube faces: front=Chats, left=Contacts, right=Chat view (placeholder), back=Settings, top=Logout
// CubeFace type imported from useCubeNavigation

export default function HomeCube() {
  const {
    activeFace,
    yTicks,
    setActiveFace,
    setYTicks,
    rotation,
    goLeft,
    goRight,
    goDown,
    goUp,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
  } = useCubeNavigation("front");
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
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">("asc");
  const [publicUserSearch, setPublicUserSearch] = useState("");
  const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
  const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [privateRequestSent, setPrivateRequestSent] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState("");
  const [showMaxParticipantsSelect, setShowMaxParticipantsSelect] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [lang, setLangState] = useState<LangCode>("en");
  const [showLangSelect, setShowLangSelect] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [removingContactId, setRemovingContactId] = useState<number | null>(null);
  const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
  const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);
  const [whoseContactAmI, setWhoseContactAmI] = useState<{ id: number; displayName: string }[]>([]);
  const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
  const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);

  useEffect(() => {
    setLangState(getLang());
  }, []);

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
    if (publicUsers.length === 0 && username) {
      fetchPublicUsers();
    }
  }, [username, publicUsers.length]);

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

  const fetchPublicUsers = async () => {
    if (!username) {
      setAlertDialog({ show: true, title: "Error", message: "Session expired. Please log in again." });
      return;
    }
    setLoadingPublicUsers(true);
    try {
      const url = buildApiUrl(`/contacts/public-users?username=${encodeURIComponent(username)}`);
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

  const handleRemoveContact = async (contactId: number) => {
    setRemovingContactId(contactId);
    try {
      const { ok, data } = await postJson("/contacts/remove", {
        username,
        contactUserId: contactId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to remove contact" });
        return;
      }
      setUserContacts((prev) => prev.filter((c) => c.id !== contactId));
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === contactId ? { ...u, isAlreadyContact: false } : u))
      );
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setRemovingContactId(null);
    }
  };

  const handleRemovePublicUser = async (userId: number) => {
    setRemovingPublicUserId(userId);
    try {
      const { ok, data } = await postJson("/contacts/remove", {
        username,
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to remove contact" });
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: false } : u))
      );
      fetchUserContacts();
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setRemovingPublicUserId(null);
    }
  };

  const handleAddPublicUser = async (userId: number, displayName: string) => {
    if (!userId || !displayName) return;
    setAddingPublicUserId(userId);
    try {
      const { ok, data } = await postJson("/contacts/add-public", {
        username,
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to add contact" });
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: true } : u))
      );
      fetchUserContacts();
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setAddingPublicUserId(null);
    }
  };

  const fetchWhoseContactAmI = async () => {
    if (!username) return;
    setLoadingWhoseContactAmI(true);
    try {
      const url = buildApiUrl(`/contacts/whose-contact-am-i?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as { success: boolean; data?: { id: number; displayName: string }[]; error?: string };
      if (!res.ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Unable to load" });
        return;
      }
      setWhoseContactAmI(data.data || []);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setLoadingWhoseContactAmI(false);
    }
  };

  const handleSendRequest = async () => {
    if (!requestDisplayName.trim()) return;
    try {
      await postJson("/contacts/request", {
        username,
        displayName: requestDisplayName.trim(),
      });
    } catch {
      // Intentionally ignored — always show same neutral message to protect privacy
    }
    setRequestDisplayName("");
    setPrivateRequestSent(true);
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
    const term = publicUserSearch.trim().toLowerCase();
    return term ? sorted.filter((u) => u.displayName.toLowerCase().includes(term)) : sorted;
  }, [publicUsers, sortOrder, publicUserSearch]);

  const sortedContacts = useMemo(() => {
    const sorted = [...userContacts];
    sorted.sort((a, b) => {
      if (contactSortOrder === "asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      return b.displayName.localeCompare(a.displayName);
    });
    const term = contactSearch.trim().toLowerCase();
    return term ? sorted.filter((c) => c.displayName.toLowerCase().includes(term)) : sorted;
  }, [userContacts, contactSortOrder, contactSearch]);

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

  const handleLangChange = (code: LangCode) => {
    setLang(code);
    setLangState(code);
    if (settings) setSettings({ ...settings, user_language: code });
    setShowLangSelect(false);
  };

  const handleLogout = () => {
    // Step 1: Move up from TOP face back to previous face
    goUp();
    // Step 2: After animation, rotate left and logout
    setTimeout(() => {
      goLeft();
      setTimeout(() => {
        // Clear session and redirect
        try {
          localStorage.removeItem("cubcha_username");
        } catch (e) {
          // Ignore storage errors
        }
        window.location.href = "/";
      }, 500); // Wait for rotation to complete
    }, 500); // Wait for up movement to complete
  };

  const tr = t(lang);

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
                    <h2>{tr.chats}</h2>
                  </div>
                  {error ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>{tr.couldNotLoadChats}</h2>
                      <p>{error}</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>{tr.noChatsYet}</h2>
                      <p>{tr.addContactsToStart}</p>
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
                  <h2>{tr.contacts}</h2>
                </div>
                
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowPublicUserSelect(!showPublicUserSelect);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowContactList(false);
                        setPublicUserSearch("");
                        if (!showPublicUserSelect && publicUsers.length === 0) {
                          fetchPublicUsers();
                        }
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.addPublicUser}
                    </button>
                    
                    {showPublicUserSelect && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                            onClick={() => setSortOrder("asc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            A-Z
                          </button>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                            onClick={() => setSortOrder("desc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            Z-A
                          </button>
                          <input
                            type="text"
                            value={publicUserSearch}
                            onChange={(e) => setPublicUserSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") setPublicUserSearch(""); }}
                            placeholder="🔍"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "0.75rem",
                              padding: "0.35rem 0.4rem",
                              background: "rgba(3,160,98,0.08)",
                              border: "1px solid rgba(3,160,98,0.3)",
                              borderRadius: "0.25rem",
                              color: "var(--color-green)",
                              outline: "none",
                            }}
                          />
                          {publicUserSearch && (
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => setPublicUserSearch("")}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div
                          className="auth-input"
                          style={{ 
                            cursor: "pointer", 
                            width: "100%",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0",
                            opacity: loadingPublicUsers ? 0.6 : 1
                          }}
                        >
                          {loadingPublicUsers ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : sortedPublicUsers.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.noPublicUsers}
                            </div>
                          ) : (
                            sortedPublicUsers.map((user) => {
                              const isBusy = removingPublicUserId === user.id || addingPublicUserId === user.id;
                              return (
                              <div
                                key={user.id}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  cursor: "default",
                                  backgroundColor: "transparent",
                                  color: user.isAlreadyContact ? "#00FFFF" : "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {user.displayName}
                                </span>
                                <button
                                  className={`contact-action-btn ${user.isAlreadyContact ? "contact-action-btn--remove" : "contact-action-btn--add"}`}
                                  onClick={() => {
                                    if (isBusy || loadingPublicUsers) return;
                                    if (user.isAlreadyContact) {
                                      handleRemovePublicUser(user.id);
                                    } else {
                                      handleAddPublicUser(user.id, user.displayName);
                                    }
                                  }}
                                  disabled={isBusy || loadingPublicUsers}
                                  title={user.isAlreadyContact ? "Remove contact" : "Add contact"}
                                >
                                  {isBusy ? "…" : user.isAlreadyContact ? "✕" : "✓"}
                                </button>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowRequestInput(!showRequestInput);
                        setPrivateRequestSent(false);
                        setShowPublicUserSelect(false);
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.requestByName}
                    </button>
                    
                    {showRequestInput && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {privateRequestSent ? (
                          <p style={{ fontSize: "0.75rem", color: "var(--color-green)", margin: "0", textAlign: "center", padding: "0.5rem 0", opacity: 0.75 }}>
                            {tr.privateRequestSent}
                          </p>
                        ) : (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="text"
                              value={requestDisplayName}
                              onChange={(e) => setRequestDisplayName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && requestDisplayName.trim()) handleSendRequest(); }}
                              placeholder={tr.enterDisplayName}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: "0.75rem",
                                padding: "0.35rem 0.4rem",
                                background: "rgba(3,160,98,0.08)",
                                border: "1px solid rgba(3,160,98,0.3)",
                                borderRadius: "0.25rem",
                                color: "var(--color-green)",
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => handleSendRequest()}
                              disabled={!requestDisplayName.trim()}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowContactList(!showContactList);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setContactSearch("");
                      }}
                      style={{ width: "100%" }}
                    >
                      ☰ {tr.contactList}
                    </button>
                    {showContactList && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {contactsError ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(255,80,80,0.8)", fontSize: "0.8rem" }}>
                            {tr.couldNotLoadContacts}
                          </div>
                        ) : userContacts.length === 0 ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsYet}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "asc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("asc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                A-Z
                              </button>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "desc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("desc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                Z-A
                              </button>
                              <input
                                type="text"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setContactSearch(""); }}
                                placeholder="🔍"
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: "0.75rem",
                                  padding: "0.35rem 0.4rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)",
                                  outline: "none",
                                }}
                              />
                              {contactSearch && (
                                <button
                                  type="button"
                                  className="sort-btn"
                                  onClick={() => setContactSearch("")}
                                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div
                              className="auth-input"
                              style={{ padding: 0, maxHeight: "180px", overflowY: "auto" }}
                            >
                              {sortedContacts.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0.45rem 0.75rem",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  gap: "0.4rem",
                                }}
                              >
                                <span style={{ color: "var(--color-green)", fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {c.displayName}{!c.isPublic && <span style={{ marginLeft: "0.3rem", fontSize: "0.75rem" }}>🔒</span>}
                                </span>
                                <button
                                  className="contact-action-btn contact-action-btn--chat"
                                  disabled
                                  title={tr.chatSoon}
                                >
                                  💬
                                </button>
                                <button
                                  className="contact-action-btn contact-action-btn--remove"
                                  onClick={() => handleRemoveContact(c.id)}
                                  disabled={removingContactId === c.id}
                                >
                                  {removingContactId === c.id ? "…" : "✕"}
                                </button>
                              </div>
                            ))}
                          </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showWhoseContactAmI;
                        setShowWhoseContactAmI(next);
                        setShowContactList(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        if (next) fetchWhoseContactAmI();
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.whoseContactAmI}
                    </button>
                    {showWhoseContactAmI && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div
                          className="auth-input"
                          style={{ padding: 0, maxHeight: "180px", overflowY: "auto", opacity: loadingWhoseContactAmI ? 0.6 : 1 }}
                        >
                          {loadingWhoseContactAmI ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : whoseContactAmI.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "rgba(3,160,98,0.5)", textAlign: "center", fontSize: "0.8rem" }}>
                              —
                            </div>
                          ) : (
                            whoseContactAmI.map((user) => (
                              <div
                                key={user.id}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  color: "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {user.displayName}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </section>

          {/* Back: User Settings */}
          <section className="cube-face cube-face-back">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
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

                    <button type="submit" className="auth-btn" disabled={savingSettings} style={{ marginTop: "0.25rem" }}>
                    {savingSettings ? tr.saving : tr.saveSettings}
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
                  <h2>{tr.chat}</h2>
                </div>
                <p className="hero-copy">{tr.openConversation}</p>
              </div>
            </article>
          </section>

          {/* Top: Logout */}
          <section className="cube-face cube-face-top">
            <article className="auth-card cube-face-panel">
              <h2>{tr.logout}</h2>
              <p className="hero-copy">
                {tr.logoutPrompt}
              </p>
              <button
                className="auth-btn"
                type="button"
                onClick={handleLogout}
              >
                {tr.logOut}
              </button>
              <button
                className="ghost-btn mt-3"
                type="button"
                onClick={goUp}
              >
                {tr.cancel}
              </button>
            </article>
          </section>
        </div>

        {/* Custom Confirm Dialog - Inside cube context */}
        {confirmDialog?.show && (
          <div 
            className="auth-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: "fixed",
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
                  {tr.cancel}
                </button>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={confirmDialog.onConfirm}
                  style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                >
                  {tr.confirmAction}
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
              position: "fixed",
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
                {tr.ok}
              </button>
            </div>
        )}
      </div>
    </div>

  );
}
