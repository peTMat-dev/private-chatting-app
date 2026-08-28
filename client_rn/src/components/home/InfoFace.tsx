import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t, type LangCode } from '../../lib/i18n';
import type { InfoItem, ReportedBug, InfoTab } from '../../lib/formTypes';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
  activeInfoTab: InfoTab;
  setActiveInfoTab: Dispatch<SetStateAction<InfoTab>>;
  infoItems: InfoItem[];
  loadingInfoItems: boolean;
  selectedInfo: InfoItem | null;
  setSelectedInfo: Dispatch<SetStateAction<InfoItem | null>>;
  reportedBugs: ReportedBug[];
  loadingBugs: boolean;
  bugTitleInput: string;
  setBugTitleInput: Dispatch<SetStateAction<string>>;
  bugInput: string;
  setBugInput: Dispatch<SetStateAction<string>>;
  bugCategoryInput: string;
  setBugCategoryInput: Dispatch<SetStateAction<string>>;
  submittingBug: boolean;
  bugReported: boolean;
  bugSubView: 'list' | 'report';
  setBugSubView: Dispatch<SetStateAction<'list' | 'report'>>;
  handleSubmitBug: () => void;
  lang: LangCode;
  goDown: () => void;
};

const TABS: { key: InfoTab; labelKey: keyof ReturnType<typeof t> }[] = [
  { key: 'update', labelKey: 'whatsNew' },
  { key: 'manual', labelKey: 'manual' },
  { key: 'announcement', labelKey: 'announcements' },
  { key: 'reported_bugs', labelKey: 'reportedBugs' },
];
const BUG_CATS = ['UI', 'Functionality', 'Performance', 'Security', 'Other'];

export default function HomeInfoFace(props: Props) {
  const {
    activeInfoTab, setActiveInfoTab, infoItems, loadingInfoItems, selectedInfo, setSelectedInfo,
    reportedBugs, loadingBugs, bugTitleInput, setBugTitleInput, bugInput, setBugInput,
    bugCategoryInput, setBugCategoryInput, submittingBug, bugReported, bugSubView, setBugSubView,
    handleSubmitBug, goDown,
  } = props;
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        {/* Info overlay */}
        {selectedInfo && (
          <View style={[styles.overlay, { backgroundColor: theme.colors.panel }]}>
            <View style={styles.overlayHeader}>
              <Text style={[styles.overlayTitle, { color: theme.colors.green }]} numberOfLines={2}>{selectedInfo.heading_cube}</Text>
              <TouchableOpacity style={[styles.closeBtn, { borderColor: theme.colors.border }]}
                onPress={() => setSelectedInfo(null)} activeOpacity={0.7}>
                <Text style={{ color: theme.colors.text, fontSize: 14 }}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            {selectedInfo.created_at && (
              <Text style={[styles.dateText, { color: theme.colors.green }]}>
                {new Date(selectedInfo.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedInfo.descriptions ? (
                selectedInfo.descriptions.map((d, i) => (
                  <Text key={i} style={[styles.descItem, { color: theme.colors.green, borderBottomColor: theme.colors.green10 }]}>{d}</Text>
                ))
              ) : selectedInfo.text_description ? (
                <Text style={[styles.descText, { color: theme.colors.green }]}>{selectedInfo.text_description}</Text>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={[styles.closeBtn, { borderColor: theme.colors.border, alignSelf: 'center', marginTop: 8 }]}
              onPress={() => setSelectedInfo(null)} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.text }]}>{tr.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.key}
              style={[styles.tab, activeInfoTab === tab.key && { backgroundColor: theme.colors.green15, borderBottomColor: theme.colors.green, borderBottomWidth: 2 }]}
              onPress={() => setActiveInfoTab(tab.key)} activeOpacity={0.7}>
              <Text style={[styles.tabText, { color: activeInfoTab === tab.key ? theme.colors.green : theme.colors.green50 }]}>
                {tr[tab.labelKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bug report sub-tabs */}
        {activeInfoTab === 'reported_bugs' && (
          <View style={styles.bugTabs}>
            <TouchableOpacity style={[styles.bugTab, bugSubView === 'list' && { borderBottomColor: theme.colors.green, borderBottomWidth: 2 }]}
              onPress={() => setBugSubView('list')} activeOpacity={0.7}>
              <Text style={[styles.bugTabText, { color: bugSubView === 'list' ? theme.colors.green : theme.colors.green50 }]}>{tr.reportedBugs}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bugTab, bugSubView === 'report' && { borderBottomColor: theme.colors.green, borderBottomWidth: 2 }]}
              onPress={() => setBugSubView('report')} activeOpacity={0.7}>
              <Text style={[styles.bugTabText, { color: bugSubView === 'report' ? theme.colors.green : theme.colors.green50 }]}>{tr.reportBug}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeInfoTab === 'reported_bugs' ? (
            bugSubView === 'report' ? (
              <View style={styles.bugForm}>
                {bugReported && <Text style={[styles.successText, { color: theme.colors.green }]}>{tr.bugReported}</Text>}
                <TextInput style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                  value={bugTitleInput} onChangeText={setBugTitleInput} placeholder={tr.bugTitle} placeholderTextColor={theme.colors.textMuted} maxLength={64} />
                <TextInput style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }, styles.textarea]}
                  value={bugInput} onChangeText={setBugInput} placeholder={tr.bugDescription} placeholderTextColor={theme.colors.textMuted} maxLength={256} multiline />
                <View style={styles.catRow}>
                  {BUG_CATS.map((cat) => (
                    <TouchableOpacity key={cat}
                      style={[styles.catBtn, bugCategoryInput === cat && { backgroundColor: theme.colors.green20, borderColor: theme.colors.green }]}
                      onPress={() => setBugCategoryInput(cat)} activeOpacity={0.7}>
                      <Text style={[styles.catText, { color: bugCategoryInput === cat ? theme.colors.green : theme.colors.green50 }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30, opacity: submittingBug ? 0.5 : 1 }]}
                  onPress={handleSubmitBug} disabled={submittingBug} activeOpacity={0.7}>
                  <Text style={[styles.submitText, { color: theme.colors.green }]}>{submittingBug ? tr.submittingBug : tr.submitBug}</Text>
                </TouchableOpacity>
              </View>
            ) : loadingBugs ? (
              <Text style={[styles.loadingText, { color: theme.colors.green }]}>{tr.loadingInfo}</Text>
            ) : reportedBugs.length === 0 ? (
              <Text style={[styles.loadingText, { color: theme.colors.green }]}>{tr.noBugsReported}</Text>
            ) : (
              reportedBugs.map((bug) => (
                <View key={bug.bug_id} style={[styles.bugItem, { borderBottomColor: theme.colors.green10 }]}>
                  <Text style={[styles.bugMeta, { color: theme.colors.green }]}>
                    {bug.display_name || tr.anonymized} \u00b7 {new Date(bug.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.bugTitle, { color: theme.colors.green }]}>{bug.title}</Text>
                  <Text style={[styles.bugCat, { color: theme.colors.green }]}>{bug.category}</Text>
                  <Text style={[styles.bugDesc, { color: theme.colors.green }]}>{bug.bug_description}</Text>
                </View>
              ))
            )
          ) : loadingInfoItems ? (
            <Text style={[styles.loadingText, { color: theme.colors.green }]}>{tr.loadingInfo}</Text>
          ) : infoItems.length === 0 ? (
            <Text style={[styles.loadingText, { color: theme.colors.green }]}>{tr.noInfoEntries}</Text>
          ) : (
            infoItems.map((item) => (
              <TouchableOpacity key={item.heading_cube} style={[styles.infoRow, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setSelectedInfo(item)} activeOpacity={0.7}>
                <Text style={[styles.infoName, { color: theme.colors.green }]} numberOfLines={1}>{item.heading_cube}</Text>
                <Text style={[styles.infoDate, { color: theme.colors.green }]}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} \u203a
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={goDown} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>{tr.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, overflow: 'hidden', maxHeight: 520, position: 'relative' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, padding: 16, borderRadius: 12 },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  overlayTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  closeText: { fontSize: 12 },
  dateText: { fontSize: 11, marginBottom: 8 },
  descItem: { fontSize: 13, paddingVertical: 6, borderBottomWidth: 1 },
  descText: { fontSize: 13, lineHeight: 20 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(3,160,98,0.15)' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '600' },
  bugTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(3,160,98,0.1)' },
  bugTab: { flex: 1, paddingVertical: 6, alignItems: 'center' },
  bugTabText: { fontSize: 11, fontWeight: '500' },
  content: { maxHeight: 300 },
  bugForm: { padding: 12, gap: 8 },
  successText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(3,160,98,0.3)' },
  catText: { fontSize: 11 },
  submitBtn: { borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  submitText: { fontSize: 13, fontWeight: '600' },
  bugItem: { padding: 12, borderBottomWidth: 1 },
  bugMeta: { fontSize: 10, marginBottom: 2 },
  bugTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2, textDecorationLine: 'underline' },
  bugCat: { fontSize: 10, marginBottom: 2 },
  bugDesc: { fontSize: 12 },
  loadingText: { fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  infoName: { fontSize: 13, flex: 1 },
  infoDate: { fontSize: 11, marginLeft: 8 },
  cancelBtn: { borderRadius: 8, paddingVertical: 8, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 12 },
});
