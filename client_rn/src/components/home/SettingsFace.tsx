import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t, LANGUAGES, type LangCode } from '../../lib/i18n';
import type { UserSettings } from '../../lib/formTypes';
import type { ColorTheme } from '../../hooks/useSettingsFace';
import { PRESET_COLORS, DEFAULT_CUBE_COLOR } from '../../hooks/useSettingsFace';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
  settings: UserSettings | null;
  setSettings: Dispatch<SetStateAction<UserSettings | null>>;
  settingsError: string | null;
  savingSettings: boolean;
  settingsSaved: boolean;
  handleSaveSettings: () => void;
  timezones: Array<{ timezone_name: string; display_name: string }>;
  lang: LangCode;
  showLangSelect: boolean; setShowLangSelect: Dispatch<SetStateAction<boolean>>;
  handleLangChange: (code: LangCode) => void;
  showMaxParticipantsSelect: boolean; setShowMaxParticipantsSelect: Dispatch<SetStateAction<boolean>>;
  showTimezoneSelect: boolean; setShowTimezoneSelect: Dispatch<SetStateAction<boolean>>;
  showThemeSelect: boolean; setShowThemeSelect: Dispatch<SetStateAction<boolean>>;
  handleThemeChange: (theme: ColorTheme) => void;
  showColorPicker: boolean; setShowColorPicker: Dispatch<SetStateAction<boolean>>;
  handleCubeColorChange: (color: string) => void;
  handleColorDoubleTap: (color: string) => void;
};

export default function SettingsFace(props: Props) {
  const {
    settings, setSettings, settingsError, savingSettings, settingsSaved, handleSaveSettings,
    timezones, lang, showLangSelect, setShowLangSelect, handleLangChange,
    showMaxParticipantsSelect, setShowMaxParticipantsSelect,
    showTimezoneSelect, setShowTimezoneSelect,
    showThemeSelect, setShowThemeSelect, handleThemeChange,
    showColorPicker, setShowColorPicker, handleCubeColorChange, handleColorDoubleTap,
  } = props;
  const { lang: ctxLang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(ctxLang), [ctxLang]);
  const [customColor, setCustomColor] = useState('');
  const currentColor = settings?.cube_color || DEFAULT_CUBE_COLOR;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.userSettings}</Text>

          {settingsError && !settings ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{tr.couldNotLoadSettings}</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{settingsError}</Text>
            </View>
          ) : !settings ? (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{tr.loadingSettings}</Text>
          ) : (
            <View style={styles.form}>
              {settingsSaved && (
                <View style={[styles.alert, { backgroundColor: theme.colors.successBg }]}>
                  <Text style={[styles.alertText, { color: theme.colors.greenLabel }]}>{tr.settingsSaved} {tr.settingsSavedMsg}</Text>
                </View>
              )}
              {settingsError && (
                <View style={[styles.alert, { backgroundColor: theme.colors.errorBg }]}>
                  <Text style={[styles.alertText, { color: theme.colors.error }]}>{settingsError}</Text>
                </View>
              )}

              {/* Language */}
              <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setShowLangSelect(!showLangSelect)} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.language}</Text>
                <Text style={[styles.value, { color: theme.colors.green }]}>
                  {LANGUAGES.find((l) => l.code === lang)?.label || lang} {'\u25BC'}
                </Text>
              </TouchableOpacity>
              {showLangSelect && (
                <View style={[styles.dropdown, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                  {LANGUAGES.map((l) => (
                    <TouchableOpacity key={l.code} style={[styles.dropItem, lang === l.code && { backgroundColor: theme.colors.green15 }]}
                      onPress={() => handleLangChange(l.code)} activeOpacity={0.7}>
                      <Text style={[styles.dropText, { color: theme.colors.green }]}>{l.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Max participants */}
              <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setShowMaxParticipantsSelect(!showMaxParticipantsSelect)} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.maxChatParticipants}</Text>
                <Text style={[styles.value, { color: theme.colors.green }]}>{settings.default_max_chat_participants} {'\u25BC'}</Text>
              </TouchableOpacity>
              {showMaxParticipantsSelect && (
                <View style={[styles.dropdown, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                  {[2,5,10,15,20,30,50].map((n) => (
                    <TouchableOpacity key={n} style={[styles.dropItem, settings.default_max_chat_participants === n && { backgroundColor: theme.colors.green15 }]}
                      onPress={() => { setSettings({ ...settings, default_max_chat_participants: n }); setShowMaxParticipantsSelect(false); }} activeOpacity={0.7}>
                      <Text style={[styles.dropText, { color: theme.colors.green }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Timezone */}
              <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setShowTimezoneSelect(!showTimezoneSelect)} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.timezone}</Text>
                <Text style={[styles.value, { color: theme.colors.green }]} numberOfLines={1}>
                  {timezones.find((tz) => tz.timezone_name === settings.user_timezone)?.display_name || settings.user_timezone} {'\u25BC'}
                </Text>
              </TouchableOpacity>
              {showTimezoneSelect && (
                <ScrollView style={[styles.dropdown, { maxHeight: 150, backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                  {timezones.map((tz) => (
                    <TouchableOpacity key={tz.timezone_name} style={[styles.dropItem, settings.user_timezone === tz.timezone_name && { backgroundColor: theme.colors.green15 }]}
                      onPress={() => { setSettings({ ...settings, user_timezone: tz.timezone_name }); setShowTimezoneSelect(false); }} activeOpacity={0.7}>
                      <Text style={[styles.dropText, { color: theme.colors.green }]} numberOfLines={1}>{tz.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Theme */}
              <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setShowThemeSelect(!showThemeSelect)} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.colorTheme}</Text>
                <Text style={[styles.value, { color: theme.colors.green }]}>
                  {settings.system_color_theme === 'light' ? tr.lightTheme : tr.darkTheme} {'\u25BC'}
                </Text>
              </TouchableOpacity>
              {showThemeSelect && (
                <View style={[styles.dropdown, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                  {(['dark', 'light'] as const).map((t) => (
                    <TouchableOpacity key={t} style={[styles.dropItem, settings.system_color_theme === t && { backgroundColor: theme.colors.green15 }]}
                      onPress={() => handleThemeChange(t)} activeOpacity={0.7}>
                      <Text style={[styles.dropText, { color: theme.colors.green }]}>{t === 'dark' ? tr.darkTheme : tr.lightTheme}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Cube color */}
              <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.green10 }]}
                onPress={() => setShowColorPicker(!showColorPicker)} activeOpacity={0.7}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.cubeColor}</Text>
                <View style={styles.colorRow}>
                  <View style={[styles.colorSwatch, { backgroundColor: currentColor, borderColor: theme.colors.border }]} />
                  <Text style={[styles.value, { color: theme.colors.green }]}>{currentColor} {'\u25BC'}</Text>
                </View>
              </TouchableOpacity>
              {showColorPicker && (
                <View style={[styles.colorGrid, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
                  {PRESET_COLORS.map((c) => (
                    <TouchableOpacity key={c.hex}
                      style={[styles.colorBtn, { backgroundColor: c.hex, borderColor: c.hex === currentColor ? '#fff' : 'transparent' }]}
                      onPress={() => handleCubeColorChange(c.hex)} activeOpacity={0.7} />
                  ))}
                  <View style={styles.customRow}>
                    <TextInput style={[styles.customInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                      value={customColor} onChangeText={setCustomColor} placeholder={tr.enterHexColor} placeholderTextColor={theme.colors.textMuted} />
                    <TouchableOpacity style={[styles.customBtn, { borderColor: theme.colors.border }]}
                      onPress={() => {
                        let color = customColor.trim();
                        if (!color.startsWith('#')) color = '#' + color;
                        if (/^#[0-9A-Fa-f]{6}$/.test(color)) { handleCubeColorChange(color); setCustomColor(''); }
                      }} activeOpacity={0.7}>
                      <Text style={[styles.customBtnText, { color: theme.colors.green }]}>{'\u2713'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Checkboxes */}
              <TouchableOpacity style={styles.checkRow}
                onPress={() => setSettings({ ...settings, public_st: !settings.public_st })} activeOpacity={0.7}>
                <Text style={[styles.check, { color: theme.colors.green }]}>{settings.public_st ? '\u2611' : '\u2610'}</Text>
                <Text style={[styles.checkLabel, { color: theme.colors.text }]}>{tr.makeProfilePublic}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkRow}
                onPress={() => setSettings({ ...settings, can_be_added_to_contacts: !settings.can_be_added_to_contacts })} activeOpacity={0.7}>
                <Text style={[styles.check, { color: theme.colors.green }]}>{settings.can_be_added_to_contacts ? '\u2611' : '\u2610'}</Text>
                <Text style={[styles.checkLabel, { color: theme.colors.text }]}>{tr.allowContactRequests}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.green08, borderColor: theme.colors.green30, opacity: savingSettings ? 0.5 : 1 }]}
                onPress={handleSaveSettings} disabled={savingSettings} activeOpacity={0.7}>
                <Text style={[styles.saveBtnText, { color: theme.colors.green }]}>{savingSettings ? tr.saving : tr.saveSettings}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  form: { gap: 0 },
  alert: { borderRadius: 8, padding: 8, marginBottom: 8 },
  alertText: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 13, flexShrink: 1, textAlign: 'right', maxWidth: '50%' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorSwatch: { width: 16, height: 16, borderRadius: 3, borderWidth: 1 },
  dropdown: { borderWidth: 1, borderRadius: 8, marginTop: 4, marginBottom: 4 },
  dropItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropText: { fontSize: 13 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, borderWidth: 1, borderRadius: 8, marginTop: 4, marginBottom: 4 },
  colorBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 2 },
  customRow: { flexDirection: 'row', gap: 6, width: '100%', marginTop: 4 },
  customInput: { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12 },
  customBtn: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1 },
  customBtnText: { fontSize: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  check: { fontSize: 18 },
  checkLabel: { fontSize: 13, flex: 1 },
  saveBtn: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, marginTop: 12 },
  saveBtnText: { fontSize: 14, fontWeight: '600' },
});
