"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";

export type CubeFace = "front" | "left" | "right" | "back" | "top" | "bottom";

const FACES_BY_TICKS: CubeFace[] = ["front", "left", "back", "right"];

const FACE_TICKS: Record<CubeFace, number> = {
  front: 0,
  left: 1,
  back: 2,
  right: 3,
  top: 0,    // placeholder — setFace handles top separately
  bottom: 0, // placeholder — setFace handles bottom separately
};

export function useCubeNavigation(initialFace: CubeFace = "front") {
  const initialTicks = initialFace !== "top" ? FACE_TICKS[initialFace] : 0;
  const [activeFace, setActiveFace] = useState<CubeFace>(initialFace);
  const [yTicks, setYTicks] = useState<number>(initialTicks);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedYTicksRef = useRef(0);

  const rotation = useMemo(() => {
    const baseX = -5;
    const baseY = -15;
    const x = activeFace === "top" ? baseX - 90 : activeFace === "bottom" ? baseX + 90 : baseX;
    const y = baseY + yTicks * 90;
    return { x, y };
  }, [activeFace, yTicks]);

  const goLeft = () => {
    if (activeFace === "top" || activeFace === "bottom") return;
    setYTicks((t) => {
      const next = t + 1;
      setActiveFace(FACES_BY_TICKS[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const goRight = () => {
    if (activeFace === "top" || activeFace === "bottom") return;
    setYTicks((t) => {
      const next = t - 1;
      setActiveFace(FACES_BY_TICKS[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const goDown = () => {
    if (activeFace === "top") return;
    if (activeFace === "bottom") {
      // Go back from bottom
      setTransitionEnabled(false);
      setYTicks(savedYTicksRef.current);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setActiveFace(FACES_BY_TICKS[((savedYTicksRef.current % 4) + 4) % 4]);
        });
      });
      return;
    }
    savedYTicksRef.current = yTicks;
    // Instantly snap Y to front (no animation), then animate X tilt to top
    setTransitionEnabled(false);
    setYTicks(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setActiveFace("top");
      });
    });
  };

  const goUp = () => {
    if (activeFace === "bottom") return;
    if (activeFace === "top") {
      // Instantly restore Y (no animation), then animate X tilt back down
      setTransitionEnabled(false);
      setYTicks(savedYTicksRef.current);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setActiveFace(FACES_BY_TICKS[((savedYTicksRef.current % 4) + 4) % 4]);
        });
      });
      return;
    }
    // Normal face → go to bottom
    savedYTicksRef.current = yTicks;
    setTransitionEnabled(false);
    setYTicks(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setActiveFace("bottom");
      });
    });
  };

  // Jump directly to a named face, keeping yTicks in sync.
  const setFace = (face: CubeFace) => {
    setActiveFace(face);
    if (face !== "top" && face !== "bottom") {
      setYTicks(FACE_TICKS[face]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goRight();
        break;
      case "ArrowRight":
        event.preventDefault();
        goLeft();
        break;
      case "ArrowDown":
        event.preventDefault();
        goUp();
        break;
      case "ArrowUp":
        event.preventDefault();
        goDown();
        break;
      default:
        break;
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < 40 && absDy < 40) return;
    if (absDx > absDy) {
      if (dx < 0) goRight(); else goLeft();
    } else {
      if (dy > 0) goUp();
      else goDown();
    }
    touchStartRef.current = null;
  };

  const handleHeaderTripleTap = () => {
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
  };

  const footerTapCountRef = useRef(0);
  const footerTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFooterTripleTap = () => {
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
  };

  return {
    activeFace,
    yTicks,
    setYTicks,
    setActiveFace,
    transitionEnabled,
    rotation,
    goLeft,
    goRight,
    goDown,
    goUp,
    setFace,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleHeaderTripleTap,
    handleFooterTripleTap,
  };
}
