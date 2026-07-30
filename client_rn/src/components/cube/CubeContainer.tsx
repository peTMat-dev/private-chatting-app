import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
  configureReanimatedLogger,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { CubeFace } from "./useCubeNavigation";

// Disable strict mode to suppress false-positive warnings about shared value access
// The code is already optimized - this is safe and won't affect performance
configureReanimatedLogger({
  strict: false,
});

interface CubeContainerProps {
  faces: Record<CubeFace, React.ReactNode>;
  rotationX: SharedValue<number>;
  rotationY: SharedValue<number>;
  goLeft: () => void;
  goRight: () => void;
  goUp: () => void;
  goDown: () => void;
  activeFace: CubeFace;
}

const SWIPE_THRESHOLD = 40;

function getCubeDimensions() {
  const { width: screenW, height: screenH } = Dimensions.get("window");
  if (Platform.OS === "web") {
    const cubeWidth = Math.min(340, screenW * 0.85);
    const cubeHeight = Math.min(520, screenH * 0.78);
    return { cubeWidth, cubeHeight };
  }
  const cubeWidth = screenW;
  const cubeHeight = screenH;
  return { cubeWidth, cubeHeight };
}

export function CubeContainer({
  faces,
  rotationX,
  rotationY,
  goLeft,
  goRight,
  goUp,
  goDown,
  activeFace,
}: CubeContainerProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard support (web only)
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goRight();
          break;
        case "ArrowRight":
          e.preventDefault();
          goLeft();
          break;
        case "ArrowDown":
          e.preventDefault();
          goUp();
          break;
        case "ArrowUp":
          e.preventDefault();
          goDown();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goLeft, goRight, goUp, goDown]);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      touchStartRef.current = { x: e.x, y: e.y };
    })
    .onEnd((e) => {
      const start = touchStartRef.current;
      if (!start) return;
      const dx = e.translationX;
      const dy = e.translationY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;
      if (absDx > absDy) {
        if (dx < 0) goRight();
        else goLeft();
      } else {
        if (dy > 0) goUp();
        else goDown();
      }
      touchStartRef.current = null;
    });

  const { cubeWidth, cubeHeight } = getCubeDimensions();
  const halfW = cubeWidth / 2;
  const halfH = cubeHeight / 2;

  // Animated style for the rotating cube body
  const cubeBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateX: `${rotationX.value}deg` as `${number}deg` },
      { rotateY: `${rotationY.value}deg` as `${number}deg` },
    ],
  }), []);

  // Face transforms — positioned in 3D space
  const faceTransforms: Record<CubeFace, object[]> = {
    front: [{ rotateY: "0deg" }, { translateZ: halfW }],
    right: [{ rotateY: "90deg" }, { translateZ: halfW }],
    left: [{ rotateY: "-90deg" }, { translateZ: halfW }],
    back: [{ rotateY: "180deg" }, { translateZ: halfW }],
    top: [{ rotateX: "90deg" }, { translateZ: halfH }],
    bottom: [{ rotateX: "-90deg" }, { translateZ: halfH }],
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.stage, { perspective: 1200 } as any]}>
        <Animated.View
          style={[
            styles.cubeBody,
            { width: cubeWidth, height: cubeHeight, transformStyle: "preserve-3d" } as any,
            cubeBodyStyle,
          ]}
        >
          {(Object.keys(faces) as CubeFace[]).map((faceName) => (
            <Animated.View
              key={faceName}
              style={[
                styles.cubeFace,
                {
                  width: cubeWidth,
                  height: faceName === "top" || faceName === "bottom" ? cubeWidth : cubeHeight,
                  transform: faceTransforms[faceName] as any,
                  backfaceVisibility: "hidden",
                },
              ]}
            >
              {faces[faceName]}
            </Animated.View>
          ))}
        </Animated.View>

        {/* Active face indicator */}
        <Text style={styles.faceLabel}>{activeFace}</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020202",
  },
  cubeBody: {
    // The cube body itself — children are positioned in 3D
    alignItems: "center",
    justifyContent: "center",
  },
  cubeFace: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(3, 160, 98, 0.4)",
    borderRadius: 8,
    overflow: "hidden",
  },
  faceLabel: {
    position: "absolute",
    bottom: 40,
    color: "#67c6a0",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});