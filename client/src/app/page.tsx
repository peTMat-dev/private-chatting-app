"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
	success: boolean;
	message?: string;
	error?: string;
	errors?: string[];
};

type ToastMessage = {
	title: string;
	body: string;
};

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const resolveApiBaseUrl = (): string => {
	if (ENV_API_BASE) {
		return ENV_API_BASE.replace(/\/+$/, "");
	}
	if (typeof window !== "undefined") {
		return window.location.origin.replace(/\/+$/, "");
	}
	return "";
};

const buildApiUrl = (path: string): string => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const base = resolveApiBaseUrl();
	return base ? `${base}${normalizedPath}` : normalizedPath;
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

const postJson = async (
	path: string,
	payload: unknown
): Promise<{ ok: boolean; data: ApiResponse }> => {
	const response = await fetch(buildApiUrl(path), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
	const data = (await response.json()) as ApiResponse;
	return { ok: response.ok, data };
};

export default function AuthScreen() {
	const router = useRouter();
	const registerCardRef = useRef<HTMLDivElement | null>(null);
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [loading, setLoading] = useState({ login: false, register: false, forgot: false });

	const [loginForm, setLoginForm] = useState({ username: "", password: "" });
	const [registerForm, setRegisterForm] = useState(buildEmptyRegisterForm);
	const [registerErrors, setRegisterErrors] = useState<string[] | null>(null);
	const [forgotEmail, setForgotEmail] = useState("");

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

	const showToast = (message: ToastMessage) => setToast(message);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading((prev) => ({ ...prev, login: true }));
		try {
			const { ok, data } = await postJson("/auth/login", loginForm);
			if (!ok || !data.success) {
				showToast({ title: "Login failed", body: data.error ?? "Check your credentials" });
				return;
			}
			showToast({ title: "Welcome back", body: data.message ?? "Redirecting..." });
			try {
				// persist username for chats fetch
				if (data.user?.username) {
					localStorage.setItem("cubcha_username", data.user.username);
				}
			} catch {}
			router.push("/chats");
		} catch (error) {
			showToast({ title: "Login failed", body: (error as Error).message });
		} finally {
			setLoading((prev) => ({ ...prev, login: false }));
		}
	};

	const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (registerForm.password !== registerForm.confirmPassword) {
			const msg = "Passwords must match";
			setRegisterErrors([msg]);
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
			showToast({ title: "Registration", body: data.message ?? "Account created" });
			setRegisterForm(buildEmptyRegisterForm());
			setRegisterErrors(null);
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
			setDrawerOpen(false);
			setForgotEmail("");
		} catch (error) {
			showToast({ title: "Reset failed", body: (error as Error).message });
		} finally {
			setLoading((prev) => ({ ...prev, forgot: false }));
		}
	};

	const scrollToRegister = () => {
		registerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="mobile-auth-screen">
			<div className="hero-panel">
				<div className="hero-content">
					<div className="status-pill">
						<span>Mobile Auth</span>
					</div>
					<h1 className="cubcha-heading">CubCha v1.0</h1>
					<p className="cubcha-subtext">instructions will come here later - in development.</p>
				</div>
			</div>

			<section className="auth-stack">
				<article className="auth-card">
					<h2>Sign In</h2>
					<form onSubmit={handleLogin} className="d-flex flex-column gap-3">
						<div>
							<label htmlFor="login-username" className="auth-label">
								Username
							</label>
							<input
								id="login-username"
								className="auth-input"
								value={loginForm.username}
								onChange={(event) =>
									setLoginForm((prev) => ({ ...prev, username: event.target.value }))
								}
								placeholder="Enter LDAP ID"
							/>
						</div>
						<div>
							<label htmlFor="login-password" className="auth-label">
								Password
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
							{loading.login ? "Authenticating" : "Sign In"}
						</button>
					</form>
					<div className="auth-links">
						<button type="button" onClick={() => setDrawerOpen(true)}>
							Forgot your password?
						</button>
						<button type="button" onClick={scrollToRegister}>
							Sign up!
						</button>
					</div>
				</article>

				<article className="register-card" ref={registerCardRef} id="register-card">
					<h3>Register</h3>
					<p className="hero-copy">
						Submit your details and we will queue your account for inclusion in chat_groups.
						No extra group decisions needed.
					</p>
					<form onSubmit={handleRegister} className="d-flex flex-column gap-3">
					{registerErrors && registerErrors.length > 0 && (
						<div className="auth-alert" role="alert" aria-live="polite">
							<ul className="mb-0">
								{registerErrors.map((e, i) => (
									<li key={i}>{e}</li>
								))}
							</ul>
						</div>
					)}
						<div className="row g-3">
							<div className="col-12 col-sm-6">
								<label htmlFor="reg-first" className="auth-label">
									First name
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
									Last name
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

						<div className="row g-3">
							<div className="col-12 col-sm-6">
								<label htmlFor="reg-display" className="auth-label">
									Display name
								</label>
								<input
									id="reg-display"
									className="auth-input"
									value={registerForm.displayName}
									onChange={(event) =>
										setRegisterForm((prev) => ({ ...prev, displayName: event.target.value }))
									}
									placeholder="Visible in chat"
								/>
							</div>
							<div className="col-12 col-sm-6">
								<label htmlFor="reg-username" className="auth-label">
									Username
								</label>
								<input
									id="reg-username"
									className="auth-input"
									value={registerForm.username}
									onChange={(event) =>
										setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
									}
									placeholder="LDAP UID"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="reg-email" className="auth-label">
								Email
							</label>
							<input
								id="reg-email"
								className="auth-input"
								type="email"
								value={registerForm.email}
								onChange={(event) =>
									setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
								}
								placeholder="Email for notifications"
							/>
						</div>

						<div className="row g-3">
							<div className="col-12 col-sm-6">
								<label htmlFor="reg-pass" className="auth-label">
									Password
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
									Confirm
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
							{loading.register ? "Submitting" : "Submit request"}
						</button>
					</form>
				</article>
			</section>

			<ForgotPasswordDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				email={forgotEmail}
				onEmailChange={setForgotEmail}
				onSubmit={handleForgot}
				disabled={forgotDisabled}
				loading={loading.forgot}
			/>

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

	type DrawerProps = {
		open: boolean;
		onClose: () => void;
		email: string;
		onEmailChange: (value: string) => void;
		onSubmit: (event: FormEvent<HTMLFormElement>) => void;
		disabled: boolean;
		loading: boolean;
	};

	function ForgotPasswordDrawer({
		open,
		onClose,
		email,
		onEmailChange,
		onSubmit,
		disabled,
		loading,
	}: DrawerProps) {
	return (
		<div className={`drawer-root ${open ? "open" : ""}`} aria-hidden={!open}>
			<div className="drawer-backdrop" onClick={onClose} />
			<aside className="drawer-panel">
				<div className="d-flex justify-content-between align-items-center">
					<h4>Forgot password</h4>
					<button type="button" className="ghost-btn" onClick={onClose}>
						Close
					</button>
				</div>
				<p className="hero-copy">Slide-in recovery posts straight to /auth/forgot-password.</p>
				<form onSubmit={onSubmit} className="d-flex flex-column gap-3 mt-2">
					<div>
						<label htmlFor="forgot-email" className="auth-label">
							Email
						</label>
						<input
							id="forgot-email"
							type="email"
							className="auth-input"
							value={email}
							onChange={(event) => onEmailChange(event.target.value)}
							placeholder="EMAIL@EXAMPLE.COM"
						/>
					</div>
					<button type="submit" className="auth-btn" disabled={disabled}>
						{loading ? "Sending" : "Send reset link"}
					</button>
				</form>
			</aside>
		</div>
	);
}

