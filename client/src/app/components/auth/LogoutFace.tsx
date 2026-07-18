"use client";

import { useMemo } from "react";
import { useLogoutFace } from "../../../hooks/useLogoutFace";
import { useCubeNav } from "../../../lib/CubeNavigationContext";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";
import { logout } from "../../../services/auth.service";

export default function AuthLogoutFace() {
	const { setFace, goUp, goLeft } = useCubeNav();
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const { handleLogout } = useLogoutFace({
		goUp,
		goLeft,
		onLoggedOut: () => {
			try {
				localStorage.removeItem("cubcha_username");
			} catch (e) {
				// Ignore storage errors
			}
			void logout();
			window.location.href = "/";
		},
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
												onClick={() => setFace("front")}
							>
								{tr.cancel}
							</button>
						</article>
					</section>
	);
}
