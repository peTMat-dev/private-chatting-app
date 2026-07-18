import { useCallback } from "react";
import { logout } from "../services/auth.service";

export interface UseLogoutFaceOptions {
	goUp: () => void;
	goLeft: () => void;
	onLoggedOut: () => void;
}

export interface UseLogoutFaceReturn {
	handleLogout: () => void;
}

export function useLogoutFace(options: UseLogoutFaceOptions): UseLogoutFaceReturn {
	const { goUp, goLeft, onLoggedOut } = options;
	const handleLogout = useCallback(() => {
		// Step 1: Move down from TOP face to previous face
		goUp();
		// Step 2: After animation, rotate left and logout
		setTimeout(() => {
			goLeft();
			setTimeout(() => {
				// Clear server session cookie + redirect (web-specific, injected by caller)
				onLoggedOut();
			}, 500); // Wait for rotation to complete
		}, 500); // Wait for down movement to complete
	}, [goUp, goLeft, onLoggedOut]);

	return {
		handleLogout,
	};
}
