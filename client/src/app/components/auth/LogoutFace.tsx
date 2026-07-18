"use client";

import { useMemo } from "react";
import { useLogoutFace } from "../../../hooks/useLogoutFace";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type Props = {
	onLogoutNavigate: () => void;
	onLoggedOut: () => void;
	onNavigate: (face: CubeFace) => void;
};

export default function AuthLogoutFace({ onLogoutNavigate, onLoggedOut, onNavigate }: Props) {
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const { handleLogout } = useLogoutFace({
		goUp: onLogoutNavigate,
		goLeft: onLogoutNavigate,
		onLoggedOut,
	});
	return (
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
												onClick={() => onNavigate("front")}
							>
								{tr.cancel}
							</button>
						</article>
					</section>
	);
}
