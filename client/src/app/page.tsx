"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl, postJson } from "../lib/api";
import { DEFAULT_LANG, LANGUAGES, getLang, setLang, t, type LangCode } from "../lib/i18n";

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

type CubeFace = "front" | "right" | "left" | "back" | "top";

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
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const [activeFace, setActiveFace] = useState<CubeFace>(resetToken ? "left" : "front");
	// Track cumulative horizontal rotation in 90° steps to preserve direction
	const [yTicks, setYTicks] = useState<number>(resetToken ? 1 : 0);
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
	const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
	const [showLangSelect, setShowLangSelect] = useState(false);

	useEffect(() => {
		setLangState(getLang());
	}, []);

	const handleLangChange = (code: LangCode) => {
		setLang(code);
		setLangState(code);
		setShowLangSelect(false);
	};

	const tr = t(lang);

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

	const rotation = useMemo(() => {
		const baseX = -5;
		const baseY = -15;
		const x = activeFace === "top" ? baseX - 90 : baseX;
		const y = baseY + yTicks * 90;
		return { x, y };
	}, [activeFace, yTicks]);

	const goLeft = () => {
		if (activeFace === "top") return;
		setYTicks((t) => {
			const next = t + 1;
			setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
			return next;
		});
	};

	const goRight = () => {
		if (activeFace === "top") return;
		setYTicks((t) => {
			const next = t - 1;
			setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
			return next;
		});
	};

	const goDown = () => {
		setActiveFace((prev) => {
			if (prev === "front") return "top";
			return prev;
		});
	};

	const goUp = () => {
		setActiveFace((prev) => {
			if (prev === "top") return "front";
			return prev;
		});
	};

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

	// Helper to set face and keep ticks in sync
	const setFace = (face: CubeFace) => {
		setActiveFace(face);
		if (face !== "top") {
			const map: Record<CubeFace, number> = {
				front: 0,
				left: 1,
				back: 2,
				right: 3,
				top: yTicks, // unchanged
			};
			setYTicks(map[face]);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		switch (event.key) {
			case "ArrowLeft":
				event.preventDefault();
				goLeft();
				break;
			case "ArrowRight":
				event.preventDefault();
				goRight();
				break;
			case "ArrowDown":
				event.preventDefault();
				goDown();
				break;
			case "ArrowUp":
				event.preventDefault();
				goUp();
				break;
			default:
				break;
		}
	};

	const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		const touch = event.touches[0];
		if (!touch) return;
		touchStartRef.current = { x: touch.clientX, y: touch.clientY };
	};

	const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		const start = touchStartRef.current;
		if (!start) return;
		const touch = event.changedTouches[0];
		if (!touch) return;
		const dx = touch.clientX - start.x;
		const dy = touch.clientY - start.y;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);
		const threshold = 40;
		if (absDx < threshold && absDy < threshold) {
			return;
		}
		if (absDx > absDy) {
			if (dx < 0) {
				goRight();
			} else {
				goLeft();
			}
		} else {
			if (dy > 0) {
				goUp();
			} else {
				goDown();
			}
		}
		touchStartRef.current = null;
	};

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
				// persist username for chats fetch
				if (data.user?.username) {
					localStorage.setItem("cubcha_username", data.user.username);
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
			setRegisterErrors(["Passwords must match"]);
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
				const errs = data.errors ?? (data.error ? [data.error] : ["Registration failed"]);
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
				showToast({ title: "Reset failed", body: data.error ?? "Try again" });
				return;
			}
			showToast({ title: "Reset sent", body: data.message ?? "Check your inbox" });
			setForgotEmail("");
		} catch (error) {
			showToast({ title: "Reset failed", body: (error as Error).message });
		} finally {
			setLoading((prev) => ({ ...prev, forgot: false }));
		}
	};

	const handleTokenReset = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!resetToken) {
			showToast({ title: "Reset failed", body: "Token is missing" });
			return;
		}
		if (resetPassword !== resetConfirmPassword) {
			showToast({ title: "Reset failed", body: "Passwords must match" });
			return;
		}

		setLoading((prev) => ({ ...prev, forgot: true }));
		try {
			const { ok, data } = await postJson("/auth/reset-password", {
				token: resetToken,
				password: resetPassword,
			});
			if (!ok || !data.success) {
				const detail = data.errors?.[0] ?? data.error ?? "Unable to reset password";
				showToast({ title: "Reset failed", body: detail });
				return;
			}
			showToast({
				title: "Password updated",
				body: data.message ?? "Sign in with your new password",
			});
			setResetPassword("");
			setResetConfirmPassword("");
			setTimeout(() => {
				setFace("front");
				router.push("/");
			}, 1200);
		} catch (error) {
			showToast({ title: "Reset failed", body: (error as Error).message });
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

