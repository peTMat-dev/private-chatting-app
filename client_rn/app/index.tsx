import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

/**
 * Auth Cube Screen
 * 
 * This will become the 3D cube with 6 faces:
 * - Front: Login
 * - Left: Register
 * - Right: Reset Password
 * - Back: (unused/reserved)
 * - Top: Language
 * - Bottom: Info
 * 
 * Swipe gestures navigate between faces.
 * On successful login, navigates to /home.
 */
export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CubCha</Text>
      <Text style={styles.subtitle}>Auth Cube — placeholder</Text>
      <Text style={styles.hint}>
        This screen will become the 3D cube with Login, Register, Reset Password,
        Language, and Info faces.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e0e0e0",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#a0a0a0",
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});