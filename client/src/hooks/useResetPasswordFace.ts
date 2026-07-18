import { useState, useMemo, useCallback } from "react";
import { t } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { forgotPassword, resetPassword as requestPasswordReset } from "../services/auth.service";

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
	showToast: (message: { title: string; body: string }) => void = () => {},
	onResetComplete?: () => void
): UseResetPasswordFaceReturn {
	const { lang } = useLanguage();
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
			const { ok, data } = await forgotPassword(forgotEmail);
			if (data.success === false) {
				showToast({ title: tr.resetFailed, body: data.error ?? tr.tryAgain });
				return;
			}
			showToast({ title: tr.resetSent, body: tr.resetInstructionsSent });
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
			setResetError(tr.tokenMissing);
			return;
		}
		if (resetPassword !== resetConfirmPassword) {
			setResetError(tr.passwordsMustMatch);
			return;
		}

		setLoadingForgot(true);
		try {
			const { ok, data } = await requestPasswordReset(resetToken, resetPassword);
			if (data.success === false) {
				const detail = data.errors?.[0] ?? data.error ?? tr.unableToReset;
				setResetError(detail);
				return;
			}
			setResetSuccess(true);
			setResetPassword("");
			setResetConfirmPassword("");
			// Notify parent to navigate back to login after showing success message
			setTimeout(() => {
				onResetComplete?.();
			}, 1200);
		} catch (error) {
			setResetError((error as Error).message);
		} finally {
			setLoadingForgot(false);
		}
	}, [resetToken, resetPassword, resetConfirmPassword, tr, onResetComplete]);

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
