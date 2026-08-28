import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';

type Props = {
  handleLogout: () => void;
  goUp: () => void;
};

export default function HomeLogoutFace({ handleLogout, goUp }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.logout}</Text>
        <Text style={[styles.copy, { color: theme.colors.textMuted }]}>{tr.logoutPrompt}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.green }]}
          onPress={handleLogout} activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>{tr.logOut}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, { borderColor: theme.colors.border }]}
          onPress={goUp} activeOpacity={0.7}
        >
          <Text style={[styles.ghostText, { color: theme.colors.text }]}>{tr.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  copy: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  ghostBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, borderWidth: 1, width: '100%', alignItems: 'center', marginTop: 4 },
  ghostText: { fontSize: 14, fontWeight: '500' },
});
