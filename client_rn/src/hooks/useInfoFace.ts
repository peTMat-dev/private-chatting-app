import { useState, useCallback, useEffect } from 'react';
import { getApi, fetchApiCustom } from '../services/api.service';
import { t } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import type { InfoItem, ReportedBug, InfoTab } from '../lib/formTypes';

export interface UseInfoFaceReturn {
  activeInfoTab: InfoTab;
  setActiveInfoTab: (tab: InfoTab) => void;
  infoItems: InfoItem[];
  loadingInfoItems: boolean;
  selectedInfo: InfoItem | null;
  setSelectedInfo: (item: InfoItem | null) => void;
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
  bugSubView: 'list' | 'report';
  setBugSubView: (view: 'list' | 'report') => void;
  handleSubmitBug: () => Promise<void>;
  fetchInfos: () => Promise<void>;
}

export function useInfoFace(activeFace: string): UseInfoFaceReturn {
  const { lang } = useLanguage();
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>('update');
  const [infoItems, setInfoItems] = useState<InfoItem[]>([]);
  const [loadingInfoItems, setLoadingInfoItems] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null);
  const [reportedBugs, setReportedBugs] = useState<ReportedBug[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [bugTitleInput, setBugTitleInput] = useState('');
  const [bugInput, setBugInput] = useState('');
  const [bugCategoryInput, setBugCategoryInput] = useState('Other');
  const [submittingBug, setSubmittingBug] = useState(false);
  const [bugReported, setBugReported] = useState(false);
  const [bugSubView, setBugSubView] = useState<'list' | 'report'>('list');

  useEffect(() => {
    if (activeFace !== 'bottom') return;
    fetchInfos();
  }, [activeFace, activeInfoTab, lang, reportedBugs.length]);

  const fetchInfos = useCallback(async () => {
    if (activeInfoTab === 'reported_bugs') {
      if (reportedBugs.length > 0) return;
      setLoadingBugs(true);
      try {
        interface BugsResponse { success: boolean; data?: ReportedBug[] }
        const d = await getApi<BugsResponse>('/infos/reported-bugs');
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
      interface InfoResponse { success: boolean; data?: InfoItem[] }
      const d = await getApi<InfoResponse>(`/infos?category=${activeInfoTab}&language_code=${lang}`);
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
      interface ReportBugResponse { success: boolean; error?: string }
      await fetchApiCustom<ReportBugResponse>('/infos/report-bug', {
        method: 'POST',
        body: JSON.stringify({
          title: bugTitleInput.trim(),
          description: bugInput.trim(),
          category: bugCategoryInput,
        }),
      });
      setBugTitleInput('');
      setBugInput('');
      setBugCategoryInput('Other');
      setBugReported(true);
      setReportedBugs([]);
      setTimeout(() => setBugReported(false), 4000);
    } catch {
      // Ignore errors
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