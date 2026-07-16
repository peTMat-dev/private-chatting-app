import { useState, useCallback } from "react";
import { LANGUAGES, type LangCode } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";

export interface UseLanguageFaceReturn {
	lang: LangCode;
	showLangSelect: boolean;
	setShowLangSelect: (show: boolean) => void;
	handleLangChange: (code: LangCode) => void;
}

export function useLanguageFace(): UseLanguageFaceReturn {
	const { lang, setLang } = useLanguage();
	const [showLangSelect, setShowLangSelect] = useState(false);

	const handleLangChange = useCallback((code: LangCode) => {
		setLang(code);
		setShowLangSelect(false);
	}, [setLang]);

	return {
		lang,
		showLangSelect,
		setShowLangSelect,
		handleLangChange,
	};
}