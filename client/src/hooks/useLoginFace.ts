import { useState, useMemo, useCallback, type FormEvent } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { login } from "../services/auth.service";
import { type LoginFormData } from "../lib/formTypes";

export type { LoginFormData };

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

export function useLoginFace(options?: { onSuccess?: () => void }): UseLoginFaceReturn {
	const { lang } = useLanguage();
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
			const { ok, data } = await login(loginForm);
			if (data.success === false) {
				setLoadingLogin(false);
				const errorMsg = data.error ?? "Check your credentials";
				setLoginError(errorMsg);
				setTimeout(() => setLoginError(null), 2000);
				return;
			}
			// Stop loading first to stabilize the UI
			setLoadingLogin(false);
			// Small delay to ensure render completes
			await new Promise(resolve => setTimeout(resolve, 50));
			setLoginSuccess(true);
			// Notify parent after message is visible — parent handles spin + redirect
			setTimeout(() => {
				options?.onSuccess?.();
			}, 1200);
		} catch (error) {
			setLoadingLogin(false);
			const errorMsg = (error as Error).message;
			setLoginError(errorMsg);
			setTimeout(() => setLoginError(null), 2000);
		}
	}, [loginForm, options]);

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