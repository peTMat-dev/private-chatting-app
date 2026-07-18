"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LANGUAGES, type LangCode } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { CubeNavigationProvider } from "../lib/CubeNavigationContext";
import { useAuthCube } from "../hooks/useAuthCube";
import { logout } from "../services/auth.service";
import LoginFace from "./components/auth/LoginFace";
import RegisterFace from "./components/auth/RegisterFace";
import ResetPasswordFace from "./components/auth/ResetPasswordFace";
import LanguageFace from "./components/auth/LanguageFace";
import AuthLogoutFace from "./components/auth/LogoutFace";
import AuthInfoFace from "./components/auth/InfoFace";

function AuthScreenContent() {
	const auth = useAuthCube();
	const router = useRouter();

	// Web-only session cleanup + redirect (injected into the portable LogoutFace)
	const handleLoggedOut = useCallback(() => {
		try {
			localStorage.removeItem("cubcha_username");
		} catch {
			// Ignore storage errors
		}
		void logout();
		router.push("/");
	}, [router]);

	return (
		<CubeNavigationProvider value={{
			activeFace: auth.cubeNav.activeFace,
			setFace: auth.cubeNav.setFace,
			goLeft: auth.cubeNav.goLeft,
			goRight: auth.cubeNav.goRight,
			goUp: auth.cubeNav.goUp,
			goDown: auth.cubeNav.goDown,
		}}>
			<div
				className={`mobile-auth-screen ${auth.fadeOut ? "fade-out" : ""}`}
				tabIndex={0}
				onKeyDown={auth.handleKeyDown}
				onTouchStart={auth.handleTouchStart}
				onTouchEnd={auth.handleTouchEnd}
			>
				<div className="auth-cube-stage">
					<div
						className="auth-cube"
						style={{
							transform: `rotateX(${auth.rotation?.x ?? 0}deg) rotateY(${auth.rotation?.y ?? 0}deg)`,
							transition: auth.transitionEnabled ? undefined : "none",
						}}
					>
						<LoginFace onLoginSuccess={auth.handleLoginSuccess} onNavigate={auth.cubeNav.setFace} />
						<RegisterFace onNavigate={auth.cubeNav.setFace} />
						<ResetPasswordFace resetToken={auth.resetToken} showToast={auth.showToast} onNavigate={auth.cubeNav.setFace} />
						<LanguageFace onNavigate={auth.cubeNav.setFace} />
						<AuthLogoutFace
							onLogoutNavigate={auth.cubeNav.goUp}
							onLoggedOut={handleLoggedOut}
							onNavigate={auth.cubeNav.setFace}
						/>
						{/* Bottom: Infos (visible before login for potential new users) */}
						<AuthInfoFace activeFace={auth.cubeNav.activeFace} onNavigate={auth.cubeNav.setFace} />
					</div>
				</div>

				{auth.toast && (
					<div className="toast-stack">
						<div className="toast-green">
							<strong>{auth.toast.title}</strong>
							<span>{auth.toast.body}</span>
						</div>
					</div>
				)}
			</div>
		</CubeNavigationProvider>
	);
}

export default function AuthScreen() {
	const searchParams = useSearchParams();
	const { setLang } = useLanguage();

	// Sync language from URL params on mount
	useEffect(() => {
		const urlLang = searchParams.get("lang") as LangCode | null;
		if (urlLang && LANGUAGES.some(l => l.code === urlLang)) {
			setLang(urlLang);
		}
	}, [searchParams, setLang]);

	return <AuthScreenContent />;
}
