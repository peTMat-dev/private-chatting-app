import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { CubeContainer } from "../src/components/cube/CubeContainer";
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

export default function AuthCubeScreen() {
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

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
  } = useCubeNavigation("front");

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
    left: <ResetPasswordFace resetToken="" showToast={showToast} onNavigate={setFace} />,
    back: <LanguageFace onNavigate={setFace} />,
    top: <AuthLogoutFace onLogoutNavigate={goUp} onLoggedOut={handleLoggedOut} onNavigate={setFace} />,
    bottom: <AuthInfoFace activeFace={activeFace} onNavigate={setFace} />,
  };

  return (
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
          <View style={styles.toastBox}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastBody}>{toast.body}</Text>
          </View>
        </View>
      )}
    </View>
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