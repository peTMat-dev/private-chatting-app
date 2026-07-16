import { useState, useMemo, useCallback, useEffect } from "react";
import { buildApiUrl } from "../lib/api";
import { t } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { useCubeNav } from "../lib/CubeNavigationContext";
import type { InfoItem, ReportedBug, InfoTab } from "../app/components/auth/InfoFace";

export interface UseInfoFaceReturn {
	// Info state
	activeInfoTab: InfoTab;
	setActiveInfoTab: (tab: InfoTab) => void;
	infoItems: InfoItem[];
	loadingInfoItems: boolean;
	selectedInfo: InfoItem | null;
	setSelectedInfo: (item: InfoItem | null) => void;
	
	// Bugs state
	reportedBugs: ReportedBug[];
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
	
	// Actions
	handleSubmitBug: () => Promise<void>;
	fetchInfos: () => Promise<void>;
}

export function useInfoFace(): UseInfoFaceReturn {
	const { activeFace } = useCubeNav();
	const { lang } = useLanguage();
	const tr = t(lang);
	const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>("update");
	const [infoItems, setInfoItems] = useState<InfoItem[]>([]);
	const [loadingInfoItems, setLoadingInfoItems] = useState(false);
	const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null);
	const [reportedBugs, setReportedBugs] = useState<ReportedBug[]>([]);
	const [loadingBugs, setLoadingBugs] = useState(false);
	const [bugTitleInput, setBugTitleInput] = useState("");
	const [bugInput, setBugInput] = useState("");
	const [bugCategoryInput, setBugCategoryInput] = useState("Other");
	const [submittingBug, setSubmittingBug] = useState(false);
	const [bugReported, setBugReported] = useState(false);
	const [bugSubView, setBugSubView] = useState<"list" | "report">("list");

	// Fetch infos when bottom face is active
	useEffect(() => {
		if (activeFace !== "bottom") return;
		fetchInfos();
	}, [activeFace, activeInfoTab, lang, reportedBugs.length]);

	const fetchInfos = useCallback(async () => {
		if (activeInfoTab === "reported_bugs") {
			if (reportedBugs.length > 0) return;
			setLoadingBugs(true);
			try {
				const res = await fetch(buildApiUrl("/infos/reported-bugs"), { 
					headers: { Accept: "application/json" } 
				});
				const d = (await res.json()) as { success: boolean; data?: ReportedBug[] };
				if (d.success) setReportedBugs(d.data || []);
			} catch {
				// Ignore errors
			} finally {
				setLoadingBugs(false);
			}
			return;
		}

		setInfoItems([]);
		setSelectedInfo(null);
		setLoadingInfoItems(true);
		try {
			const res = await fetch(buildApiUrl(`/infos?category=${activeInfoTab}&language_code=${lang}`), { 
				headers: { Accept: "application/json" } 
			});
			const d = (await res.json()) as { success: boolean; data?: InfoItem[] };
			if (d.success) setInfoItems(d.data || []);
		} catch {
			// Ignore errors
		} finally {
			setLoadingInfoItems(false);
		}
	}, [activeInfoTab, lang, reportedBugs.length]);

	const handleSubmitBug = useCallback(async () => {
		if (!bugTitleInput.trim() || !bugInput.trim() || !bugCategoryInput || submittingBug) return;
		setSubmittingBug(true);
		try {
			const res = await fetch(buildApiUrl("/infos/report-bug"), {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ 
					title: bugTitleInput.trim(), 
					description: bugInput.trim(), 
					category: bugCategoryInput 
				}),
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setBugTitleInput("");
				setBugInput("");
				setBugCategoryInput("Other");
				setBugReported(true);
				setReportedBugs([]); // reset so it reloads on next visit
				setTimeout(() => setBugReported(false), 4000);
			} else {
				// Note: Parent component will show error
			}
		} catch {
			// Note: Parent component will show error
		} finally {
			setSubmittingBug(false);
		}
	}, [bugTitleInput, bugInput, bugCategoryInput, submittingBug]);

	return {
		activeInfoTab,
		setActiveInfoTab,
		infoItems,
		loadingInfoItems,
		selectedInfo,
		setSelectedInfo,
		reportedBugs,
		loadingBugs,
		bugTitleInput,
		setBugTitleInput,
		bugInput,
		setBugInput,
		bugCategoryInput,
		setBugCategoryInput,
		submittingBug,
		bugReported,
		bugSubView,
		setBugSubView,
		handleSubmitBug,
		fetchInfos,
	};
}