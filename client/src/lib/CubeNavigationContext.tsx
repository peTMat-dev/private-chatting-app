"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CubeFace } from "./useCubeNavigation";

interface CubeNavigationContextType {
	activeFace: CubeFace;
	setFace: (face: CubeFace) => void;
	goLeft: () => void;
	goRight: () => void;
	goUp: () => void;
	goDown: () => void;
}

const CubeNavigationContext = createContext<CubeNavigationContextType | undefined>(undefined);

export function CubeNavigationProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: CubeNavigationContextType;
}) {
	return (
		<CubeNavigationContext.Provider value={value}>
			{children}
		</CubeNavigationContext.Provider>
	);
}

export function useCubeNav(): CubeNavigationContextType {
	const context = useContext(CubeNavigationContext);
	if (!context) {
		throw new Error("useCubeNav must be used within CubeNavigationProvider");
	}
	return context;
}
