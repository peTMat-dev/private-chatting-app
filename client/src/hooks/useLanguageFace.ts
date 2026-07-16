import { useState, useCallback, useEffect } from "react";
import { LANGUAGES, getLang, setLang, type LangCode } from "../lib/i18n";

export interface UseLanguageFaceReturn {
	lang: LangCode;
	showLangSelect: boolean;
	setShowLangSelect: (show: boolean) => void;
	handleLangChange: (code: LangCode) => void;
}

export function useLanguageFace(): UseLanguageFaceReturn {
	const [lang, setLangState] = useState<LangCode>("en");
	const [showLangSelect, setShowLangSelect] = useState(false);

	useEffect(() => {
		setLangState(getLang());
	}, []);

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