import React, { useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRegisterFace } from '../../hooks/useRegisterFace';
import { useLanguage } from '../../lib/LanguageContext';
import { useTheme } from '../../theme';
import { t } from '../../lib/i18n';
import type { CubeFace } from '../../lib/useCubeNavigation';

type Props = { onNavigate: (face: CubeFace) => void };

export default function RegisterFace({ onNavigate }: Props) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const tr = useMemo(() => t(lang), [lang]);
  const lastNameRef = useRef<TextInput>(null);
  const displayNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const {
    registerForm, setRegisterForm, registerDisabled,
    loadingRegister, registerErrors, registrationSuccess, handleRegister,
  } = useRegisterFace();
  const inp = [styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.text }];
  const set = (k: string) => (v: string) => setRegisterForm((p) => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>{tr.register}</Text>
            <TouchableOpacity onPress={() => onNavigate('front')} activeOpacity={0.7}>
              <Text style={[styles.backBtn, { color: theme.colors.green }]}>{tr.backToLogin}</Text>
            </TouchableOpacity>
          </View>
          {registerErrors && registerErrors.length > 0 && (
            <View style={[styles.alert, { backgroundColor: theme.colors.errorBg, borderColor: theme.colors.errorBorder, borderWidth: 1 }]}>
              {registerErrors.map((e, i) => <Text key={i} style={[styles.errorText, { color: theme.colors.error }]}>{e}</Text>)}
            </View>
          )}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.firstName}</Text>
                <TextInput style={inp} value={registerForm.firstName} onChangeText={set('firstName')}
                  returnKeyType="next" onSubmitEditing={() => lastNameRef.current?.focus()} />
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.lastName}</Text>
                <TextInput ref={lastNameRef} style={inp} value={registerForm.lastName} onChangeText={set('lastName')}
                  returnKeyType="next" onSubmitEditing={() => displayNameRef.current?.focus()} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.displayName}</Text>
                <TextInput ref={displayNameRef} style={inp} value={registerForm.displayName} onChangeText={set('displayName')}
                  placeholder={tr.visibleInChat} placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="next" onSubmitEditing={() => usernameRef.current?.focus()} />
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.username}</Text>
                <TextInput ref={usernameRef} style={inp} value={registerForm.username} onChangeText={set('username')}
                  placeholder={tr.ldapUid} placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
              </View>
            </View>
            <Text style={[styles.label, { color: theme.colors.text }]}>{tr.email}</Text>
            <TextInput ref={emailRef} style={inp} value={registerForm.email} onChangeText={set('email')}
              placeholder={tr.emailForNotifications} placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none" keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.password}</Text>
                <TextInput ref={passwordRef} style={inp} value={registerForm.password} onChangeText={set('password')}
                  secureTextEntry returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, { color: theme.colors.text }]}>{tr.confirm}</Text>
                <TextInput ref={confirmRef} style={inp} value={registerForm.confirmPassword} onChangeText={set('confirmPassword')}
                  secureTextEntry returnKeyType="go" onSubmitEditing={handleRegister} />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.green, opacity: registerDisabled ? 0.5 : 1 }]}
              onPress={handleRegister} disabled={registerDisabled} activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.greenLabel }]}>
                {loadingRegister ? tr.submitting : tr.submitRequest}
              </Text>
            </TouchableOpacity>
          </View>
          {registrationSuccess && (
            <View style={[styles.alert, { backgroundColor: theme.colors.successBg, marginTop: 12 }]}>
              <Text style={[styles.successTitle, { color: theme.colors.background }]}>{tr.registrationSuccess}</Text>
              <Text style={[styles.successText, { color: theme.colors.background }]}>{tr.redirectingLogin}</Text>
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
  card: { width: '100%', maxWidth: 380, borderRadius: 12, borderWidth: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 20, fontWeight: '700' },
  backBtn: { fontSize: 14, fontWeight: '500' },
  form: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginBottom: 8 },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  alert: { borderRadius: 8, padding: 12, marginBottom: 8 },
  errorText: { fontSize: 13, marginBottom: 2 },
  successTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  successText: { fontSize: 12 },
});
