import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CubeContainer } from "../src/components/cube/CubeContainer";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import {
  useCubeNavigation,
  type CubeFace,
} from "../src/lib/useCubeNavigation";
import LoginFace from "../src/components/auth/LoginFace";
import RegisterFace from "../src/components/auth/RegisterFace";
import ResetPasswordFace from "../src/components/auth/ResetPasswordFace";
import LanguageFace from "../src/components/auth/LanguageFace";
import AuthLogoutFace from "../src/components/auth/LogoutFace";
import AuthInfoFace from "../src/components/auth/InfoFace";
import { logout } from "../src/services/auth.service";
import { clearToken } from "../src/lib/api";
import { useTheme } from "../src/theme";
import { useLanguage } from "../src/lib/LanguageContext";
import { LANGUAGES, type LangCode } from "../src/lib/i18n";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setLang } = useLanguage();
  const { token, lang, source } = useLocalSearchParams<{ token?: string; lang?: string; source?: string }>();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Set language from URL param on mount (same as web client)
  useEffect(() => {
    if (lang && LANGUAGES.some(l => l.code === lang)) {
      setLang(lang as LangCode);
    }
  }, [lang, setLang]);

  // If source=app, try to redirect to the app via deep link
  useEffect(() => {
    if (source === "app" && token) {
      setRedirecting(true);
      const deepLink = `cubcha://reset-password?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang || "en")}`;
      window.location.href = deepLink;
      // If redirect fails (app not installed), show the form after a timeout
      const timeout = setTimeout(() => {
        setRedirecting(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [source, token, lang]);

  const {
    activeFace,
    rotationX,
    rotationY,
    goLeft,
    goRight,
    goDown,
    goUp,
    beginDrag,
    updateDrag,
    endDrag,
    setFace,
  } = useCubeNavigation("left");

  const handleLoginSuccess = useCallback(() => {
    Alert.alert("Login Successful", "Redirecting to home...");
    setTimeout(() => {
      router.push("/home");
    }, 1500);
  }, [router]);

  const handleLoggedOut = useCallback(async () => {
    await clearToken();
    try { await logout(); } catch {}
  }, []);

  const showToast = useCallback((message: { title: string; body: string }) => {
    setToast(message);
    setTimeout(() => setToast(null), 4500);
  }, []);

  const faces: Record<CubeFace, React.ReactNode> = {
    front: <LoginFace onLoginSuccess={handleLoginSuccess} onNavigate={setFace} />,
    right: <RegisterFace onNavigate={setFace} />,
    left: <ResetPasswordFace resetToken={token ?? ""} showToast={showToast} onNavigate={setFace} />,
    back: <LanguageFace onNavigate={setFace} />,
    top: <AuthLogoutFace onLogoutNavigate={goUp} onLoggedOut={handleLoggedOut} onNavigate={setFace} />,
    bottom: <AuthInfoFace activeFace={activeFace} onNavigate={setFace} />,
  };

  // Show loading state while redirecting to app
  if (redirecting) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.colors.text, fontSize: 16 }}>Opening app...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary fallbackLabel="Reset password screen crashed. Please try again.">
      <View style={styles.screen}>
        <CubeContainer
          faces={faces}
          rotationX={rotationX}
          rotationY={rotationY}
          goLeft={goLeft}
          goRight={goRight}
          goUp={goUp}
          goDown={goDown}
          beginDrag={beginDrag}
          updateDrag={updateDrag}
          endDrag={endDrag}
          activeFace={activeFace}
        />
        {toast && (
          <View style={styles.toastContainer}>
            <View style={[styles.toastBox, { backgroundColor: theme.colors.successBg }]}>
              <Text style={[styles.toastTitle, { color: theme.colors.greenLabel }]}>{toast.title}</Text>
              <Text style={[styles.toastBody, { color: theme.colors.greenLabel }]}>{toast.body}</Text>
            </View>
          </View>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  toastBox: {
    backgroundColor: "rgba(6, 236, 144, 0.95)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 360,
  },
  toastTitle: { color: "#020202", fontWeight: "700", fontSize: 13 },
  toastBody: { color: "#020202", fontSize: 12, marginTop: 2 },
});