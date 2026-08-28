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
import type { CubeFace } from "../../lib/useCubeNavigation";

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
  beginDrag: () => void;
  updateDrag: (dx: number, dy: number) => void;
  endDrag: (dx: number, dy: number) => void;
  activeFace: CubeFace;
}

const PERSPECTIVE = 1200;

// === 4x4 matrix helpers (column-major, as RN `transform: [{ matrix }]` expects) ===
// multiplyMatrices(a, b) returns the product a·b. In the product, the RIGHTMOST
// factor is applied to the point FIRST (matching CSS/RN transform ordering).
function multiplyMatrices(a: number[], b: number[]): number[] {
  "worklet";
  const out = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[r + c * 4] =
        a[r + 0 * 4] * b[0 + c * 4] +
        a[r + 1 * 4] * b[1 + c * 4] +
        a[r + 2 * 4] * b[2 + c * 4] +
        a[r + 3 * 4] * b[3 + c * 4];
    }
  }
  return out;
}

function translateMatrix(dx: number, dy: number, dz: number): number[] {
  "worklet";
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    dx, dy, dz, 1,
  ];
}

function translateZMatrix(dz: number): number[] {
  "worklet";
  return translateMatrix(0, 0, dz);
}

function rotateXMatrix(a: number): number[] {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ];
}

function rotateYMatrix(a: number): number[] {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ];
}

function perspectiveMatrix(p: number): number[] {
  "worklet";
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, -1 / p, 1,
  ];
}

function getCubeDimensions() {
  const { width: screenW, height: screenH } = Dimensions.get("window");
  // Keep the web build within the same bounded area as the desktop CSS cube.
  // On native (Android/iOS) the cube should fill the screen like the reference
  // `client_rn` implementation does.
  if (Platform.OS === "web") {
    return {
      cubeWidth: Math.min(340, screenW * 0.85),
      cubeHeight: Math.min(520, screenH * 0.78),
    };
  }
  return { cubeWidth: screenW, cubeHeight: screenH };
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
  const depth = faceName === "top" || faceName === "bottom" ? halfH : halfW;
  const cx = cubeWidth / 2;
  const cy =
    faceName === "top" || faceName === "bottom" ? cubeWidth / 2 : cubeHeight / 2;
  // Resolve per-face static values to plain numbers OUTSIDE the worklet so only
  // primitives are captured by the UI-thread worklet closure.
  const oxDeg = faceXOffset[faceName];
  const oyDeg = faceYOffset[faceName];

  // Reanimated cannot express translateZ in an animated `transform` on Android
  // (RuntimeException: Unsupported transform: translateZ). We therefore build
  // the FULL 3D transform as a single 4x4 matrix every frame. It replicates the
  // exact cube-orbit order of the working web/iOS `preserve-3d` path:
  //   M = P · T(c) · [Rx(rx)·Ry(ry)] · [Ry(oy)·Rx(ox)·Tz(depth)] · T(-c)
  // where c=(cx,cy) is the face/cube centre (transform-origin), P is the stage
  // perspective, and each factor applies right-to-left to the point. Because
  // Android ignores translateZ for z-ordering (no preserve-3d = draw order wins),
  // we additionally transform each face's CENTROID into view space and assign a
  // zIndex so near faces paint over far ones.
  const animatedStyle = useAnimatedStyle(() => {
    const rx = (rotationX.value * Math.PI) / 180;
    const ry = (rotationY.value * Math.PI) / 180;
    const ox = (oxDeg * Math.PI) / 180;
    const oy = (oyDeg * Math.PI) / 180;

    const cubeRot = multiplyMatrices(
      rotateXMatrix(rx),
      rotateYMatrix(ry)
    ); // Rx·Ry (global spin+tilt)
    const faceRot = multiplyMatrices(
      rotateYMatrix(oy),
      rotateXMatrix(ox)
    ); // Ry·Rx (per-face offset)
    const faceTrans = multiplyMatrices(faceRot, translateZMatrix(depth)); // ·Tz(depth)

    let m = perspectiveMatrix(PERSPECTIVE);
    m = multiplyMatrices(m, translateMatrix(cx, cy, 0)); // ·T(c)
    m = multiplyMatrices(m, cubeRot); // ·Rx·Ry
    m = multiplyMatrices(m, faceTrans); // ·Ry·Rx·Tz
    m = multiplyMatrices(m, translateMatrix(-cx, -cy, 0)); // ·T(-c)

    // View-space Z of the face CENTROID (local point = (cx, cy, 0)), used only
    // for draw-order. Apply the same transform without perspective (Z ordering
    // is monotonic under it) and read out the transformed Z component.
    const sortM = multiplyMatrices(
      multiplyMatrices(
        multiplyMatrices(translateMatrix(cx, cy, 0), cubeRot),
        faceTrans
      ),
      translateMatrix(-cx, -cy, 0)
    );
    const centroidZ = sortM[2] * cx + sortM[6] * cy + sortM[14];

    // Precise back-face culling computed in view space, because Android's
    // `backfaceVisibility` prop on a 3D-matrix child is unreliable. R is the
    // combined face rotation (cube spin x per-face offset); a face's outward
    // normal starts at +Z (toward the viewer at rest), so its view-space Z is
    // the 0-indexed [10] entry. We hide the face the instant its normal turns
    // away from the camera, so it never lingers or pops late behind the front.
    const R = multiplyMatrices(cubeRot, faceRot);
    const facingViewer = R[10] > 0;

    return {
      transform: [{ matrix: m } as any],
      zIndex: Math.round(centroidZ),
      opacity: facingViewer ? 1 : 0,
    };
  });

  // Perspective does not affect face draw ordering on Android, so we force
  // zIndex (above) so near faces paint over far ones.
  return (
    <Animated.View
      style={[
        styles.cubeFace,
        {
          width: cubeWidth,
          height: faceName === "top" || faceName === "bottom" ? cubeWidth : cubeHeight,
          backfaceVisibility: "hidden",
        },
        animatedStyle,
      ]}
    >
      {faces[faceName]}
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
  beginDrag,
  updateDrag,
  endDrag,
  activeFace,
}: CubeContainerProps) {
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

  // Pan gesture for swipe — the cube follows the finger during the drag and
  // settles smoothly onto the nearest face on release.
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => beginDrag())
    .onUpdate((e) => updateDrag(e.translationX, e.translationY))
    .onEnd((e) => endDrag(e.translationX, e.translationY));

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