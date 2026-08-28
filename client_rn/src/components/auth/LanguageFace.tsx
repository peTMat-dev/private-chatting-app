import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLanguageFace } from '../../hooks/useLanguageFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { LANGUAGES, t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = {
  onNavigate: (face: CubeFace) => void;
};

export default function LanguageFace({ onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const { showLangSelect, setShowLangSelect, handleLangChange } = useLanguageFace();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{tr.changeLanguage}</Text>
          <TouchableOpacity onPress={() => onNavigate('front')} activeOpacity={0.7}>
            <Text style={[styles.backLink, { color: theme.colors.green }]}>{tr.backToLogin}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.currentLangButton, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}
          onPress={() => setShowLangSelect(!showLangSelect)}
          activeOpacity={0.7}
        >
          <Text style={[styles.currentLangText, { color: theme.colors.text }]}>
            {LANGUAGES.find((l) => l.code === lang)?.label}
          </Text>
        </TouchableOpacity>

        {showLangSelect && (
          <ScrollView
            style={[styles.langList, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langItem,
                  {
                    backgroundColor: lang === l.code ? theme.colors.green15 : 'transparent',
                    borderBottomColor: theme.colors.green10,
                  },
                ]}
                onPress={() => handleLangChange(l.code)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langItemText,
                    { color: lang === l.code ? '#00FFFF' : theme.colors.green },
                  ]}
                >
                  {l.label}
                  {lang === l.code ? ' ✓' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 24, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700' },
  backLink: { fontSize: 14, fontWeight: '500' },
  currentLangButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: 180,
  },
  currentLangText: { fontSize: 14 },
  langList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 220,
  },
  langItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  langItemText: { fontSize: 14, fontWeight: '500' },
});