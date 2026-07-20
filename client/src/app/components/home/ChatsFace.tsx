"use client";

import { Dispatch, SetStateAction } from "react";
import Contact from "./Contact";
import { type Translations } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";
import { type ContactSummary, type ContactItem } from "../../../lib/formTypes";

type Props = {
  contacts: ContactSummary[];
  error: string | null;
  showNewChat: boolean;
  setShowNewChat: Dispatch<SetStateAction<boolean>>;
  newChatSelectedIds: number[];
  setNewChatSelectedIds: Dispatch<SetStateAction<number[]>>;
  newChatTitle: string;
  setNewChatTitle: Dispatch<SetStateAction<string>>;
  creatingChat: boolean;
  newChatError: string | null;
  setNewChatError: Dispatch<SetStateAction<string | null>>;
  handleOpenChat: (id: number, name: string, isGroup: boolean) => void;
  handleCreateChat: () => void;
  userContacts: ContactItem[];
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  setFace: (face: CubeFace) => void;
  tr: Translations;
};

export default function ChatsFace({
  contacts, error, showNewChat, setShowNewChat, newChatSelectedIds, setNewChatSelectedIds,
  newChatTitle, setNewChatTitle, creatingChat, newChatError, setNewChatError,
  handleOpenChat, handleCreateChat, userContacts,
  handleHeaderTripleTap, handleFooterTripleTap, setFace, tr,
}: Props) {
  return (
          <section className="cube-face cube-face-front">
            <section className="auth-stack">
              <article className="auth-card cube-face-panel">
                <div className="cube-face-content">
                  <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                    <h2>{tr.chats}</h2>
                  </div>

                  {/* New Chat accordion */}
                  <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowNewChat(!showNewChat);
                        setNewChatSelectedIds([]);
                        setNewChatTitle("");
                        setNewChatError(null);
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.newChat}
                    </button>
                    {showNewChat && (
                      <div style={{ marginTop: "0.65rem" }}>
                        {userContacts.length === 0 ? (
                          <div style={{ padding: "0.5rem 0", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsYet}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", paddingBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {tr.selectContacts}
                            </div>
                            <div className="auth-input" style={{ padding: 0, maxHeight: "150px", overflowY: "auto" }}>
                              {userContacts.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => setNewChatSelectedIds((prev) =>
                                    prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                  )}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.45rem 0.75rem",
                                    borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                    cursor: "pointer",
                                    color: newChatSelectedIds.includes(c.id) ? "#00FFFF" : "var(--color-green)",
                                    backgroundColor: newChatSelectedIds.includes(c.id) ? "rgba(3,160,98,0.1)" : "transparent",
                                  }}
                                >
                                  <span style={{ flex: 1, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.displayName}
                                  </span>
                                  <span style={{ fontSize: "0.8rem" }}>{newChatSelectedIds.includes(c.id) ? "\u2611" : "\u2610"}</span>
                                </div>
                              ))}
                            </div>
                            {newChatSelectedIds.length >= 2 && (
                              <input
                                type="text"
                                value={newChatTitle}
                                onChange={(e) => setNewChatTitle(e.target.value)}
                                maxLength={32}
                                placeholder={tr.groupTitle}
                                style={{
                                  marginTop: "0.5rem", width: "100%", fontSize: "0.8rem",
                                  padding: "0.35rem 0.5rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)", outline: "none",
                                }}
                              />
                            )}
                            {newChatError && (
                              <p style={{ color: "rgba(255,80,80,0.8)", fontSize: "0.75rem", margin: "0.35rem 0 0" }}>
                                {newChatError}
                              </p>
                            )}
                            {newChatSelectedIds.length > 0 && (
                              <button
                                className="add-contact-btn"
                                onClick={handleCreateChat}
                                disabled={creatingChat}
                                style={{ width: "100%", marginTop: "0.5rem" }}
                              >
                                {creatingChat ? "\u2026" : newChatSelectedIds.length === 1 ? tr.openChat : tr.createGroup}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
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
                        <Contact key={c.id} contact_name={c.name} onClick={() => handleOpenChat(Number(c.id), c.name, c.isGroup)}>
                          {c.lastMessage}
                        </Contact>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </article>
            </section>
          </section>
  );
}