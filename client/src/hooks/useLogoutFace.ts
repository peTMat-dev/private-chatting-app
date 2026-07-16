import { useCallback } from "react";

export interface UseLogoutFaceReturn {
	handleLogout: () => void;
}

export function useLogoutFace(
	goUp: () => void,
	goLeft: () => void
): UseLogoutFaceReturn {
	const handleLogout = useCallback(() => {
		// Step 1: Move down from TOP face to previous face
		goUp();
		// Step 2: After animation, rotate left and logout
		setTimeout(() => {
			goLeft();
			setTimeout(() => {
				// Clear session and redirect
				try {
					localStorage.removeItem("cubcha_username");
				} catch (e) {
					// Ignore storage errors
				}
				window.location.href = "/";
			}, 500); // Wait for rotation to complete
		}, 500); // Wait for down movement to complete
	}, [goUp, goLeft]);

	return {
		handleLogout,
	};
}