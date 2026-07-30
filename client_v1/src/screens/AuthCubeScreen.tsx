import { View, Text, StyleSheet } from "react-native";
import { CubeContainer } from "../components/cube/CubeContainer";
import { useCubeNavigation, CubeFace } from "../components/cube/useCubeNavigation";

/**
 * Placeholder face component — just a colored box with a label.
 * Will be replaced with real face components during full migration.
 */
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
  } = useCubeNavigation("front");

  const faces: Record<CubeFace, React.ReactNode> = {
    front: <PlaceholderFace label="Login" color="#1a2a1a" />,
    right: <PlaceholderFace label="Register" color="#1a1a2a" />,
    left: <PlaceholderFace label="Language" color="#2a1a1a" />,
    back: <PlaceholderFace label="Reset Password" color="#2a2a1a" />,
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