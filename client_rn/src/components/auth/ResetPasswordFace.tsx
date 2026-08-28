import React, { useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useResetPasswordFace } from '../../hooks/useResetPasswordFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = {
  resetToken: string;
  showToast: (message: { title: string; body: string }) => void;
  onNavigate: (face: CubeFace) => void;
};

export default function ResetPasswordFace({ resetToken, showToast, onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const emailRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const tokenConfirmRef = useRef<TextInput>(null);
  const {
    forgotEmail, setForgotEmail, loadingForgot, forgotDisabled,
    handleForgot, handleTokenReset, resetPassword, setResetPassword,
    resetConfirmPassword, setResetConfirmPassword, resetDisabled,
    resetSuccess, resetError,
  } = useResetPasswordFace(resetToken, showToast, () => onNavigate('front'));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.resetPassword}</Text>
            <TouchableOpacity onPress={() => onNavigate('front')} activeOpacity={0.7}>
              <Text style={[styles.backBtn, { color: theme.colors.green }]}>{tr.backToLogin}</Text>
            </TouchableOpacity>
          </View>

          {resetToken ? (
            <View style={styles.form}>
              <Text style={[styles.subheading, { color: theme.colors.textMuted }]}>{tr.enterNewPassword}</Text>
              {resetSuccess && (
                <View style={[styles.alert, { backgroundColor: theme.colors.successBg }]}>
                  <Text style={[styles.alertTitle, { color: theme.colors.background }]}>{tr.passwordUpdated}</Text>
                  <Text style={[styles.alertText, { color: theme.colors.background }]}>{tr.signInNewPassword}</Text>
                </View>
              )}
              {resetError && !resetSuccess && (
                <View style={[styles.alert, { backgroundColor: theme.colors.errorBg, borderColor: theme.colors.errorBorder, borderWidth: 1 }]}>
                  <Text style={[styles.alertTitle, { color: theme.colors.error }]}>{tr.resetFailed}</Text>
                  <Text style={[styles.alertText, { color: theme.colors.error }]}>{resetError}</Text>
                </View>
              )}
              <Text style={[styles.label, { color: theme.colors.text }]}>{tr.newPassword}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                value={resetPassword} onChangeText={setResetPassword}
                placeholder="••••••••" placeholderTextColor={theme.colors.textMuted}
                secureTextEntry returnKeyType="next"
                onSubmitEditing={() => tokenConfirmRef.current?.focus()}
              />
              <Text style={[styles.label, { color: theme.colors.text }]}>{tr.confirmPassword}</Text>
              <TextInput
                ref={tokenConfirmRef}
                style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                value={resetConfirmPassword} onChangeText={setResetConfirmPassword}
                placeholder="••••••••" placeholderTextColor={theme.colors.textMuted}
                secureTextEntry returnKeyType="go" onSubmitEditing={handleTokenReset}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.green, opacity: resetDisabled ? 0.5 : 1 }]}
                onPress={handleTokenReset} disabled={resetDisabled} activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>
                  {loadingForgot ? tr.updating : tr.resetPassword}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={[styles.subheading, { color: theme.colors.textMuted }]}>{tr.sendResetLinkPrompt}</Text>
              <Text style={[styles.label, { color: theme.colors.text }]}>{tr.email}</Text>
              <TextInput
                ref={emailRef}
                style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
                value={forgotEmail} onChangeText={setForgotEmail}
                placeholder="EMAIL@EXAMPLE.COM" placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none" keyboardType="email-address" returnKeyType="go"
                onSubmitEditing={handleForgot}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.green, opacity: forgotDisabled ? 0.5 : 1 }]}
                onPress={handleForgot} disabled={forgotDisabled} activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>
                  {loadingForgot ? tr.sending : tr.sendResetLink}
                </Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 24 },
  header: { marginBottom: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  backBtn: { fontSize: 14, fontWeight: '500' },
  subheading: { fontSize: 14, marginBottom: 12 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  alert: { borderRadius: 8, padding: 12, marginBottom: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  alertText: { fontSize: 12 },
});