"use client";

import { useMemo } from "react";
import { useRegisterFace } from "../../../hooks/useRegisterFace";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/i18n";
import { type CubeFace } from "../../../lib/useCubeNavigation";

type Props = {
	onNavigate: (face: CubeFace) => void;
};

export default function RegisterFace({ onNavigate }: Props) {
	const { lang } = useLanguage();
	const tr = useMemo(() => t(lang), [lang]);
	const { registerForm, setRegisterForm, registerDisabled, loadingRegister, registerErrors, registrationSuccess, handleRegister } = useRegisterFace();
	return (
		<section className="cube-face cube-face-right">
						<article className="register-card cube-face-panel" id="register-card">
							<div className="cube-face-content">
								<div className="cube-face-header">
									<h3>{tr.register}</h3>
									<button
										className="ghost-btn"
										type="button"
													onClick={() => onNavigate("front")}
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
									{loadingRegister ? tr.submitting : tr.submitRequest}
								</button>
							</form>
							</div>
						{registrationSuccess && (
							<div className="auth-success" role="alert" aria-live="polite">
								<strong>{tr.registrationSuccess}</strong>
								<p>{tr.redirectingLogin}</p>
							</div>
						)}
						</article>
					</section>
	);
}
