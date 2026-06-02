"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl, postJson } from "../lib/api";
import { LANGUAGES, getLang, setLang, t, type LangCode } from "../lib/i18n";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";

type ApiResponse = {
	success: boolean;
	message?: string;
	error?: string;
	errors?: string[];
	// present for /auth/forgot-password when EXPOSE_RESET_URL=true on the server
	resetUrl?: string;
};

type ToastMessage = {
	title: string;
	body: string;
};

type InfoItem = {
	heading_cube: string;
	text_description?: string;
	descriptions?: string[];
	created_at?: string;
};

type ReportedBug = {
	bug_id: number;
	title: string;
	category: string;
	bug_description: string;
	created_at: string;
	display_name: string;
};

const buildEmptyRegisterForm = () => ({
	firstName: "",
	lastName: "",
	displayName: "",
	username: "",
	email: "",
	password: "",
	confirmPassword: "",
});



export default function AuthScreen() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const resetToken = searchParams.get("token") ?? "";
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const {
		activeFace,
		yTicks,
		setYTicks,
		setActiveFace,
		transitionEnabled,
		rotation,
		goLeft,
		goRight,
		goDown,
		goUp,
		setFace,
		handleKeyDown,
		handleTouchStart,
		handleTouchEnd,
	} = useCubeNavigation(resetToken ? "left" : "front");
	const [loading, setLoading] = useState({ login: false, register: false, forgot: false });
	const [registrationSuccess, setRegistrationSuccess] = useState(false);
	const [loginSuccess, setLoginSuccess] = useState(false);
	const [loginError, setLoginError] = useState<string | null>(null);

	const [loginForm, setLoginForm] = useState({ username: "", password: "" });
	const [registerForm, setRegisterForm] = useState(buildEmptyRegisterForm);
	const [registerErrors, setRegisterErrors] = useState<string[] | null>(null);
	const [forgotEmail, setForgotEmail] = useState("");
	const [resetPassword, setResetPassword] = useState("");
	const [resetConfirmPassword, setResetConfirmPassword] = useState("");
	const [lang, setLangState] = useState<LangCode>("en");
	const [showLangSelect, setShowLangSelect] = useState(false);

	// Bottom face (Infos) state
	type InfoTab = "update" | "manual" | "announcement" | "reported_bugs";
	const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>("update");
	const [infoItems, setInfoItems] = useState<InfoItem[]>([]);
	const [loadingInfoItems, setLoadingInfoItems] = useState(false);
	const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null);
	const [reportedBugs, setReportedBugs] = useState<ReportedBug[]>([]);
	const [loadingBugs, setLoadingBugs] = useState(false);

	useEffect(() => {
		const urlLang = searchParams.get("lang") as LangCode | null;
		if (urlLang && LANGUAGES.some(l => l.code === urlLang)) {
			setLang(urlLang);
			setLangState(urlLang);
		} else {
			setLangState(getLang());
		}
	}, []);

	const handleLangChange = (code: LangCode) => {
		setLang(code);
		setLangState(code);
		setShowLangSelect(false);
	};

	const tr = t(lang);

	// Fetch infos when bottom face is active
	useEffect(() => {
		if (activeFace !== "bottom") return;
		if (activeInfoTab === "reported_bugs") {
			if (reportedBugs.length > 0) return;
			setLoadingBugs(true);
			fetch(buildApiUrl("/infos/reported-bugs"), { headers: { Accept: "application/json" } })
				.then((r) => r.json())
				.then((d: { success: boolean; data?: ReportedBug[] }) => {
					if (d.success) setReportedBugs(d.data || []);
				})
				.catch(() => {})
				.finally(() => setLoadingBugs(false));
			return;
		}
		setInfoItems([]);
		setSelectedInfo(null);
		setLoadingInfoItems(true);
		fetch(buildApiUrl(`/infos?category=${activeInfoTab}&language_code=${lang}`), { headers: { Accept: "application/json" } })
			.then((r) => r.json())
			.then((d: { success: boolean; data?: InfoItem[] }) => {
				if (d.success) setInfoItems(d.data || []);
			})
			.catch(() => {})
			.finally(() => setLoadingInfoItems(false));
	}, [activeFace, activeInfoTab, lang, reportedBugs.length]);

	useEffect(() => {
		if (!toast) return;
		const timeout = setTimeout(() => setToast(null), 4500);
		return () => clearTimeout(timeout);
	}, [toast]);

	const loginDisabled = useMemo(
		() => loading.login || !loginForm.username || !loginForm.password,
		[loading.login, loginForm]
	);

	const registerDisabled = useMemo(() => {
		if (loading.register) return true;
		if (!registerForm.firstName || !registerForm.lastName) return true;
		if (!registerForm.displayName || registerForm.displayName.length < 3) return true;
		if (!registerForm.username || registerForm.username.length < 3) return true;
		if (!registerForm.email || !registerForm.email.includes("@")) return true;
		if (!registerForm.password || registerForm.password.length < 6) return true;
		if (registerForm.password !== registerForm.confirmPassword) return true;
		return false;
	}, [loading.register, registerForm]);

	const forgotDisabled = useMemo(
		() => loading.forgot || !forgotEmail || !forgotEmail.includes("@"),
		[loading.forgot, forgotEmail]
	);

	const resetDisabled = useMemo(() => {
		if (loading.forgot) return true;
		if (!resetToken) return true;
		if (!resetPassword || resetPassword.length < 6) return true;
		if (resetPassword !== resetConfirmPassword) return true;
		return false;
	}, [loading.forgot, resetToken, resetPassword, resetConfirmPassword]);

	const showToast = (message: ToastMessage) => setToast(message);

	const facesByTicks: CubeFace[] = ["front", "left", "back", "right"];

	// Continuous spin while logging in; ensure at least 3 full spins before redirect
	const [pendingRedirect, setPendingRedirect] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);
	const spinIntervalRef = useRef<number | null>(null);
	const spinTicksRef = useRef(0);
	const requiredSpinTicks = 12; // 3 full rotations (4 ticks per rotation)

	useEffect(() => {
		const shouldSpin = pendingRedirect; // Only spin on successful login
		if (shouldSpin && spinIntervalRef.current == null) {
			spinTicksRef.current = 0; // reset counter on spin start
			const step = () => {
				setYTicks((t) => {
					const next = t + 1;
					setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
					return next;
				});
				spinTicksRef.current += 1;
				if (pendingRedirect && spinTicksRef.current >= requiredSpinTicks) {
					if (spinIntervalRef.current != null) {
						window.clearInterval(spinIntervalRef.current);
						spinIntervalRef.current = null;
					}
					setPendingRedirect(false);
					// Trigger fade-out before navigating to menu cube
					setFadeOut(true);
					window.setTimeout(() => {
						router.push("/home");
					}, 350);
				}
			};
			spinIntervalRef.current = window.setInterval(step, 375); // 25% faster than 500ms
		} else if (!shouldSpin && spinIntervalRef.current != null) {
			window.clearInterval(spinIntervalRef.current);
			spinIntervalRef.current = null;
		}
		return () => {
			if (spinIntervalRef.current != null) {
				window.clearInterval(spinIntervalRef.current);
				spinIntervalRef.current = null;
			}
		};
	}, [pendingRedirect, router]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading((prev) => ({ ...prev, login: true }));
		spinTicksRef.current = 0; // ensure spin counter starts fresh
		try {
			const { ok, data } = await postJson("/auth/login", loginForm);
			if (!ok || !data.success) {
				setLoading((prev) => ({ ...prev, login: false }));
				const errorMsg = data.error ?? "Check your credentials";
				setLoginError(errorMsg);
				setTimeout(() => setLoginError(null), 2000);
				return;
			}
			try {
				// sync language preference from server (covers cross-browser/device logins)
				if (data.user?.user_language) {
					const serverLang = data.user.user_language as LangCode;
					if (LANGUAGES.some(l => l.code === serverLang)) {
						setLang(serverLang);
						setLangState(serverLang);
					}
				}
			} catch {}
			// Stop loading first to stabilize the UI
			setLoading((prev) => ({ ...prev, login: false }));
			// Small delay to ensure render completes
			await new Promise(resolve => setTimeout(resolve, 50));
			setLoginSuccess(true);
			// Wait 1.2 seconds for message to be visible before starting rotation
			setTimeout(() => {
				// Defer redirect until after minimum spins complete
				setPendingRedirect(true);
			}, 1200);
		} catch (error) {
			setLoading((prev) => ({ ...prev, login: false }));
			const errorMsg = (error as Error).message;
			setLoginError(errorMsg);
			setTimeout(() => setLoginError(null), 2000);
		}
	};

	const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (registerForm.password !== registerForm.confirmPassword) {
			setRegisterErrors([tr.passwordsMustMatch]);
			return;
		}
		setLoading((prev) => ({ ...prev, register: true }));
		const payload = {
			firstName: registerForm.firstName,
			lastName: registerForm.lastName,
			displayName: registerForm.displayName,
			username: registerForm.username,
			email: registerForm.email,
			password: registerForm.password,
		};
		try {
			const { ok, data } = await postJson("/auth/register", payload);
			if (!ok || !data.success) {
				const errs = data.errors ?? (data.error ? [data.error] : [tr.registrationFailed]);
				setRegisterErrors(errs);
				return;
			}
			setRegisterForm(buildEmptyRegisterForm());
			setRegisterErrors(null);
			setRegistrationSuccess(true);
			setTimeout(() => {
				setRegistrationSuccess(false);
				setFace("front");
			}, 2000);
		} catch (error) {
			const msg = (error as Error).message;
			setRegisterErrors([msg]);
		} finally {
			setLoading((prev) => ({ ...prev, register: false }));
		}
	};

	const handleForgot = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading((prev) => ({ ...prev, forgot: true }));
		try {
			const { ok, data } = await postJson("/auth/forgot-password", { email: forgotEmail });
			if (!ok || !data.success) {
				showToast({ title: tr.resetFailed, body: data.error ?? tr.tryAgain });
				return;
			}
			showToast({ title: tr.resetSent, body: data.message ?? tr.checkInbox });
			setForgotEmail("");
		} catch (error) {
			showToast({ title: tr.resetFailed, body: (error as Error).message });
		} finally {
			setLoading((prev) => ({ ...prev, forgot: false }));
		}
	};

	const handleTokenReset = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!resetToken) {
			showToast({ title: tr.resetFailed, body: tr.tokenMissing });
			return;
		}
		if (resetPassword !== resetConfirmPassword) {
			showToast({ title: tr.resetFailed, body: tr.passwordsMustMatch });
			return;
		}

		setLoading((prev) => ({ ...prev, forgot: true }));
		try {
			const { ok, data } = await postJson("/auth/reset-password", {
				token: resetToken,
				password: resetPassword,
			});
			if (!ok || !data.success) {
				const detail = data.errors?.[0] ?? data.error ?? tr.unableToReset;
				showToast({ title: tr.resetFailed, body: detail });
				return;
			}
			showToast({
				title: tr.passwordUpdated,
				body: data.message ?? tr.signInNewPassword,
			});
			setResetPassword("");
			setResetConfirmPassword("");
			setTimeout(() => {
				setFace("front");
				router.push("/");
			}, 1200);
		} catch (error) {
			showToast({ title: tr.resetFailed, body: (error as Error).message });
		} finally {
			setLoading((prev) => ({ ...prev, forgot: false }));
		}
	};

	const handleLogout = () => {
		// Step 1: Move down from TOP face to previous face
		goUp();
		// Step 2: After animation, rotate left and logout
		setTimeout(() => {
			goLeft();
			setTimeout(() => {
				// Clear session and redirect
				try {
					localStorage.removeItem("cubcha_username");
				} catch (e) {
					// Ignore storage errors
				}
				window.location.href = "/";
			}, 500); // Wait for rotation to complete
		}, 500); // Wait for down movement to complete
	};

	return (
		<div
			className={`mobile-auth-screen ${fadeOut ? "fade-out" : ""}`}
			tabIndex={0}
			onKeyDown={handleKeyDown}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
			>
				<div className="auth-cube-stage">
				<div
					className="auth-cube"
					style={{
						transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
						transition: transitionEnabled ? undefined : "none",
					}}
				>
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
										{loading.login ? tr.authenticating : tr.signIn}
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
								</div>							{loginSuccess && (
								<div className="auth-success" role="alert" aria-live="polite">
									<strong>{tr.loginSuccess}</strong>
									<p>{tr.redirectingHome}</p>
								</div>						)}							{loginError && (
							<div className="auth-error" role="alert" aria-live="polite">
								<strong>{tr.loginFailed}</strong>
								<p>{loginError}</p>
							</div>							)}							</article>
						</section>
					</section>

					<section className="cube-face cube-face-right">
						<article className="register-card cube-face-panel" id="register-card">
							<div className="cube-face-content">
								<div className="cube-face-header">
									<h3>{tr.register}</h3>
									<button
										className="ghost-btn"
										type="button"
													onClick={() => setFace("front")}
									>
										{tr.backToLogin}
									</button>
								</div>
								<form onSubmit={handleRegister} className="d-flex flex-column gap-2">

								{registerErrors && registerErrors.length > 0 && (
									<div className="auth-alert" role="alert" aria-live="polite">
										<ul className="mb-0">
											{registerErrors.map((e, i) => (
												<li key={i}>{e}</li>
											))}
										</ul>
									</div>
								)}
								<div className="row g-2">
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-first" className="auth-label">
										{tr.firstName}
										</label>
										<input
											id="reg-first"
											className="auth-input"
											value={registerForm.firstName}
											onChange={(event) =>
												setRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))
											}
										/>
									</div>
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-last" className="auth-label">
										{tr.lastName}
										</label>
										<input
											id="reg-last"
											className="auth-input"
											value={registerForm.lastName}
											onChange={(event) =>
												setRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))
											}
										/>
									</div>
								</div>

								<div className="row g-2">
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-display" className="auth-label">
										{tr.displayName}
									</label>
									<input
										id="reg-display"
										className="auth-input"
										value={registerForm.displayName}
										onChange={(event) =>
											setRegisterForm((prev) => ({ ...prev, displayName: event.target.value }))
										}
										placeholder={tr.visibleInChat}
										/>
									</div>
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-username" className="auth-label">
										{tr.username}
									</label>
									<input
										id="reg-username"
										className="auth-input"
										value={registerForm.username}
										onChange={(event) =>
											setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
										}
										placeholder={tr.ldapUid}
										/>
									</div>
								</div>

								<div>
									<label htmlFor="reg-email" className="auth-label">
									{tr.email}
								</label>
								<input
									id="reg-email"
									className="auth-input"
									type="email"
									value={registerForm.email}
									onChange={(event) =>
										setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
									}
									placeholder={tr.emailForNotifications}
									/>
								</div>

								<div className="row g-2">
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-pass" className="auth-label">
										{tr.password}
										</label>
										<input
											id="reg-pass"
											type="password"
											className="auth-input"
											value={registerForm.password}
											onChange={(event) =>
												setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
											}
										/>
									</div>
									<div className="col-12 col-sm-6">
										<label htmlFor="reg-confirm" className="auth-label">
										{tr.confirm}
										</label>
										<input
											id="reg-confirm"
											type="password"
											className="auth-input"
											value={registerForm.confirmPassword}
											onChange={(event) =>
												setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
											}
										/>
									</div>
								</div>

								<button type="submit" className="auth-btn" disabled={registerDisabled}>
									{loading.register ? tr.submitting : tr.submitRequest}
								</button>
							</form>
							</div>						{registrationSuccess && (
							<div className="auth-success" role="alert" aria-live="polite">
								<strong>{tr.registrationSuccess}</strong>
								<p>{tr.redirectingLogin}</p>
							</div>
						)}						</article>
					</section>

					<section className="cube-face cube-face-left">
						<article className="auth-card cube-face-panel">
							<div className="cube-face-content">
								<div className="cube-face-header">
									<h2>{tr.resetPassword}</h2>
									<button
										className="ghost-btn"
										type="button"
													onClick={() => setFace("front")}
									>
										{tr.backToLogin}
									</button>
								</div>
								{resetToken ? (
									<>
										<p className="hero-copy">{tr.enterNewPassword}</p>
										<form onSubmit={handleTokenReset} className="d-flex flex-column gap-3 mt-2">
										<div>
											<label htmlFor="reset-pass" className="auth-label">
												{tr.newPassword}
											</label>
											<input
												id="reset-pass"
												type="password"
												className="auth-input"
												value={resetPassword}
												onChange={(event) => setResetPassword(event.target.value)}
												placeholder="••••••••"
											/>
										</div>
										<div>
											<label htmlFor="reset-confirm" className="auth-label">
												{tr.confirmPassword}
											</label>
											<input
												id="reset-confirm"
												type="password"
												className="auth-input"
												value={resetConfirmPassword}
												onChange={(event) => setResetConfirmPassword(event.target.value)}
												placeholder="••••••••"
											/>
										</div>
											<button type="submit" className="auth-btn" disabled={resetDisabled}>
												{loading.forgot ? tr.updating : tr.resetPassword}
										</button>
										</form>
									</>
								) : (
									<>
										<p className="hero-copy">{tr.sendResetLinkPrompt}</p>
										<form onSubmit={handleForgot} className="d-flex flex-column gap-3 mt-2">
										<div>
											<label htmlFor="forgot-email" className="auth-label">
												{tr.email}
											</label>
											<input
												id="forgot-email"
												type="email"
												className="auth-input"
												value={forgotEmail}
												onChange={(event) => setForgotEmail(event.target.value)}
												placeholder="EMAIL@EXAMPLE.COM"
											/>
										</div>
											<button type="submit" className="auth-btn" disabled={forgotDisabled}>
												{loading.forgot ? tr.sending : tr.sendResetLink}
										</button>
										</form>
									</>
								)}
							</div>
						</article>
					</section>

					<section className="cube-face cube-face-back">
						<article className="auth-card cube-face-panel">
							<div className="cube-face-content">
								<div className="cube-face-header">
									<h2>{tr.changeLanguage}</h2>
									<button
										className="ghost-btn"
										type="button"
												onClick={() => setFace("front")}
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
														backgroundColor: lang === l.code ? "rgba(3, 160, 98, 0.15)" : "transparent",
														color: lang === l.code ? "#00FFFF" : "var(--color-green)",
														borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
														transition: "background-color 0.2s",
													}}
													onMouseEnter={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)"; }}
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

					{/* Bottom: Infos (visible before login for potential new users) */}
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
									onClick={goUp}
									style={{ margin: "0.5rem 1.25rem", fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
								>
									{tr.backToLogin}
								</button>
							</div>
						</article>
					</section>
				</div>
			</div>

			{toast && (
				<div className="toast-stack">
					<div className="toast-green">
						<strong>{toast.title}</strong>
						<span>{toast.body}</span>
					</div>
				</div>
			)}
		</div>
	);
}

