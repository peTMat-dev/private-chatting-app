"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl, postJson } from "../lib/api";
import { LANGUAGES, getLang, setLang, t, type LangCode } from "../lib/i18n";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";
import LoginFace from "./components/auth/LoginFace";
import RegisterFace from "./components/auth/RegisterFace";
import ResetPasswordFace from "./components/auth/ResetPasswordFace";
import LanguageFace from "./components/auth/LanguageFace";
import AuthLogoutFace from "./components/auth/LogoutFace";
import AuthInfoFace, { type InfoItem, type ReportedBug, type InfoTab } from "./components/auth/InfoFace";

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

					<LoginFace

					loginForm={loginForm}

					setLoginForm={setLoginForm}

					loginDisabled={loginDisabled}

					loadingLogin={loading.login}

					loginSuccess={loginSuccess}

					loginError={loginError}

					handleLogin={handleLogin}

					setFace={setFace}

					tr={tr}

				/>



					<RegisterFace

					registerForm={registerForm}

					setRegisterForm={setRegisterForm}

					registerDisabled={registerDisabled}

					loadingRegister={loading.register}

					registerErrors={registerErrors}

					registrationSuccess={registrationSuccess}

					handleRegister={handleRegister}

					setFace={setFace}

					tr={tr}

				/>



					<ResetPasswordFace

					resetToken={resetToken}

					resetPassword={resetPassword}

					setResetPassword={setResetPassword}

					resetConfirmPassword={resetConfirmPassword}

					setResetConfirmPassword={setResetConfirmPassword}

					forgotEmail={forgotEmail}

					setForgotEmail={setForgotEmail}

					loadingForgot={loading.forgot}

					resetDisabled={resetDisabled}

					forgotDisabled={forgotDisabled}

					handleForgot={handleForgot}

					handleTokenReset={handleTokenReset}

					setFace={setFace}

					tr={tr}

				/>



					<LanguageFace

					lang={lang}

					showLangSelect={showLangSelect}

					setShowLangSelect={setShowLangSelect}

					handleLangChange={handleLangChange}

					setFace={setFace}

					tr={tr}

				/>



					<AuthLogoutFace

					handleLogout={handleLogout}

					setFace={setFace}

					tr={tr}

				/>



					{/* Bottom: Infos (visible before login for potential new users) */}

					<AuthInfoFace

						activeInfoTab={activeInfoTab}

						setActiveInfoTab={setActiveInfoTab}

						infoItems={infoItems}

						loadingInfoItems={loadingInfoItems}

						selectedInfo={selectedInfo}

						setSelectedInfo={setSelectedInfo}

						reportedBugs={reportedBugs}

						loadingBugs={loadingBugs}

						lang={lang}

						goDown={goDown}

						tr={tr}

					/>				

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



