import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLoginFace } from '../../hooks/useLoginFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = {
  onLoginSuccess: () => void;
  onNavigate: (face: CubeFace) => void;
};

export default function LoginFace({ onLoginSuccess, onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const passwordRef = useRef<TextInput>(null);
  const {
    loginForm,
    setLoginForm,
    loginDisabled,
    loadingLogin,
    loginSuccess,
    loginError,
    handleLogin,
  } = useLoginFace({ onSuccess: onLoginSuccess });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <View style={styles.hero}>
            <View style={[styles.statusPill, { backgroundColor: theme.colors.green10 }]}>
              <Text style={[styles.statusText, { color: theme.colors.green }]}>{tr.mobileAuth}</Text>
            </View>
            <Text style={[styles.heading, { color: theme.colors.text }]}>CubCha v1.0</Text>
            <Text style={[styles.subtext, { color: theme.colors.textMuted }]}>{tr.appSubtext}</Text>
          </View>
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{tr.username}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
              value={loginForm.username}
              onChangeText={(text) => setLoginForm((prev) => ({ ...prev, username: text }))}
              placeholder={tr.enterLdapId}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Text style={[styles.label, { color: theme.colors.text }]}>{tr.password}</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
              value={loginForm.password}
              onChangeText={(text) => setLoginForm((prev) => ({ ...prev, password: text }))}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.green, opacity: loginDisabled ? 0.5 : 1 }]}
              onPress={handleLogin}
              disabled={loginDisabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>
                {loadingLogin ? tr.authenticating : tr.signIn}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.links}>
            <TouchableOpacity onPress={() => onNavigate('left')} activeOpacity={0.7}>
              <Text style={[styles.linkText, { color: theme.colors.green }]}>{tr.forgotPassword}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('right')} activeOpacity={0.7}>
              <Text style={[styles.linkText, { color: theme.colors.green }]}>{tr.signUp}</Text>
            </TouchableOpacity>
          </View>
          {loginSuccess && (
            <View style={[styles.alert, { backgroundColor: theme.colors.successBg }]}>
              <Text style={[styles.alertTitle, { color: theme.colors.background }]}>{tr.loginSuccess}</Text>
              <Text style={[styles.alertText, { color: theme.colors.background }]}>{tr.redirectingHome}</Text>
            </View>
          )}
          {loginError && (
            <View style={[styles.alert, { backgroundColor: theme.colors.errorBg, borderColor: theme.colors.errorBorder, borderWidth: 1 }]}>
              <Text style={[styles.alertTitle, { color: theme.colors.error }]}>{tr.loginFailed}</Text>
              <Text style={[styles.alertText, { color: theme.colors.error }]}>{loginError}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 24 },
  hero: { alignItems: 'center', marginBottom: 24 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtext: { fontSize: 14, textAlign: 'center' },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  linkText: { fontSize: 14, fontWeight: '500' },
  alert: { borderRadius: 8, padding: 12, marginTop: 16 },
  alertTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  alertText: { fontSize: 12 },
});