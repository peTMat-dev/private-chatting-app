"use client";

import { Dispatch, SetStateAction } from "react";
import { type LangCode, type Translations } from "../../../lib/i18n";
import { type InfoItem, type ReportedBug } from "../types";

type InfoTab = "update" | "manual" | "announcement" | "reported_bugs";

type Props = {
  activeInfoTab: InfoTab;
  setActiveInfoTab: Dispatch<SetStateAction<InfoTab>>;
  infoItems: InfoItem[];
  loadingInfoItems: boolean;
  selectedInfo: InfoItem | null;
  setSelectedInfo: Dispatch<SetStateAction<InfoItem | null>>;
  reportedBugs: ReportedBug[];
  loadingBugs: boolean;
  bugTitleInput: string;
  setBugTitleInput: Dispatch<SetStateAction<string>>;
  bugInput: string;
  setBugInput: Dispatch<SetStateAction<string>>;
  bugCategoryInput: string;
  setBugCategoryInput: Dispatch<SetStateAction<string>>;
  submittingBug: boolean;
  bugReported: boolean;
  bugSubView: "list" | "report";
  setBugSubView: Dispatch<SetStateAction<"list" | "report">>;
  handleSubmitBug: () => void;
  lang: LangCode;
  goDown: () => void;
  tr: Translations;
};

export default function HomeInfoFace({
  activeInfoTab, setActiveInfoTab, infoItems, loadingInfoItems,
  selectedInfo, setSelectedInfo, reportedBugs, loadingBugs,
  bugTitleInput, setBugTitleInput, bugInput, setBugInput,
  bugCategoryInput, setBugCategoryInput, submittingBug, bugReported,
  bugSubView, setBugSubView, handleSubmitBug,
  lang, goDown, tr,
}: Props) {
  return (
          <section className="cube-face cube-face-bottom">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content" style={{ position: "relative" }}>

                {/* Info overlay modal */}
                {selectedInfo && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 10,
                      background: "var(--color-panel)",
                      borderRadius: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      padding: "1rem 1.25rem",
                      overflowY: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: selectedInfo.created_at ? "0.25rem" : "0.75rem" }}>
                      <h3 style={{ flex: 1, color: "var(--color-green)", margin: 0, fontSize: "0.95rem" }}>
                        {selectedInfo.heading_cube}
                      </h3>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setSelectedInfo(null)}
                        style={{ padding: "0.2rem 0.5rem", minWidth: 0, fontSize: "0.85rem" }}
                      >
                        ✕
                      </button>
                    </div>
                    {selectedInfo.created_at && (
                      <p style={{ color: "var(--color-green)", fontSize: "0.75rem", margin: "0 0 0.75rem" }}>
                        {new Date(selectedInfo.created_at).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </p>
                    )}
                    {selectedInfo.descriptions ? (
                      <ul style={{ color: "var(--color-green)", fontSize: "0.85rem", lineHeight: 1.55, margin: 0, paddingLeft: "1.2rem" }}>
                        {selectedInfo.descriptions.map((d, i) => (
                          <li key={i} style={{ marginBottom: "0.4rem" }}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "var(--color-green)", fontSize: "0.85rem", lineHeight: 1.55, margin: 0 }}>
                        {selectedInfo.text_description}
                      </p>
                    )}
                  </div>
                )}

                <div className="cube-face-header">
                  <h2>{tr.infoFace}</h2>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid rgba(3,160,98,0.2)", padding: "0 0.5rem" }}>
                  {(["update", "manual", "announcement", "reported_bugs"] as const).map((tab) => {
                    const labels: Record<string, string> = {
                      update: tr.whatsNew,
                      manual: tr.manual,
                      announcement: tr.announcements,
                      reported_bugs: tr.reportedBugs,
                    };
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setActiveInfoTab(tab);
                          setSelectedInfo(null);
                          if (tab !== "reported_bugs") setBugSubView("list");
                        }}
                        style={{
                          flex: 1,
                          background: "none",
                          border: "none",
                          borderBottom: activeInfoTab === tab ? "2px solid var(--color-green)" : "2px solid transparent",
                          color: "var(--color-green)",
                          fontSize: "0.65rem",
                          padding: "0.4rem 0.1rem",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          transition: "color 0.2s",
                        }}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
                  {activeInfoTab === "reported_bugs" ? (
                    <>
                      {/* Sub-toggle: View / Report */}
                      <div style={{ display: "flex", gap: "0.4rem", padding: "0.5rem 1.25rem 0.4rem", borderBottom: "1px solid rgba(3,160,98,0.12)" }}>
                        <button
                          type="button"
                          onClick={() => setBugSubView("list")}
                          style={{
                            flex: 1,
                            background: bugSubView === "list" ? "rgba(3,160,98,0.15)" : "none",
                            border: "1px solid rgba(3,160,98,0.3)",
                            borderRadius: "0.25rem",
                            color: "var(--color-green)",
                            fontSize: "0.72rem",
                            padding: "0.3rem 0.4rem",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {tr.reportedBugs}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBugSubView("report")}
                          style={{
                            flex: 1,
                            background: bugSubView === "report" ? "rgba(3,160,98,0.15)" : "none",
                            border: "1px solid rgba(3,160,98,0.3)",
                            borderRadius: "0.25rem",
                            color: "var(--color-green)",
                            fontSize: "0.72rem",
                            padding: "0.3rem 0.4rem",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {tr.reportBug}
                        </button>
                      </div>

                      {bugSubView === "report" ? (
                        /* Submit form */
                        <div style={{ padding: "0.75rem 1.25rem" }}>
                          {bugReported ? (
                            <p style={{ color: "var(--color-green)", fontSize: "0.8rem", margin: 0 }}>{tr.bugReported}</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <input
                                type="text"
                                value={bugTitleInput}
                                onChange={(e) => setBugTitleInput(e.target.value)}
                                placeholder={tr.bugTitle}
                                maxLength={64}
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "0.35rem 0.5rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)",
                                  outline: "none",
                                  fontFamily: "inherit",
                                }}
                              />
                              <select
                                value={bugCategoryInput}
                                onChange={(e) => setBugCategoryInput(e.target.value)}
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "0.35rem 0.5rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)",
                                  outline: "none",
                                  fontFamily: "inherit",
                                }}
                              >
                                {["UI", "Functionality", "Performance", "Security", "Other"].map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-end" }}>
                                <textarea
                                  value={bugInput}
                                  onChange={(e) => setBugInput(e.target.value)}
                                  placeholder={tr.bugDescription}
                                  maxLength={256}
                                  rows={3}
                                  style={{
                                    flex: 1,
                                    resize: "none",
                                    fontSize: "0.8rem",
                                    padding: "0.35rem 0.5rem",
                                    background: "rgba(3,160,98,0.08)",
                                    border: "1px solid rgba(3,160,98,0.3)",
                                    borderRadius: "0.25rem",
                                    color: "var(--color-green)",
                                    outline: "none",
                                    fontFamily: "inherit",
                                  }}
                                />
                                <button
                                  type="button"
                                  className="contact-action-btn contact-action-btn--add"
                                  onClick={handleSubmitBug}
                                  disabled={submittingBug || !bugTitleInput.trim() || !bugInput.trim() || !bugCategoryInput}
                                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.6rem" }}
                                >
                                  {submittingBug ? "…" : tr.submitBug}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Bug list */
                        <div>
                          {loadingBugs ? (
                            <div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.loadingInfo}</div>
                          ) : reportedBugs.length === 0 ? (
                            <div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.noBugsReported}</div>
                          ) : (
                            reportedBugs.map((bug) => (
                              <div
                                key={bug.bug_id}
                                style={{
                                  padding: "0.5rem 1.25rem",
                                  borderBottom: "1px solid rgba(3,160,98,0.1)",
                                }}
                              >
                                <div style={{ fontSize: "0.75rem", color: "var(--color-green)", marginBottom: "0.2rem" }}>
                                  {bug.display_name} · {new Date(bug.created_at).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}
                                </div>
                                <div style={{ color: "var(--color-green)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.15rem", wordBreak: "break-word", textDecoration: "underline", textDecorationThickness: "2px" }}>
                                  {bug.title}
                                </div>
                                <div style={{ color: "var(--color-green)", fontSize: "0.7rem", marginBottom: "0.15rem" }}>
                                  {bug.category}
                                </div>
                                <div style={{ color: "var(--color-green)", fontSize: "0.8rem", wordBreak: "break-word" }}>
                                  {bug.bug_description}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  ) : loadingInfoItems ? (
                    <div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.loadingInfo}</div>
                  ) : infoItems.length === 0 ? (
                    <div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.noInfoEntries}</div>
                  ) : (
                    infoItems.map((item) => (
                      <div
                        key={item.heading_cube}
                        onClick={() => setSelectedInfo(item)}
                        style={{
                          padding: "0.55rem 1.25rem",
                          borderBottom: "1px solid rgba(3,160,98,0.1)",
                          cursor: "pointer",
                          color: "var(--color-green)",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {item.heading_cube}
                        </span>
                        <span style={{ color: "var(--color-green)", fontSize: "0.75rem", marginLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                          {item.created_at && new Date(item.created_at).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}
                          ›
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  className="ghost-btn"
                  type="button"
                  onClick={goDown}
                  style={{ margin: "0.5rem 1.25rem", fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                >
                  {tr.cancel}
                </button>
              </div>
            </article>
          </section>
  );
}
