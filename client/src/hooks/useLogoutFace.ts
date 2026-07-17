import { useCallback } from "react";
import { useCubeNav } from "../lib/CubeNavigationContext";
import { logout } from "../services/auth.service";

export interface UseLogoutFaceReturn {
	handleLogout: () => void;
}

export function useLogoutFace(): UseLogoutFaceReturn {
	const { goUp, goLeft } = useCubeNav();
	const handleLogout = useCallback(() => {
		// Step 1: Move down from TOP face to previous face
		goUp();
		// Step 2: After animation, rotate left and logout
		setTimeout(() => {
			goLeft();
			setTimeout(() => {
				// Clear client-side username
				try {
					localStorage.removeItem("cubcha_username");
				} catch (e) {
					// Ignore storage errors
				}
				// Clear server session cookie
				void logout();
				window.location.href = "/";
			}, 500); // Wait for rotation to complete
		}, 500); // Wait for down movement to complete
	}, [goUp, goLeft]);

	return {
		handleLogout,
	};
}
