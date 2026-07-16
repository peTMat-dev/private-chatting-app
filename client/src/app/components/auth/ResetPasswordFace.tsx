"use client";

import { useMemo } from "react";
import { useResetPasswordFace } from "../../../hooks/useResetPasswordFace";
import { useCubeNav } from "../../../lib/CubeNavigationContext";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";

type Props = {
	resetToken: string;
	showToast: (message: { title: string; body: string }) => void;
};

export default function ResetPasswordFace({ resetToken, showToast }: Props) {
	const { setFace } = useCubeNav();
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const {
		resetPassword, setResetPassword, resetConfirmPassword, setResetConfirmPassword,
		forgotEmail, setForgotEmail, loadingForgot, resetDisabled, forgotDisabled,
		handleForgot, handleTokenReset, resetSuccess, resetError,
	} = useResetPasswordFace(resetToken, showToast);
	return (
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
										{resetSuccess && (
											<div className="auth-success" role="alert" aria-live="polite">
												<strong>{tr.passwordUpdated}</strong>
												<p>{tr.signInNewPassword}</p>
											</div>
										)}
										{resetError && !resetSuccess && (
											<div className="auth-error" role="alert" aria-live="polite">
												<strong>{tr.resetFailed}</strong>
												<p>{resetError}</p>
											</div>
										)}
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
												{loadingForgot ? tr.updating : tr.resetPassword}
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
												{loadingForgot ? tr.sending : tr.sendResetLink}
										</button>
										</form>
									</>
								)}
							</div>
						</article>
					</section>
	);
}