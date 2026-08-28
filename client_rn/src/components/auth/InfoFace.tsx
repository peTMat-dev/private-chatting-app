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
        <Text style={[styles.itemTitle, { color: theme.colors.green }]}>{item.heading_cube}</Text>
        <Text style={[styles.itemMeta, { color: theme.colors.textMuted }]}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
      </TouchableOpacity>
    ));
  };

  if (selectedItem) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.colors.panel }]}>
        <ScrollView style={styles.overlayContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.overlayTitle, { color: theme.colors.green }]}>{selectedItem.heading_cube}</Text>
          <Text style={[styles.overlayMeta, { color: theme.colors.textMuted }]}>{new Date(selectedItem.created_at).toLocaleDateString()}</Text>
          {selectedItem.descriptions ? (
            selectedItem.descriptions.map((d: string, idx: number) => (
              <Text key={idx} style={[styles.overlayText, { color: theme.colors.text }]}>• {d}</Text>
            ))
          ) : (
            <Text style={[styles.overlayText, { color: theme.colors.text }]}>{selectedItem.text_description}</Text>
          )}
        </ScrollView>
        <TouchableOpacity style={[styles.overlayClose, { backgroundColor: theme.colors.green }]} onPress={() => setSelectedItem(null)} activeOpacity={0.7}>
          <Text style={[styles.overlayCloseText, { color: theme.colors.greenLabel }]}>{tr.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.infoFace}</Text>
          <TouchableOpacity onPress={() => onNavigate('front')} activeOpacity={0.7}>
            <Text style={[styles.backBtn, { color: theme.colors.green }]}>{tr.back}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { borderBottomColor: activeInfoTab === tab.key ? theme.colors.green : 'transparent' }]}
              onPress={() => setActiveInfoTab(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeInfoTab === tab.key ? theme.colors.green : theme.colors.textMuted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  card: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 16, margin: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: '700' },
  backBtn: { fontSize: 14, fontWeight: '500' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, borderBottomWidth: 2, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '500' },
  content: { flex: 1 },
  loading: { padding: 20, textAlign: 'center', fontSize: 14 },
  empty: { padding: 20, textAlign: 'center', fontSize: 14 },
  item: { padding: 10, borderBottomWidth: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemMeta: { fontSize: 11, marginBottom: 4 },
  itemText: { fontSize: 12 },
  overlay: { flex: 1, borderRadius: 12, padding: 16 },
  overlayContent: { flex: 1 },
  overlayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  overlayMeta: { fontSize: 12, marginBottom: 12 },
  overlayText: { fontSize: 14, lineHeight: 22, marginBottom: 6 },
  overlayClose: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  overlayCloseText: { fontSize: 16, fontWeight: '600' },
});