"use client";

import { useAuthCube } from "../hooks/useAuthCube";
import LoginFace from "./components/auth/LoginFace";
import RegisterFace from "./components/auth/RegisterFace";
import ResetPasswordFace from "./components/auth/ResetPasswordFace";
import LanguageFace from "./components/auth/LanguageFace";
import AuthLogoutFace from "./components/auth/LogoutFace";
import AuthInfoFace from "./components/auth/InfoFace";

export default function AuthScreen() {
	const auth = useAuthCube();

	return (
		<div
			className={`mobile-auth-screen ${auth.fadeOut ? "fade-out" : ""}`}
			tabIndex={0}
			onKeyDown={auth.handleKeyDown}
			onTouchStart={auth.handleTouchStart}
			onTouchEnd={auth.handleTouchEnd}
		>
			<div className="auth-cube-stage">
				<div
					className="auth-cube"
					style={{
						transform: `rotateX(${auth.rotation?.x ?? 0}deg) rotateY(${auth.rotation?.y ?? 0}deg)`,
						transition: auth.transitionEnabled ? undefined : "none",
					}}
				>
					<LoginFace
						loginForm={auth.loginForm}
						setLoginForm={auth.setLoginForm}
						loginDisabled={auth.loginDisabled}
						loadingLogin={auth.loadingLogin}
						loginSuccess={auth.loginSuccess}
						loginError={auth.loginError}
						handleLogin={auth.handleLogin}
						setFace={auth.setFace}
						tr={auth.tr}
					/>

					<RegisterFace
						registerForm={auth.registerForm}
						setRegisterForm={auth.setRegisterForm}
						registerDisabled={auth.registerDisabled}
						loadingRegister={auth.loadingRegister}
						registerErrors={auth.registerErrors}
						registrationSuccess={auth.registrationSuccess}
						handleRegister={auth.handleRegister}
						setFace={auth.setFace}
						tr={auth.tr}
					/>

				<ResetPasswordFace
					resetToken={auth.resetToken}
					resetPassword={auth.resetPassword}
					setResetPassword={auth.setResetPassword}
					resetConfirmPassword={auth.resetConfirmPassword}
					setResetConfirmPassword={auth.setResetConfirmPassword}
					forgotEmail={auth.forgotEmail}
					setForgotEmail={auth.setForgotEmail}
					loadingForgot={auth.loadingForgot}
					resetDisabled={auth.resetDisabled}
					forgotDisabled={auth.forgotDisabled}
					handleForgot={auth.handleForgot}
					handleTokenReset={auth.handleTokenReset}
					setFace={auth.setFace}
					tr={auth.tr}
					resetSuccess={auth.resetSuccess}
					resetError={auth.resetError}
				/>

					<LanguageFace
						lang={auth.lang}
						showLangSelect={auth.showLangSelect}
						setShowLangSelect={auth.setShowLangSelect}
						handleLangChange={auth.handleLangChange}
						setFace={auth.setFace}
						tr={auth.tr}
					/>

					<AuthLogoutFace
						handleLogout={auth.handleLogout}
						setFace={auth.setFace}
						tr={auth.tr}
					/>

					{/* Bottom: Infos (visible before login for potential new users) */}
					<AuthInfoFace
						activeInfoTab={auth.activeInfoTab}
						setActiveInfoTab={auth.setActiveInfoTab}
						infoItems={auth.infoItems}
						loadingInfoItems={auth.loadingInfoItems}
						selectedInfo={auth.selectedInfo}
						setSelectedInfo={auth.setSelectedInfo}
						reportedBugs={auth.reportedBugs}
						loadingBugs={auth.loadingBugs}
						lang={auth.lang}
						goDown={auth.goDown}
						tr={auth.tr}
					/>				
				</div>
			</div>

			{auth.toast && (
				<div className="toast-stack">
					<div className="toast-green">
						<strong>{auth.toast.title}</strong>
						<span>{auth.toast.body}</span>
					</div>
				</div>
			)}
		</div>
	);
}
