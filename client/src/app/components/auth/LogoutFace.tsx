"use client";

import { type Translations } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type Props = {
	handleLogout: () => void;
	setFace: (face: CubeFace) => void;
	tr: Translations;
};

export default function AuthLogoutFace({ handleLogout, setFace, tr }: Props) {
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
