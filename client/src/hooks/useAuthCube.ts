import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t, type LangCode } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";

type ToastMessage = {
	title: string;
	body: string;
};

export interface UseAuthCubeReturn {
	// Cube animation
	rotation: { x: number; y: number };
	transitionEnabled: boolean;
	fadeOut: boolean;
	handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
	handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
	handleTouchEnd: (e: TouchEvent<HTMLDivElement>) => void;
	handleHeaderTripleTap: () => void;
	handleFooterTripleTap: () => void;

	// Navigation (for CubeNavigationProvider)
	cubeNav: ReturnType<typeof useCubeNavigation>;

	// Toast
	toast: ToastMessage | null;
	showToast: (message: ToastMessage) => void;

	// Coordination
	resetToken: string;
	handleLoginSuccess: () => void;

	// Translations
	tr: ReturnType<typeof t>;
}

export function useAuthCube(): UseAuthCubeReturn {
	const router = useRouter();
	const searchParams = useSearchParams();
	const resetToken = searchParams.get("token") ?? "";
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const [fadeOut, setFadeOut] = useState(false);
	const { lang } = useLanguage();

	const [pendingRedirect, setPendingRedirect] = useState(false);
	const spinIntervalRef = useRef<number | null>(null);
	const spinTicksRef = useRef(0);
	const requiredSpinTicks = 4;

	const tr = t(lang);

	const cubeNav = useCubeNavigation(resetToken ? "left" : "front");

	// Toast auto-dismiss
	useEffect(() => {
		if (!toast) return;
		const timeout = setTimeout(() => setToast(null), 4500);
		return () => clearTimeout(timeout);
	}, [toast]);

	// Spin animation on login success → redirect
	const { setYTicks, setActiveFace } = cubeNav;
	useEffect(() => {
		const facesByTicks: CubeFace[] = ["front", "left", "back", "right"];
		if (pendingRedirect && spinIntervalRef.current == null) {
			spinTicksRef.current = 0;
			const step = () => {
				setYTicks((t) => {
					const next = t + 1;
					setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
					return next;
				});
				spinTicksRef.current += 1;
				if (spinTicksRef.current >= requiredSpinTicks) {
					if (spinIntervalRef.current != null) {
						window.clearInterval(spinIntervalRef.current);
						spinIntervalRef.current = null;
					}
					setPendingRedirect(false);
					setFadeOut(true);
					window.setTimeout(() => router.push("/home"), 350);
				}
			};
			spinIntervalRef.current = window.setInterval(step, 375);
		} else if (!pendingRedirect && spinIntervalRef.current != null) {
			window.clearInterval(spinIntervalRef.current);
			spinIntervalRef.current = null;
		}
		return () => {
			if (spinIntervalRef.current != null) {
				window.clearInterval(spinIntervalRef.current);
				spinIntervalRef.current = null;
			}
		};
		// setYTicks/setActiveFace are stable React state setters; cubeNav is excluded
		// because it is a new object every render and would restart the spin loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingRedirect, router, setYTicks, setActiveFace]);

	const handleLoginSuccess = useCallback(() => {
		spinTicksRef.current = 0;
		setPendingRedirect(true);
	}, []);

	return {
		rotation: cubeNav.rotation,
		transitionEnabled: cubeNav.transitionEnabled,
		fadeOut,
		handleKeyDown: cubeNav.handleKeyDown,
		handleTouchStart: cubeNav.handleTouchStart,
		handleTouchEnd: cubeNav.handleTouchEnd,
		handleHeaderTripleTap: cubeNav.handleHeaderTripleTap,
		handleFooterTripleTap: cubeNav.handleFooterTripleTap,
		cubeNav,
		toast,
		showToast: setToast,
		resetToken,
		handleLoginSuccess,
		tr,
	};
}