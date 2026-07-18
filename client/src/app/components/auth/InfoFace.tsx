"use client";

import { useMemo } from "react";
import { useInfoFace } from "../../../hooks/useInfoFace";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

export type InfoItem = {
	heading_cube: string;
	text_description?: string;
	descriptions?: string[];
	created_at?: string;
};

export type ReportedBug = {
	bug_id: number;
	title: string;
	category: string;
	bug_description: string;
	created_at: string;
	display_name: string;
};

export type InfoTab = "update" | "manual" | "announcement" | "reported_bugs";

type Props = {
	activeFace: string;
	onNavigate: (face: CubeFace) => void;
};

export default function AuthInfoFace({ activeFace, onNavigate }: Props) {
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const {
		activeInfoTab, setActiveInfoTab, infoItems, loadingInfoItems,
		selectedInfo, setSelectedInfo, reportedBugs, loadingBugs,
	} = useInfoFace(activeFace);
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
							loadingBugs ? (
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
											{tr.anonymized} · {new Date(bug.created_at).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}
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
							)
						) : loadingInfoItems ? (									<div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.loadingInfo}</div>
								) : infoItems.length === 0 ? (										<div style={{ padding: "1rem", color: "var(--color-green)", fontSize: "0.8rem", textAlign: "center" }}>{tr.noInfoEntries}</div>
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
								onClick={() => onNavigate("front")}
								style={{ margin: "0.5rem 1.25rem", fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
							>
								{tr.back}
							</button>
							</div>
						</article>
					</section>
	);
}
