import { useState, useMemo, useCallback, type FormEvent } from "react";
import { postJson } from "../lib/api";
import { useRouter } from "next/navigation";
import { LANGUAGES, setLang, type LangCode } from "../lib/i18n";

export interface LoginFormData {
	username: string;
	password: string;
}

export interface UseLoginFaceReturn {
	// Form state
	loginForm: LoginFormData;
	setLoginForm: (form: LoginFormData) => void;
	
	// UI state
	loginError: string | null;
	loadingLogin: boolean;
	loginSuccess: boolean;
	
	// Computed
	loginDisabled: boolean;
	
	// Actions
	handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useLoginFace(): UseLoginFaceReturn {
	const router = useRouter();
	const [loginForm, setLoginForm] = useState<LoginFormData>({ username: "", password: "" });
	const [loginError, setLoginError] = useState<string | null>(null);
	const [loadingLogin, setLoadingLogin] = useState(false);
	const [loginSuccess, setLoginSuccess] = useState(false);

	const loginDisabled = useMemo(
		() => loadingLogin || !loginForm.username || !loginForm.password,
		[loadingLogin, loginForm]
	);

	const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoginError(null);
		setLoadingLogin(true);
		try {
			const { ok, data } = await postJson("/auth/login", loginForm);
			if (!ok || !data.success) {
				setLoadingLogin(false);
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
					}
				}
			} catch {}
			// Stop loading first to stabilize the UI
			setLoadingLogin(false);
			// Small delay to ensure render completes
			await new Promise(resolve => setTimeout(resolve, 50));
			setLoginSuccess(true);
			// Wait 1.2 seconds for message to be visible before starting rotation
			setTimeout(() => {
				// Defer redirect until after minimum spins complete
				// Note: The parent component will handle the spin animation
				router.push("/home");
			}, 1200);
		} catch (error) {
			setLoadingLogin(false);
			const errorMsg = (error as Error).message;
			setLoginError(errorMsg);
			setTimeout(() => setLoginError(null), 2000);
		}
	}, [loginForm, router]);

	return {
		loginForm,
		setLoginForm,
		loginError,
		loadingLogin,
		loginSuccess,
		loginDisabled,
		handleLogin,
	};
}