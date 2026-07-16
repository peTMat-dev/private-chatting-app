import { useState, useCallback } from "react";
import { LANGUAGES, getLang, setLang, type LangCode } from "../lib/i18n";

export interface UseLanguageFaceReturn {
	lang: LangCode;
	showLangSelect: boolean;
	setShowLangSelect: (show: boolean) => void;
	handleLangChange: (code: LangCode) => void;
}

export function useLanguageFace(): UseLanguageFaceReturn {
	const [lang, setLangState] = useState<LangCode>(getLang());
	const [showLangSelect, setShowLangSelect] = useState(false);

	const handleLangChange = useCallback((code: LangCode) => {
		setLang(code);
		setLangState(code);
		setShowLangSelect(false);
	}, []);

	return {
		lang,
		showLangSelect,
		setShowLangSelect,
		handleLangChange,
	};
}