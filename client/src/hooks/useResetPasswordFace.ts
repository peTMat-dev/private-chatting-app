import { useState, useMemo, useCallback } from "react";
import { postJson } from "../lib/api";
import { t, type LangCode } from "../lib/i18n";

export interface UseResetPasswordFaceReturn {
	// Forgot password state
	forgotEmail: string;
	setForgotEmail: (email: string) => void;
	loadingForgot: boolean;
	forgotDisabled: boolean;
	handleForgot: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	showToast: (message: { title: string; body: string }) => void;
	
	// Token reset state
	resetToken: string;
	resetPassword: string;
	setResetPassword: (pwd: string) => void;
	resetConfirmPassword: string;
	setResetConfirmPassword: (pwd: string) => void;
	resetDisabled: boolean;
	resetSuccess: boolean;
	resetError: string | null;
	handleTokenReset: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useResetPasswordFace(
	resetToken: string,
	lang: LangCode = "en",
	showToast: (message: { title: string; body: string }) => void = () => {},
	onSuccess?: () => void
): UseResetPasswordFaceReturn {
	const tr = t(lang);
	const [forgotEmail, setForgotEmail] = useState("");
	const [loadingForgot, setLoadingForgot] = useState(false);
	const [resetPassword, setResetPassword] = useState("");
	const [resetConfirmPassword, setResetConfirmPassword] = useState("");
	const [resetSuccess, setResetSuccess] = useState(false);
	const [resetError, setResetError] = useState<string | null>(null);

	const forgotDisabled = useMemo(
		() => loadingForgot || !forgotEmail || !forgotEmail.includes("@"),
		[loadingForgot, forgotEmail]
	);

	const resetDisabled = useMemo(() => {
		if (loadingForgot) return true;
		if (!resetToken) return true;
		if (!resetPassword || resetPassword.length < 6) return true;
		if (resetPassword !== resetConfirmPassword) return true;
		return false;
	}, [loadingForgot, resetToken, resetPassword, resetConfirmPassword]);

	const handleForgot = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoadingForgot(true);
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
			setLoadingForgot(false);
		}
	}, [forgotEmail, showToast, tr]);

	const handleTokenReset = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setResetError(null);
		setResetSuccess(false);
		
		if (!resetToken) {
			const errorMsg = tr.tokenMissing;
			setResetError(errorMsg);
			showToast({ title: tr.resetFailed, body: errorMsg });
			return;
		}
		if (resetPassword !== resetConfirmPassword) {
			const errorMsg = tr.passwordsMustMatch;
			setResetError(errorMsg);
			showToast({ title: tr.resetFailed, body: errorMsg });
			return;
		}

		setLoadingForgot(true);
		try {
			const { ok, data } = await postJson("/auth/reset-password", {
				token: resetToken,
				password: resetPassword,
			});
			if (!ok || !data.success) {
				const detail = data.errors?.[0] ?? data.error ?? tr.unableToReset;
				setResetError(detail);
				showToast({ title: tr.resetFailed, body: detail });
				return;
			}
			setResetSuccess(true);
			setResetPassword("");
			setResetConfirmPassword("");
			// Navigate after showing success message
			if (onSuccess) {
				setTimeout(() => {
					onSuccess();
				}, 1200);
			}
		} catch (error) {
			const errorMsg = (error as Error).message;
			setResetError(errorMsg);
			showToast({ title: tr.resetFailed, body: errorMsg });
		} finally {
			setLoadingForgot(false);
		}
	}, [resetToken, resetPassword, resetConfirmPassword, showToast, tr, onSuccess]);

	return {
		forgotEmail,
		setForgotEmail,
		loadingForgot,
		forgotDisabled,
		handleForgot,
		showToast,
		resetToken,
		resetPassword,
		setResetPassword,
		resetConfirmPassword,
		setResetConfirmPassword,
		resetDisabled,
		resetSuccess,
		resetError,
		handleTokenReset,
	};
}
