import { useCallback, useRef, useState } from "react";
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

const BASE_X = -5;
const BASE_Y = -15;
const ANIMATION_DURATION = 500;
const ANIMATION_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

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
      // Go back from bottom: snap Y back, then animate X back
      const savedY = savedYTicksRef.current;
      "worklet";
      rotationY.value = BASE_Y + savedY * 90; // instant snap
      setTimeout(() => {
        const face = FACES_BY_TICKS[((savedY % 4) + 4) % 4];
        setActiveFace(face);
        setYTicks(savedY);
        animateRotation(BASE_X, BASE_Y + savedY * 90);
      }, 16);
      return;
    }
    savedYTicksRef.current = yTicks;
    // Snap Y to 0 instantly, then animate X to top
    "worklet";
    rotationY.value = BASE_Y; // instant snap
    setTimeout(() => {
      setActiveFace("top");
      animateRotation(BASE_X - 90, BASE_Y);
    }, 16);
  }, [activeFace, yTicks, rotationY, animateRotation]);

  const goUp = useCallback(() => {
    if (activeFace === "bottom") return;
    if (activeFace === "top") {
      // Go back from top: snap Y back, then animate X back
      const savedY = savedYTicksRef.current;
      "worklet";
      rotationY.value = BASE_Y + savedY * 90; // instant snap
      setTimeout(() => {
        const face = FACES_BY_TICKS[((savedY % 4) + 4) % 4];
        setActiveFace(face);
        setYTicks(savedY);
        animateRotation(BASE_X, BASE_Y + savedY * 90);
      }, 16);
      return;
    }
    // Normal face → go to bottom
    savedYTicksRef.current = yTicks;
    "worklet";
    rotationY.value = BASE_Y; // instant snap
    setTimeout(() => {
      setActiveFace("bottom");
      animateRotation(BASE_X + 90, BASE_Y);
    }, 16);
  }, [activeFace, yTicks, rotationY, animateRotation]);

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
    handleHeaderTripleTap,
    handleFooterTripleTap,
  };
}