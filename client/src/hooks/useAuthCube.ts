import { useState, useMemo, useCallback, useEffect, useRef, type FormEvent } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t, type LangCode } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";
import { useLoginFace } from "./useLoginFace";
import { useRegisterFace } from "./useRegisterFace";
import { useResetPasswordFace } from "./useResetPasswordFace";
import { useLanguageFace } from "./useLanguageFace";
import { useLogoutFace } from "./useLogoutFace";
import { useInfoFace } from "./useInfoFace";

type ToastMessage = {
	title: string;
	body: string;
};

export interface UseAuthCubeReturn {
	// Navigation
	face: CubeFace;
	setFace: (face: CubeFace) => void;
	goLeft: () => void;
	goRight: () => void;
	goDown: () => void;
	goUp: () => void;
	handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
	handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
	handleTouchEnd: (e: TouchEvent<HTMLDivElement>) => void;
	handleHeaderTripleTap: () => void;
	handleFooterTripleTap: () => void;
	rotation: { x: number; y: number };
	transitionEnabled: boolean;
	
	// Login
	loginForm: { username: string; password: string };
	setLoginForm: (form: { username: string; password: string }) => void;
	loginError: string | null;
	loadingLogin: boolean;
	loginSuccess: boolean;
	loginDisabled: boolean;
	handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
	
	// Register
	registerForm: { firstName: string; lastName: string; displayName: string; username: string; email: string; password: string; confirmPassword: string };
	setRegisterForm: (form: { firstName: string; lastName: string; displayName: string; username: string; email: string; password: string; confirmPassword: string }) => void;
	registerErrors: string[] | null;
	registrationSuccess: boolean;
	loadingRegister: boolean;
	registerDisabled: boolean;
	handleRegister: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	
	// Reset Password
	forgotEmail: string;
	setForgotEmail: (email: string) => void;
	loadingForgot: boolean;
	forgotDisabled: boolean;
	handleForgot: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	resetToken: string;
	resetPassword: string;
	setResetPassword: (pwd: string) => void;
	resetConfirmPassword: string;
	setResetConfirmPassword: (pwd: string) => void;
	resetDisabled: boolean;
	resetSuccess: boolean;
	resetError: string | null;
	handleTokenReset: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	
	// Language
	lang: LangCode;
	showLangSelect: boolean;
	setShowLangSelect: (show: boolean) => void;
	handleLangChange: (code: LangCode) => void;
	
	// Logout
	handleLogout: () => void;
	
	// Info
	activeInfoTab: "update" | "manual" | "announcement" | "reported_bugs";
	setActiveInfoTab: (tab: "update" | "manual" | "announcement" | "reported_bugs") => void;
	infoItems: Array<{ heading_cube: string; text_description?: string; descriptions?: string[]; created_at?: string }>;
	loadingInfoItems: boolean;
	selectedInfo: { heading_cube: string; text_description?: string; descriptions?: string[]; created_at?: string } | null;
	setSelectedInfo: (item: { heading_cube: string; text_description?: string; descriptions?: string[]; created_at?: string } | null) => void;
	reportedBugs: Array<{ bug_id: number; title: string; category: string; bug_description: string; created_at: string; display_name: string }>;
	loadingBugs: boolean;
	bugTitleInput: string;
	setBugTitleInput: (title: string) => void;
	bugInput: string;
	setBugInput: (input: string) => void;
	bugCategoryInput: string;
	setBugCategoryInput: (cat: string) => void;
	submittingBug: boolean;
	bugReported: boolean;
	bugSubView: "list" | "report";
	setBugSubView: (view: "list" | "report") => void;
	handleSubmitBug: () => Promise<void>;
	fetchInfos: () => Promise<void>;
	
	// Toast
	toast: ToastMessage | null;
	showToast: (message: ToastMessage) => void;
	
	// Translations
	tr: ReturnType<typeof t>;
	
	// Spin animation
	fadeOut: boolean;
}

export function useAuthCube(): UseAuthCubeReturn {
	const router = useRouter();
	const searchParams = useSearchParams();
	const resetToken = searchParams.get("token") ?? "";
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const [fadeOut, setFadeOut] = useState(false);
	const { lang } = useLanguage();
	
	// Spin animation state
	const [pendingRedirect, setPendingRedirect] = useState(false);
	const spinIntervalRef = useRef<number | null>(null);
	const spinTicksRef = useRef(0);
	const requiredSpinTicks = 12;

	const tr = useMemo(() => t(lang), [lang]);

	// Toast timeout
	useEffect(() => {
		if (!toast) return;
		const timeout = setTimeout(() => setToast(null), 4500);
		return () => clearTimeout(timeout);
	}, [toast]);

	// Toast handler for child hooks
	const handleShowToast = useCallback((message: ToastMessage) => {
		setToast(message);
	}, []);

	// Initialize cube navigation
	const cubeNav = useCubeNavigation(resetToken ? "left" : "front");

	// Handle password reset success - navigate to login
	const handlePasswordResetSuccess = useCallback(() => {
		cubeNav.setFace("front");
	}, [cubeNav]);

	// Initialize face hooks
	const loginFace = useLoginFace();
	const registerFace = useRegisterFace();
	const resetPasswordFace = useResetPasswordFace(resetToken, handleShowToast, handlePasswordResetSuccess);
	const languageFace = useLanguageFace();
	const logoutFace = useLogoutFace(cubeNav.goUp, cubeNav.goLeft);
	const infoFace = useInfoFace(cubeNav.activeFace);

	// Continuous spin while logging in
	useEffect(() => {
		const facesByTicks: CubeFace[] = ["front", "left", "back", "right"];
		const shouldSpin = pendingRedirect;
		
		if (shouldSpin && spinIntervalRef.current == null) {
			spinTicksRef.current = 0;
			const step = () => {
				cubeNav.setYTicks((t) => {
					const next = t + 1;
					cubeNav.setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
					return next;
				});
				spinTicksRef.current += 1;
				if (pendingRedirect && spinTicksRef.current >= requiredSpinTicks) {
					if (spinIntervalRef.current != null) {
						window.clearInterval(spinIntervalRef.current);
						spinIntervalRef.current = null;
					}
					setPendingRedirect(false);
					setFadeOut(true);
					window.setTimeout(() => {
						router.push("/home");
					}, 350);
				}
			};
			spinIntervalRef.current = window.setInterval(step, 375);
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
	}, [pendingRedirect, router, cubeNav]);

	// Handle login success with spin animation
	const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		spinTicksRef.current = 0; // ensure spin counter starts fresh
		await loginFace.handleLogin(event);
		if (loginFace.loginSuccess) {
			setTimeout(() => {
				setPendingRedirect(true);
			}, 1200);
		}
	}, [loginFace]);

	// Handle logout
	const handleLogout = useCallback(() => {
		logoutFace.handleLogout();
	}, [logoutFace]);

	// Handle language change
	const handleLangChange = useCallback((code: LangCode) => {
		languageFace.handleLangChange(code);
	}, [languageFace]);

	return {
		// Navigation
		face: cubeNav.activeFace,
		setFace: cubeNav.setFace,
		goLeft: cubeNav.goLeft,
		goRight: cubeNav.goRight,
		goDown: cubeNav.goDown,
		goUp: cubeNav.goUp,
		handleKeyDown: cubeNav.handleKeyDown,
		handleTouchStart: cubeNav.handleTouchStart,
		handleTouchEnd: cubeNav.handleTouchEnd,
		handleHeaderTripleTap: cubeNav.handleHeaderTripleTap,
		handleFooterTripleTap: cubeNav.handleFooterTripleTap,
		rotation: cubeNav.rotation,
		transitionEnabled: cubeNav.transitionEnabled,
		
		// Login
		loginForm: loginFace.loginForm,
		setLoginForm: loginFace.setLoginForm,
		loginError: loginFace.loginError,
		loadingLogin: loginFace.loadingLogin,
		loginSuccess: loginFace.loginSuccess,
		loginDisabled: loginFace.loginDisabled,
		handleLogin,
		
		// Register
		registerForm: registerFace.registerForm,
		setRegisterForm: registerFace.setRegisterForm,
		registerErrors: registerFace.registerErrors,
		registrationSuccess: registerFace.registrationSuccess,
		loadingRegister: registerFace.loadingRegister,
		registerDisabled: registerFace.registerDisabled,
		handleRegister: registerFace.handleRegister,
		
	// Reset Password
	forgotEmail: resetPasswordFace.forgotEmail,
	setForgotEmail: resetPasswordFace.setForgotEmail,
	loadingForgot: resetPasswordFace.loadingForgot,
	forgotDisabled: resetPasswordFace.forgotDisabled,
	handleForgot: resetPasswordFace.handleForgot,
	resetToken: resetPasswordFace.resetToken,
	resetPassword: resetPasswordFace.resetPassword,
	setResetPassword: resetPasswordFace.setResetPassword,
	resetConfirmPassword: resetPasswordFace.resetConfirmPassword,
	setResetConfirmPassword: resetPasswordFace.setResetConfirmPassword,
	resetDisabled: resetPasswordFace.resetDisabled,
	resetSuccess: resetPasswordFace.resetSuccess,
	resetError: resetPasswordFace.resetError,
	handleTokenReset: resetPasswordFace.handleTokenReset,
		
		// Language
		lang: languageFace.lang,
		showLangSelect: languageFace.showLangSelect,
		setShowLangSelect: languageFace.setShowLangSelect,
		handleLangChange,
		
		// Logout
		handleLogout,
		
		// Info
		activeInfoTab: infoFace.activeInfoTab,
		setActiveInfoTab: infoFace.setActiveInfoTab,
		infoItems: infoFace.infoItems,
		loadingInfoItems: infoFace.loadingInfoItems,
		selectedInfo: infoFace.selectedInfo,
		setSelectedInfo: infoFace.setSelectedInfo,
		reportedBugs: infoFace.reportedBugs,
		loadingBugs: infoFace.loadingBugs,
		bugTitleInput: infoFace.bugTitleInput,
		setBugTitleInput: infoFace.setBugTitleInput,
		bugInput: infoFace.bugInput,
		setBugInput: infoFace.setBugInput,
		bugCategoryInput: infoFace.bugCategoryInput,
		setBugCategoryInput: infoFace.setBugCategoryInput,
		submittingBug: infoFace.submittingBug,
		bugReported: infoFace.bugReported,
		bugSubView: infoFace.bugSubView,
		setBugSubView: infoFace.setBugSubView,
		handleSubmitBug: infoFace.handleSubmitBug,
		fetchInfos: infoFace.fetchInfos,
		
		// Toast
		toast,
		showToast: setToast,
		
		// Translations
		tr,
		
	// Spin animation
		fadeOut,
	};
}