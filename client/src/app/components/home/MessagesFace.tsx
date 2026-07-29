"use client";

import { Dispatch, SetStateAction, RefObject } from "react";
import { type Translations } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";
import { type ChatMessage, type UserSettings, type ConfirmDialog } from "../../../lib/formTypes";

type Props = {
  activeChatId: number | null;
  activeChatName: string;
  activeChatIsGroup: boolean;
  activeChatMessages: ChatMessage[];
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  chatLoading: boolean;
  chatError: string | null;
  sendingMessage: boolean;
  confirmDialog: ConfirmDialog | null;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialog | null>>;
  handleSendMessage: () => void;
  handleDeleteMessage: (messageId: number) => void;
  handleMessageDoubleTap: (messageId: number) => void;
  settings: UserSettings | null;
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  setFace: (face: CubeFace) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  tr: Translations;
};

export default function MessagesFace({
  activeChatId, activeChatName, activeChatIsGroup, activeChatMessages,
  messageInput, setMessageInput, chatLoading, chatError, sendingMessage,
  confirmDialog, setConfirmDialog, handleSendMessage, handleDeleteMessage, handleMessageDoubleTap,
  settings, handleHeaderTripleTap, handleFooterTripleTap, setFace, messagesEndRef, tr,
}: Props) {
  return (
          <section className="cube-face cube-face-right">
            {confirmDialog?.show && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.55)",
                  borderRadius: "inherit",
                }}
              >
                <div
                  className="auth-card"
                  style={{
                    width: "fit-content",
                    maxWidth: "220px",
                    padding: "0.85rem 1rem",
                    boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)",
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
              </div>
            )}
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="cube-face-header" onClick={handleHeaderTripleTap} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setFace("front")}
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minWidth: 0 }}
                  >
                    ←
                  </button>
                  <h2 style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {activeChatName || tr.chat}
                  </h2>
                </div>

                {!activeChatId ? (
                  <p className="hero-copy">{tr.openConversation}</p>
                ) : chatLoading ? (
                  <div className="empty-state"><p>{tr.loadingUsers}</p></div>
                ) : chatError ? (
                  <div className="empty-state"><p>{chatError}</p></div>
                ) : (
                  <>
                    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {activeChatMessages.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <p style={{ color: "rgba(3,160,98,0.5)", fontSize: "0.85rem" }}>{tr.noMessagesYet}</p>
                        </div>
                      ) : (
                        activeChatMessages.map((m, i) => {
                          const tz = settings?.user_timezone || undefined;
                          const tzOpts = tz ? { timeZone: tz } : {};
                          const msgDate = new Date(m.sentAt);
                          const msgDay = msgDate.toLocaleDateString([], { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
                          const prevDay = i > 0 ? new Date(activeChatMessages[i - 1].sentAt).toLocaleDateString([], { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }) : null;
                          const showSeparator = msgDay !== prevDay;
                          const today = new Date().toLocaleDateString([], { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
                          const yesterday = new Date(Date.now() - 864e5).toLocaleDateString([], { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
                          const separatorLabel = msgDay === today ? "Today" : msgDay === yesterday ? "Yesterday" : msgDate.toLocaleDateString([], { ...tzOpts, day: "2-digit", month: "2-digit", year: "numeric" });
                          return (
                            <div key={m.messageId}>
                              {showSeparator && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0" }}>
                                  <div style={{ flex: 1, height: "1px", background: "rgba(3,160,98,0.2)" }} />
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-green)", whiteSpace: "nowrap" }}>{separatorLabel}</span>
                                  <div style={{ flex: 1, height: "1px", background: "rgba(3,160,98,0.2)" }} />
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: "column", alignItems: m.isOwn ? "flex-end" : "flex-start" }}>
                                {activeChatIsGroup && m.senderDisplayName && (
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-green)", marginBottom: "0.15rem" }}>
                                    {m.senderDisplayName}
                                  </span>
                                )}
                                <div
                                  style={{
                                    maxWidth: "75%",
                                    padding: "0.4rem 0.65rem",
                                    borderRadius: m.isOwn ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                                    background: m.isOwn ? "rgba(3,160,98,0.25)" : "rgba(3,160,98,0.1)",
                                    border: "1px solid rgba(3,160,98,0.3)",
                                    color: "var(--color-green)",
                                    fontSize: "0.85rem",
                                    wordBreak: "break-word",
                                    cursor: m.isOwn ? "pointer" : "default",
                                  }}
                                  onDoubleClick={m.isOwn ? () => handleDeleteMessage(m.messageId) : undefined}
                                  onTouchEnd={m.isOwn ? () => handleMessageDoubleTap(m.messageId) : undefined}
                                >
                                  {m.text}
                                </div>
                                <span style={{ fontSize: "0.65rem", color: "var(--color-green)", marginTop: "0.1rem" }}>
                                  {msgDate.toLocaleTimeString([], { ...tzOpts, hour: "2-digit", minute: "2-digit", hour12: false })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid var(--color-green-15)", display: "flex", gap: "0.4rem", alignItems: "flex-end" }}>
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                        }}
                        placeholder={tr.typeMessage}
                        rows={1}
                        style={{
                          flex: 1, resize: "none", fontSize: "0.85rem",
                          padding: "0.4rem 0.6rem",
                          background: "rgba(3,160,98,0.08)",
                          border: "1px solid rgba(3,160,98,0.3)",
                          borderRadius: "0.5rem",
                          color: "var(--color-green)", outline: "none", fontFamily: "inherit",
                        }}
                      />
                      <button
                        type="button"
                        className="contact-action-btn contact-action-btn--add"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !messageInput.trim()}
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.6rem" }}
                      >
                        {sendingMessage ? "\u2026" : tr.sendMessage}
                      </button>
                    </div>
                  </>
                )}
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </div>
            </article>
          </section>
  );
}