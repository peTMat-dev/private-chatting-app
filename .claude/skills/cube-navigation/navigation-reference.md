# Cube Navigation — Reference

## Contents
- State variables and refs
- Returned hook API
- Wiring in home/page.tsx
- CSS code blocks

---

## State Variables & Refs

`useCubeNavigation.ts`:

```ts
const [activeFace, setActiveFace] = useState<CubeFace>(initialFace);
const [yTicks, setYTicks] = useState<number>(initialTicks);
const [transitionEnabled, setTransitionEnabled] = useState(true); // false during Y snap
const touchStartRef = useRef<{ x: number; y: number } | null>(null);
const tapCountRef = useRef(0);
const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const savedYTicksRef = useRef(0); // saves yTicks before navigating to top face
```

---

## Returned Hook API

```ts
{
  activeFace,              // CubeFace — currently visible face
  yTicks,                  // raw tick count (any int, negative OK)
  setYTicks,               // raw state setter
  setActiveFace,           // raw state setter
  transitionEnabled,       // boolean — false during instant Y snap
  rotation,                // { x, y } degrees — apply to cube element
  goLeft, goRight,         // horizontal navigation
  goDown, goUp,            // vertical (to/from top face)
  setFace,                 // jump to named face programmatically
  handleKeyDown,           // → wrapper div onKeyDown
  handleTouchStart,        // → wrapper div onTouchStart
  handleTouchEnd,          // → wrapper div onTouchEnd
  handleHeaderTripleTap,   // → each .cube-face-header onClick
}
```

---

## Wiring in `home/page.tsx`

### Outer wrapper (swipe + keyboard events)

```tsx
<div
  className="mobile-auth-screen fade-in"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
```

Events captured on full-screen wrapper — swipes anywhere on the page rotate the cube.

### Cube element

```tsx
<div
  className="auth-cube"
  style={{
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
    transition: transitionEnabled ? undefined : "none",
  }}
>
```

`transition: "none"` during the instant Y snap so user never sees the Y movement.

### Face headers (triple-tap to logout)

```tsx
<div className="cube-face-header" onClick={handleHeaderTripleTap}>
  <h2>{tr.chats}</h2>
</div>
```

All 4 side face headers get `onClick={handleHeaderTripleTap}`. Top face has no header.

---

## CSS Code Blocks (`globals.css`)

```css
.auth-cube-stage {
  perspective: 1200px;
}

.auth-cube {
  --cube-width: min(340px, 85vw);
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.cube-face {
  backface-visibility: hidden; /* NEVER flip a face 180° — makes it invisible */
}

/* Face pre-rotation positions */
.cube-face-front { transform: translateZ(calc(var(--cube-width) / 2)); }
.cube-face-right { transform: rotateY(90deg)  translateZ(calc(var(--cube-width) / 2)); }
.cube-face-left  { transform: rotateY(-90deg) translateZ(calc(var(--cube-width) / 2)); }
.cube-face-back  { transform: rotateY(180deg) translateZ(calc(var(--cube-width) / 2)); }
.cube-face-top   { transform: rotateX(90deg)  translateZ(calc(var(--cube-width) / 2)); }
```
