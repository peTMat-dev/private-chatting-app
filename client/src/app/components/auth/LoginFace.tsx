"use client";

import { useMemo } from "react";
import { useLoginFace } from "../../../hooks/useLoginFace";
import { useCubeNav } from "../../../lib/CubeNavigationContext";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";

type Props = {
	onLoginSuccess: () => void;
};

export default function LoginFace({ onLoginSuccess }: Props) {
	const { setFace } = useCubeNav();
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const { loginForm, setLoginForm, loginDisabled, loadingLogin, loginSuccess, loginError, handleLogin } = useLoginFace({ onSuccess: onLoginSuccess });
	return (
		<section className="cube-face cube-face-front">
						<section className="auth-stack">
							<article className="auth-card cube-face-panel">
								<div className="cube-face-content">
									<div className="hero-in-card">
										<div className="status-pill">
											<span>{tr.mobileAuth}</span>
										</div>
										<h1 className="cubcha-heading">CubCha v1.0</h1>
										<p className="cubcha-subtext">{tr.appSubtext}</p>
									</div>
									<h2 className="sr-only">{tr.signIn}</h2>
								<form onSubmit={handleLogin} className="d-flex flex-column gap-3">
								<div>
										<label htmlFor="login-username" className="auth-label">
										{tr.username}
									</label>
									<input
										id="login-username"
										className="auth-input"
										value={loginForm.username}
										onChange={(event) =>
											setLoginForm((prev) => ({ ...prev, username: event.target.value }))
										}
										placeholder={tr.enterLdapId}
										/>
									</div>
									<div>
										<label htmlFor="login-password" className="auth-label">
										{tr.password}
										</label>
										<input
											id="login-password"
											type="password"
											className="auth-input"
											value={loginForm.password}
											onChange={(event) =>
												setLoginForm((prev) => ({ ...prev, password: event.target.value }))
											}
											placeholder="••••••••"
										/>
									</div>
									<button type="submit" className="auth-btn" disabled={loginDisabled}>
										{loadingLogin ? tr.authenticating : tr.signIn}
									</button>
									</form>
									<div className="auth-links">
									<button type="button" onClick={() => setFace("left")}>
									{tr.forgotPassword}
								</button>
								<button type="button" onClick={() => setFace("right")}>
									{tr.signUp}
									</button>
								</div>
								</div>
							{loginSuccess && (
								<div className="auth-success" role="alert" aria-live="polite">
									<strong>{tr.loginSuccess}</strong>
									<p>{tr.redirectingHome}</p>
								</div>
						)}
							{loginError && (
							<div className="auth-error" role="alert" aria-live="polite">
								<strong>{tr.loginFailed}</strong>
								<p>{loginError}</p>
							</div>
							)}
							</article>
						</section>
					</section>
	);
}
