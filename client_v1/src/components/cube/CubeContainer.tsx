/// <reference lib="dom" />
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
  configureReanimatedLogger,
  type SharedValue,
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
  // Cap the cube size on every platform. Full-screen-ish faces carrying live
  // 3D matrices are a classic trigger for the Android renderer StackOverflow
  // (ViewGroup.recreateChildDisplayList) on some devices, so keep the cube
  // within a bounded on-screen area.
  const cubeWidth = Math.min(340, screenW * 0.85);
  const cubeHeight = Math.min(520, screenH * 0.78);
  return { cubeWidth, cubeHeight };
}

interface CubeFaceViewProps {
  faceName: CubeFace;
  faces: Record<CubeFace, React.ReactNode>;
  rotationX: SharedValue<number>;
  rotationY: SharedValue<number>;
  cubeWidth: number;
  cubeHeight: number;
  halfW: number;
  halfH: number;
  faceXOffset: Record<CubeFace, number>;
  faceYOffset: Record<CubeFace, number>;
}

// Android stand-in for a face: rotates each face individually around its own
// transform (no preserve-3d needed).
function CubeFaceView({
  faceName,
  faces,
  rotationX,
  rotationY,
  cubeWidth,
  cubeHeight,
  halfW,
  halfH,
  faceXOffset,
  faceYOffset,
}: CubeFaceViewProps) {
  // Reanimated does not support translateZ inside animated transforms on
  // Android, so we split the transform across two nested views:
  //
  //   OUTER (animated) : perspective + shared rotation
  //   INNER (static)   : per-face offset + translateZ depth
  //
  // Correct matrix order: perspective -> rotation -> offset -> translateZ,
  // which makes each face orbit the cube center instead of rotating in place.
  const depth = faceName === "top" || faceName === "bottom" ? halfH : halfW;
  const staticTransform = [
    { rotateX: `${faceXOffset[faceName]}deg` },
    { rotateY: `${faceYOffset[faceName]}deg` },
    { translateZ: depth },
  ] as any;

  // Shared rotation (with perspective) drives the whole cube turn.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${rotationX.value}deg` },
      { rotateY: `${rotationY.value}deg` },
    ] as any,
  }));

  return (
    <Animated.View
      style={[{ ...styles.cubeFace, borderWidth: 0 }, animatedStyle]}
    >
      <View
        style={[
          styles.cubeFace,
          {
            width: cubeWidth,
            height: faceName === "top" || faceName === "bottom" ? cubeWidth : cubeHeight,
            transform: staticTransform,
            backfaceVisibility: "hidden",
          },
        ]}
      >
        {faces[faceName]}
      </View>
    </Animated.View>
  );
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
    .runOnJS(true)
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

  const isAndroid = Platform.OS === "android";

  // Web/iOS-only: rotate the container holding all faces (preserve-3d works here)
  const containerBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateX: `${rotationX.value}deg` as `${number}deg` },
      { rotateY: `${rotationY.value}deg` as `${number}deg` },
    ],
  }));

  // Static face offsets used for the web/iOS container rotation path
  const faceOffsets: Record<CubeFace, object[]> = {
    front: [{ rotateY: "0deg" }, { translateZ: halfW }],
    right: [{ rotateY: "90deg" }, { translateZ: halfW }],
    left: [{ rotateY: "-90deg" }, { translateZ: halfW }],
    back: [{ rotateY: "180deg" }, { translateZ: halfW }],
    top: [{ rotateX: "90deg" }, { translateZ: halfH }],
    bottom: [{ rotateX: "-90deg" }, { translateZ: halfH }],
  };

  // Per-face Y rotation offset (front/right/back/left)
  const faceYOffset: Record<CubeFace, number> = {
    front: 0,
    right: 90,
    back: 180,
    left: -90,
    top: 0,
    bottom: 0,
  };

  // Per-face X rotation offset (top/bottom)
  const faceXOffset: Record<CubeFace, number> = {
    front: 0,
    right: 0,
    back: 0,
    left: 0,
    top: 90,
    bottom: -90,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.stage, { perspective: 1200 } as any]}>
        {isAndroid ? (
          // Android: no preserve-3d support. Keep the container static and rotate
          // each face individually against the parent's perspective so the cube
          // actually turns in 3D.
          <View
            style={[
              styles.cubeBody,
              { width: cubeWidth, height: cubeHeight } as any,
            ]}
          >
            {(Object.keys(faces) as CubeFace[]).map((faceName) => (
              <CubeFaceView
                key={faceName}
                faceName={faceName}
                faces={faces}
                rotationX={rotationX}
                rotationY={rotationY}
                cubeWidth={cubeWidth}
                cubeHeight={cubeHeight}
                halfW={halfW}
                halfH={halfH}
                faceXOffset={faceXOffset}
                faceYOffset={faceYOffset}
              />
            ))}
          </View>
        ) : (
          <Animated.View
            style={[
              styles.cubeBody,
              { width: cubeWidth, height: cubeHeight, transformStyle: "preserve-3d" } as any,
              containerBodyStyle,
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
                    transform: faceOffsets[faceName] as any,
                    backfaceVisibility: "hidden",
                  },
                ]}
              >
                {faces[faceName]}
              </Animated.View>
            ))}
          </Animated.View>
        )}

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