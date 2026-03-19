"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";

export type CubeFace = "front" | "left" | "right" | "back" | "top";

const FACES_BY_TICKS: CubeFace[] = ["front", "left", "back", "right"];

const FACE_TICKS: Record<CubeFace, number> = {
  front: 0,
  left: 1,
  back: 2,
  right: 3,
  top: 0, // placeholder — setFace handles top separately
};

export function useCubeNavigation(initialFace: CubeFace = "front") {
  const initialTicks = initialFace !== "top" ? FACE_TICKS[initialFace] : 0;
  const [activeFace, setActiveFace] = useState<CubeFace>(initialFace);
  const [yTicks, setYTicks] = useState<number>(initialTicks);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const rotation = useMemo(() => {
    const baseX = -5;
    const baseY = -15;
    const x = activeFace === "top" ? baseX - 90 : baseX;
    const y = baseY + yTicks * 90;
    return { x, y };
  }, [activeFace, yTicks]);

  const goLeft = () => {
    if (activeFace === "top") return;
    setYTicks((t) => {
      const next = t + 1;
      setActiveFace(FACES_BY_TICKS[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const goRight = () => {
    if (activeFace === "top") return;
    setYTicks((t) => {
      const next = t - 1;
      setActiveFace(FACES_BY_TICKS[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const goDown = () => {
    setActiveFace((prev) => {
      if (prev !== "top") return "top";
      return prev;
    });
  };

  const goUp = () => {
    setActiveFace((prev) => {
      if (prev === "top") return FACES_BY_TICKS[((yTicks % 4) + 4) % 4];
      return prev;
    });
  };

  // Jump directly to a named face, keeping yTicks in sync.
  const setFace = (face: CubeFace) => {
    setActiveFace(face);
    if (face !== "top") {
      setYTicks(FACE_TICKS[face]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goLeft();
        break;
      case "ArrowRight":
        event.preventDefault();
        goRight();
        break;
      case "ArrowDown":
        event.preventDefault();
        goDown();
        break;
      case "ArrowUp":
        event.preventDefault();
        goUp();
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
      if (dy > 0) goUp(); else goDown();
    }
    touchStartRef.current = null;
  };

  return {
    activeFace,
    yTicks,
    setYTicks,
    setActiveFace,
    rotation,
    goLeft,
    goRight,
    goDown,
    goUp,
    setFace,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
  };
}
