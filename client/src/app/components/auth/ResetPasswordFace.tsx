"use client";

import { FormEvent, Dispatch, SetStateAction } from "react";
import { type Translations } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type Props = {
	resetToken: string;
	resetPassword: string;
	setResetPassword: Dispatch<SetStateAction<string>>;
	resetConfirmPassword: string;
	setResetConfirmPassword: Dispatch<SetStateAction<string>>;
	forgotEmail: string;
	setForgotEmail: Dispatch<SetStateAction<string>>;
	loadingForgot: boolean;
	resetDisabled: boolean;
	forgotDisabled: boolean;
	handleForgot: (event: FormEvent<HTMLFormElement>) => void;
	handleTokenReset: (event: FormEvent<HTMLFormElement>) => void;
	setFace: (face: CubeFace) => void;
	tr: Translations;
};

export default function ResetPasswordFace({
	resetToken, resetPassword, setResetPassword, resetConfirmPassword, setResetConfirmPassword,
	forgotEmail, setForgotEmail, loadingForgot, resetDisabled, forgotDisabled,
	handleForgot, handleTokenReset, setFace, tr,
}: Props) {
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
