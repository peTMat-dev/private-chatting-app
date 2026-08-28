import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { CubeContainer } from "../src/components/cube/CubeContainer";
import {
  useCubeNavigation,
  type CubeFace,
} from "../src/lib/useCubeNavigation";
import LoginFace from "../src/components/auth/LoginFace";

function PlaceholderFace({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.placeholderFace, { backgroundColor: color }]}>
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

export default function AuthCubeScreen() {
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

  const handleLoginSuccess = () => {
    Alert.alert("Login Successful", "Redirecting to home...");
  };

  const faces: Record<CubeFace, React.ReactNode> = {
    front: <LoginFace onLoginSuccess={handleLoginSuccess} onNavigate={setFace} />,
    right: <PlaceholderFace label="Register" color="#1a1a2a" />,
    left: <PlaceholderFace label="Reset Password" color="#2a2a1a" />,
    back: <PlaceholderFace label="Language" color="#2a1a1a" />,
    top: <PlaceholderFace label="Logout" color="#1a2a2a" />,
    bottom: <PlaceholderFace label="Info" color="#2a1a2a" />,
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  placeholderFace: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#67c6a0",
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
});