import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

/**
 * Home Cube Screen
 * 
 * This will become the 3D cube with 6 faces:
 * - Front: Chats
 * - Left: Contacts
 * - Right: Settings
 * - Back: Messages
 * - Top: Info
 * - Bottom: Logout
 * 
 * Swipe gestures navigate between faces.
 * Logout navigates back to / (auth cube).
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CubCha</Text>
      <Text style={styles.subtitle}>Home Cube — placeholder</Text>
      <Text style={styles.hint}>
        This screen will become the 3D cube with Chats, Contacts, Settings,
        Messages, Info, and Logout faces.
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