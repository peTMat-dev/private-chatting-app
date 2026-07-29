"use client";

import { useLanguageFace } from "../../../hooks/useLanguageFace";
import { useLanguage } from "../../../lib/LanguageContext";
import { useMemo } from "react";
import { LANGUAGES, t } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type Props = {
	onNavigate: (face: CubeFace) => void;
};

export default function LanguageFace({ onNavigate }: Props) {
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const { showLangSelect, setShowLangSelect, handleLangChange } = useLanguageFace();
	return (
		<section className="cube-face cube-face-back">
						<article className="auth-card cube-face-panel">
							<div className="cube-face-content">
								<div className="cube-face-header">
									<h2>{tr.changeLanguage}</h2>
									<button
										className="ghost-btn"
										type="button"
												onClick={() => onNavigate("front")}
									>
										{tr.backToLogin}
									</button>
								</div>
								<div>
									<button
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
														backgroundColor: lang === l.code ? "var(--color-green-15)" : "transparent",
														color: lang === l.code ? "#00FFFF" : "var(--color-green)",
														borderBottom: "1px solid var(--color-green-10)",
														transition: "background-color 0.2s",
													}}
													onMouseEnter={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "var(--color-green-08)"; }}
													onMouseLeave={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "transparent"; }}
												>
													{l.label}{lang === l.code ? " ✓" : ""}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</article>
					</section>
	);
}
