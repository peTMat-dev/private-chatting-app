import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLogoutFace } from '../../hooks/useLogoutFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = {
  onLogoutNavigate: () => void;
  onLoggedOut: () => void;
  onNavigate: (face: CubeFace) => void;
};

export default function AuthLogoutFace({ onLogoutNavigate, onLoggedOut, onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const { handleLogout } = useLogoutFace({
    goUp: onLogoutNavigate,
    goLeft: onLogoutNavigate,
    onLoggedOut,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{tr.logout}</Text>
        <Text style={[styles.prompt, { color: theme.colors.textMuted }]}>{tr.logoutPrompt}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.green }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>{tr.logOut}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onNavigate('front')}
          activeOpacity={0.7}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: theme.colors.green }]}>{tr.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 24, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  prompt: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  cancelButton: { marginTop: 16 },
  cancelText: { fontSize: 14, fontWeight: '500' },
});