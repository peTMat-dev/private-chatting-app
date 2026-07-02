"use client";

import { FormEvent, Dispatch, SetStateAction } from "react";
import { type Translations } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type LoginForm = { username: string; password: string };

type Props = {
	loginForm: LoginForm;
	setLoginForm: Dispatch<SetStateAction<LoginForm>>;
	loginDisabled: boolean;
	loadingLogin: boolean;
	loginSuccess: boolean;
	loginError: string | null;
	handleLogin: (event: FormEvent<HTMLFormElement>) => void;
	setFace: (face: CubeFace) => void;
	tr: Translations;
};

export default function LoginFace({
	loginForm, setLoginForm, loginDisabled, loadingLogin, loginSuccess, loginError, handleLogin, setFace, tr,
}: Props) {
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
