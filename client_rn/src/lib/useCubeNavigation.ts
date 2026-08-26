import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";

export type CubeFace = "front" | "left" | "right" | "back" | "top" | "bottom";

const FACES_BY_TICKS: CubeFace[] = ["front", "left", "back", "right"];

const FACE_TICKS: Record<CubeFace, number> = {
  front: 0,
  left: 1,
  back: 2,
  right: 3,
  top: 0,
  bottom: 0,
};

const BASE_X = 0;
// The gentle -15° rest tilt is a "cube shape" affordance we only want on larger
// web (tablet/laptop) screens. On mobile the active face must fill the screen
// edge-to-edge, so it sits perpendicular to the screen (tilt = 0).
const BASE_Y = Platform.OS === "web" ? -15 : 0;
const ANIMATION_DURATION = 100;
const ANIMATION_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
const SWIPE_THRESHOLD = 40;
const AXIS_LOCK_THRESHOLD = 5; // px before the drag commits to an axis (kept tiny so the cube follows the thumb almost at once)
// How many degrees the cube rotates per pixel of finger drag (finger following).
const DEG_PER_PX = 0.3;

export function useCubeNavigation(initialFace: CubeFace = "front") {
  const initialTicks = initialFace !== "top" && initialFace !== "bottom" ? FACE_TICKS[initialFace] : 0;
  const [activeFace, setActiveFace] = useState<CubeFace>(initialFace);
  const [yTicks, setYTicks] = useState<number>(initialTicks);
  const savedYTicksRef = useRef(0);

  // Shared values for reanimated 3D rotation
  const rotationX = useSharedValue(
    initialFace === "top" ? BASE_X - 90 : initialFace === "bottom" ? BASE_X + 90 : BASE_X
  );
  const rotationY = useSharedValue(BASE_Y + initialTicks * 90);

  // Triple-tap refs
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerTapCountRef = useRef(0);
  const footerTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Finger-following drag state
  const dragActiveRef = useRef(false);
  const dragAxisRef = useRef<"x" | "y" | null>(null);
  const dragBaseXRef = useRef(0);
  const dragBaseYRef = useRef(0);

  const animateRotation = useCallback((targetX: number, targetY: number) => {
    "worklet";
    rotationX.value = withTiming(targetX, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
    rotationY.value = withTiming(targetY, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  }, [rotationX, rotationY]);

  const goLeft = useCallback(() => {
    if (activeFace === "top" || activeFace === "bottom") return;
    setYTicks((t) => {
      const next = t + 1;
      const face = FACES_BY_TICKS[((next % 4) + 4) % 4];
      setActiveFace(face);
      animateRotation(BASE_X, BASE_Y + next * 90);
      return next;
    });
  }, [activeFace, animateRotation]);

  const goRight = useCallback(() => {
    if (activeFace === "top" || activeFace === "bottom") return;
    setYTicks((t) => {
      const next = t - 1;
      const face = FACES_BY_TICKS[((next % 4) + 4) % 4];
      setActiveFace(face);
      animateRotation(BASE_X, BASE_Y + next * 90);
      return next;
    });
  }, [activeFace, animateRotation]);

  const goDown = useCallback(() => {
    if (activeFace === "top") return;
    if (activeFace === "bottom") {
      // Back to the side face we came from: tween X→0 and Y→rest in one smooth motion
      const savedY = savedYTicksRef.current;
      const face = FACES_BY_TICKS[((savedY % 4) + 4) % 4];
      setActiveFace(face);
      setYTicks(savedY);
      animateRotation(BASE_X, BASE_Y + savedY * 90);
      return;
    }
    // Front/left/right/back → top: tween both X→(-90°) and Y→0 in one smooth motion
    savedYTicksRef.current = yTicks;
    setActiveFace("top");
    animateRotation(BASE_X - 90, BASE_Y);
  }, [activeFace, yTicks, animateRotation]);

  const goUp = useCallback(() => {
    if (activeFace === "bottom") return;
    if (activeFace === "top") {
      // Back to the side face we came from: tween X→0 and Y→rest in one smooth motion
      const savedY = savedYTicksRef.current;
      const face = FACES_BY_TICKS[((savedY % 4) + 4) % 4];
      setActiveFace(face);
      setYTicks(savedY);
      animateRotation(BASE_X, BASE_Y + savedY * 90);
      return;
    }
    // Front/left/right/back → bottom: tween both X→(+90°) and Y→0 in one smooth motion
    savedYTicksRef.current = yTicks;
    setActiveFace("bottom");
    animateRotation(BASE_X + 90, BASE_Y);
  }, [activeFace, yTicks, animateRotation]);

  // --- Finger-following drag (smoother sweep) ---
  // The drag is locked to a SINGLE axis (horizontal OR vertical) as soon as the
  // finger clearly commits to one direction, so the cube never rotates on both
  // axes at once and never "falls apart" during a diagonal swipe.
  const beginDrag = useCallback(() => {
    dragActiveRef.current = true;
    dragAxisRef.current = null;
    dragBaseXRef.current = rotationX.value;
    dragBaseYRef.current = rotationY.value;
  }, [rotationX, rotationY]);

  const updateDrag = useCallback(
    (dx: number, dy: number) => {
      if (!dragActiveRef.current) return;
      if (dragAxisRef.current === null) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        // Wait until the finger clearly commits to a direction before locking.
        if (absDx < AXIS_LOCK_THRESHOLD && absDy < AXIS_LOCK_THRESHOLD) return;
        if (activeFace === "top" || activeFace === "bottom") {
          dragAxisRef.current = "y"; // vertical-only faces
        } else if (absDx >= absDy) {
          dragAxisRef.current = "x";
        } else {
          dragAxisRef.current = "y";
        }
      }
      if (dragAxisRef.current === "x") {
        rotationY.value = dragBaseYRef.current + dx * DEG_PER_PX;
      } else {
        rotationX.value = dragBaseXRef.current - dy * DEG_PER_PX;
      }
    },
    [activeFace, rotationX, rotationY]
  );

  const endDrag = useCallback(
    (dx: number, dy: number) => {
      dragActiveRef.current = false;
      const axis = dragAxisRef.current;
      dragAxisRef.current = null;
      if (axis === "x") {
        if (Math.abs(dx) < SWIPE_THRESHOLD) {
          animateRotation(dragBaseXRef.current, dragBaseYRef.current); // snap back
          return;
        }
        if (dx < 0) goRight();
        else goLeft();
      } else if (axis === "y") {
        if (Math.abs(dy) < SWIPE_THRESHOLD) {
          animateRotation(dragBaseXRef.current, dragBaseYRef.current); // snap back
          return;
        }
        if (dy > 0) goUp();
        else goDown();
      } else {
        // Never committed to an axis: snap back to the resting face.
        animateRotation(dragBaseXRef.current, dragBaseYRef.current);
      }
    },
    [animateRotation, goLeft, goRight, goUp, goDown]
  );

  const setFace = useCallback((face: CubeFace) => {
    setActiveFace(face);
    if (face !== "top" && face !== "bottom") {
      const ticks = FACE_TICKS[face];
      setYTicks(ticks);
      animateRotation(BASE_X, BASE_Y + ticks * 90);
    } else if (face === "top") {
      animateRotation(BASE_X - 90, BASE_Y);
    } else {
      animateRotation(BASE_X + 90, BASE_Y);
    }
  }, [animateRotation]);

  const handleHeaderTripleTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      goDown();
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  }, [goDown]);

  const handleFooterTripleTap = useCallback(() => {
    footerTapCountRef.current += 1;
    if (footerTapTimerRef.current) clearTimeout(footerTapTimerRef.current);
    if (footerTapCountRef.current >= 3) {
      footerTapCountRef.current = 0;
      goUp();
      return;
    }
    footerTapTimerRef.current = setTimeout(() => {
      footerTapCountRef.current = 0;
    }, 600);
  }, [goUp]);

  return {
    activeFace,
    yTicks,
    rotationX,
    rotationY,
    goLeft,
    goRight,
    goDown,
    goUp,
    setFace,
    beginDrag,
    updateDrag,
    endDrag,
    handleHeaderTripleTap,
    handleFooterTripleTap,
  };
}