import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useInfoFace } from '../../hooks/useInfoFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = { activeFace: string; onNavigate: (face: CubeFace) => void };

export default function InfoFace({ activeFace, onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const {
    activeInfoTab, setActiveInfoTab, infoItems, loadingInfoItems,
    reportedBugs, loadingBugs, bugReported, submittingBug,
    bugTitleInput, setBugTitleInput, bugInput, setBugInput, handleSubmitBug,
  } = useInfoFace(activeFace);

  const tabs = [
    { key: 'update', label: tr.whatsNew },
    { key: 'manual', label: tr.manual },
    { key: 'announcement', label: tr.announcements },
    { key: 'reported_bugs', label: tr.reportedBugs },
  ];

  const renderContent = () => {
    if (activeInfoTab === 'reported_bugs') {
      if (loadingBugs) return <Text style={[styles.loading, { color: theme.colors.green }]}>{tr.loadingInfo}</Text>;
      if (reportedBugs.length === 0) return <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{tr.noBugsReported}</Text>;
      return reportedBugs.map((bug) => (
        <View key={bug.bug_id} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.itemTitle, { color: theme.colors.green }]}>{bug.title}</Text>
          <Text style={[styles.itemMeta, { color: theme.colors.textMuted }]}>{bug.category} · {new Date(bug.created_at).toLocaleDateString()}</Text>
          <Text style={[styles.itemText, { color: theme.colors.text }]}>{bug.bug_description}</Text>
        </View>
      ));
    }
    if (loadingInfoItems) return <Text style={[styles.loading, { color: theme.colors.green }]}>{tr.loadingInfo}</Text>;
    if (infoItems.length === 0) return <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{tr.noInfoEntries}</Text>;
    return infoItems.map((item, i) => (
      <TouchableOpacity key={i} style={[styles.item, { borderBottomColor: theme.colors.border }]} onPress={() => setSelectedItem(item)} activeOpacity={0.7}>
        <Text style={[styles.itemTitle, { color: theme.colors.green }]}>{item.title}</Text>
        <Text style={[styles.itemMeta, { color: theme.colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </TouchableOpacity>
    ));
  };

  if (selectedItem) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.colors.panel }]}>
        <ScrollView style={styles.overlayContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.overlayTitle, { color: theme.colors.green }]}>{selectedItem.title}</Text>
          <Text style={[styles.overlayMeta, { color: theme.colors.textMuted }]}>{new Date(selectedItem.created_at).toLocaleDateString()}</Text>
          <Text style={[styles.overlayText, { color: theme.colors.text }]}>{selectedItem.content}</Text>
        </ScrollView>
        <TouchableOpacity style={[styles.overlayClose, { backgroundColor: theme.colors.green }]} onPress={() => setSelectedItem(null)} activeOpacity={0.7}>
          <Text style={[styles.overlayCloseText, { color: theme.colors.greenLabel }]}>{tr.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PLACEHOLDER_REST
}

// PLACEHOLDER_STYLES