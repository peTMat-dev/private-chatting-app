"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { setLang as setLangStorage, type LangCode } from "./i18n";

interface LanguageContextType {
	lang: LangCode;
	setLang: (lang: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLang = "en" }: { children: ReactNode; initialLang?: LangCode }) {
	// initialLang is read from the cubcha_lang cookie in layout.tsx and passed here
	// so the server-rendered and client-rendered initial language always match (no hydration mismatch).
	// It is intentionally used as the useState initializer below.
	const [lang, setLangState] = useState<LangCode>(initialLang);

	const setLang = (newLang: LangCode) => {
		setLangStorage(newLang);
		setLangState(newLang);
	};

	return (
		<LanguageContext.Provider value={{ lang, setLang }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage(): LanguageContextType {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within LanguageProvider");
	}
	return context;
}
