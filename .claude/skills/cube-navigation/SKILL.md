---
name: cube-navigation
description: 'Debug, modify, or extend the 3D cube rotation, swiping, touch events, keyboard navigation, and face transitions in this app. Use when asked to change swipe gestures, add new faces, fix rotation bugs, change how the top/logout face is accessed, or modify cube animation.'
argument-hint: 'Optional: specify area (e.g. swipe gestures, triple tap, top face, rotation math, CSS transform, keyboard navigation)'
---

# Cube Navigation Skill

## What This Skill Covers

The entire navigation system for the **3D CSS rotating cube** UI in `client/src/app/home/page.tsx`. This includes:
- Swipe gesture detection (touch events)
- Keyboard arrow navigation
- Triple-tap gesture to access the top (logout) face
- Rotation math (`yTicks`, `rotation.x/y`)
- CSS 3D transforms for each face
- The `useCubeNavigation` hook

---

## File Map

| File | Purpose |
|---|---|
| `client/src/lib/useCubeNavigation.ts` | All navigation state, gestures, rotation logic |
| `client/src/app/home/page.tsx` | Mounts the hook, wires events to the wrapper div and face headers |
| `client/src/app/globals.css` | CSS 3D transforms for each face, cube stage perspective, transition |

---

## Cube Architecture

The cube is a standard CSS `transform-style: preserve-3d` element with 5 faces. The cube element itself rotates — faces stay static within it.

```
        [TOP — Logout]
            ↑
[RIGHT] ← [FRONT] → [LEFT]
            ↓
         (nothing — swipe down disabled)
        [BACK — Settings]  (reached by left/right rotation)
```

**Face layout in 3D space:**

| Face | CSS transform | Active direction |
|---|---|---|
| `front` | `translateZ(cubeWidth/2)` | Default/starting face (Chats) |
| `left` | `rotateY(-90deg) translateZ(cubeWidth/2)` | Contacts |
| `back` | `rotateY(180deg) translateZ(cubeWidth/2)` | Settings |
| `right` | `rotateY(90deg) translateZ(cubeWidth/2)` | Chat view placeholder |
| `top` | `rotateX(90deg) translateZ(cubeWidth/2)` | Logout |

**`backface-visibility: hidden`** is set on `.cube-face` — the back of each face is invisible. This means flipping a face 180° in its own axis makes it disappear (black screen).

---

## Rotation Math

The cube rotates as a whole unit. The applied transform is:
```
rotateX(rotation.x) rotateY(rotation.y)
```

### Y rotation (horizontal face cycling)
- Controlled by `yTicks` integer state
- Each tick = 90° rotation: `y = baseY + yTicks * 90`
- `baseY = -15` (slight perspective tilt, cosmetic)
- `goLeft()`: `yTicks + 1` → face moves right → user sees next face to the left
- `goRight()`: `yTicks - 1` → face moves left → user sees next face to the right
- The active face name is derived: `FACES_BY_TICKS[((yTicks % 4) + 4) % 4]`
  - The `+4) % 4` handles negative yTicks correctly

### X rotation (vertical — top face)
- `baseX = -5` (slight downward tilt, cosmetic)
- When `activeFace === "top"`: `x = baseX - 90` (tilts cube backward to reveal top)
- All other faces: `x = baseX`

### Top face Y snap
When going to the top face (`goDown`), the Y rotation **must be at 0** so the top face is aligned with the front and faces the user correctly. The snap is invisible because CSS transition is disabled during the Y change.

**Do NOT** try to fix top face orientation by:
- Adding `rotateX(180deg)` to the face CSS → causes black screen (`backface-visibility: hidden`)
- Adding a counter-rotation wrapper div inside the top face → produces mirrored/sideways text due to cascaded 3D transforms

The **only correct approach** is the `transitionEnabled` + double-rAF pattern in `goDown`/`goUp`.

---

## The `useCubeNavigation` Hook

**File:** `client/src/lib/useCubeNavigation.ts`

### State & Refs

```ts
const [activeFace, setActiveFace] = useState<CubeFace>(initialFace);
const [yTicks, setYTicks] = useState<number>(initialTicks);
const [transitionEnabled, setTransitionEnabled] = useState(true); // controls CSS transition on/off
const touchStartRef = useRef<{ x: number; y: number } | null>(null);  // swipe start position
const tapCountRef = useRef(0);              // tracks consecutive header taps
const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // resets tap count
const savedYTicksRef = useRef(0);          // saves yTicks before going to top face
```

### Navigation Functions

| Function | Behaviour |
|---|---|
| `goLeft()` | Rotates cube left (yTicks+1). Blocked when on top face. |
| `goRight()` | Rotates cube right (yTicks-1). Blocked when on top face. |
| `goDown()` | Goes to top/logout face. Instantly snaps Y to 0 (no animation), then animates X tilt up. |
| `goUp()` | Returns from top face. Instantly restores previous yTicks (no animation), then animates X tilt down. |
| `setFace(face)` | Jump directly to any named face, keeping yTicks in sync. Used by code (not gestures). |
| `setActiveFace` | Raw state setter — exported for edge cases only. |
| `setYTicks` | Raw state setter — exported for edge cases only. |

**`goDown` / `goUp` — two-phase animation** (critical pattern):  
The top face CSS is `rotateX(90deg)` — it only looks correct when the cube's Y is at 0 (front-facing). If the user is on left/back/right and the cube tilts to top with a non-zero Y, the logout screen appears sideways or upside-down. The fix is to snap Y to 0 *before* the X animation, but *without* the user seeing the Y movement:

```ts
// goDown — snap Y instantly, then animate X
setTransitionEnabled(false);   // disable CSS transition
setYTicks(0);                  // instant Y snap (user doesn't see it)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {  // two rAFs to flush paint
    setTransitionEnabled(true); // re-enable transition
    setActiveFace("top");       // NOW animate X tilt
  });
});

// goUp — snap Y back instantly, then animate X back
setTransitionEnabled(false);
setYTicks(savedYTicksRef.current);
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTransitionEnabled(true);
    setActiveFace(previousFace);
  });
});
```
Two `requestAnimationFrame` calls are required — one rAF is not enough to guarantee the browser has flushed the style change before re-enabling the transition.

### Event Handlers

**`handleTouchStart`** — records `{ x, y }` of first touch point into `touchStartRef`.

**`handleTouchEnd`** — calculates `dx`/`dy` from stored start. Ignores movements < 40px (tap threshold). Routes:
- `|dx| > |dy|` → horizontal swipe → `goRight()` or `goLeft()`
- `|dy| > |dx|` → vertical swipe → only **upward** swipe calls `goUp()` (swipe down is disabled — it used to call `goDown()`)
- Clears `touchStartRef` after handling

**`handleKeyDown`** — Arrow keys: Left/Right call goLeft/goRight; Up/Down call goUp/goDown.

**`handleHeaderTripleTap`** — Called by the `onClick` on each `.cube-face-header`. Counts taps; 3 taps within 600ms calls `goDown()` (go to logout). Timer resets count if 600ms passes between taps.

### Returned API

```ts
{
  activeFace,          // CubeFace string — which face is currently active
  yTicks,              // raw tick count (can be any int, negative OK)
  setYTicks,           // raw setter
  setActiveFace,       // raw setter
  transitionEnabled,   // boolean — false during instant Y snap, true otherwise
  rotation,            // { x, y } in degrees — apply to cube element
  goLeft, goRight,     // horizontal navigation
  goDown, goUp,        // vertical navigation (to/from top)
  setFace,             // jump to named face
  handleKeyDown,       // wire to wrapper div onKeyDown
  handleTouchStart,    // wire to wrapper div onTouchStart
  handleTouchEnd,      // wire to wrapper div onTouchEnd
  handleHeaderTripleTap, // wire to each cube-face-header onClick
}
```

---

## Wiring in `home/page.tsx`

### Wrapper div (outermost)
```tsx
<div
  className="mobile-auth-screen fade-in"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
```
Swipe and keyboard events are captured here — on the full-screen wrapper. This means swipes anywhere on the page rotate the cube.

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
`transition: "none"` is applied during the instant Y snap in `goDown`/`goUp` so the user never sees the Y movement.

### Face headers (triple-tap)
Every `.cube-face-header` has `onClick={handleHeaderTripleTap}`:
```tsx
<div className="cube-face-header" onClick={handleHeaderTripleTap}>
  <h2>{tr.chats}</h2>
</div>
```
This is wired to all 4 side faces: Chats (front), Contacts (left), Settings (back), Chat (right). The top face itself has no header.

---

## CSS — Key Rules

**`client/src/app/globals.css`**

```css
.auth-cube-stage {
  perspective: 1200px; /* 3D depth — reduce = more dramatic perspective */
}

.auth-cube {
  --cube-width: min(340px, 85vw);
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); /* rotation animation */
}

.cube-face {
  backface-visibility: hidden; /* CRITICAL — never flip a face 180° within its own transform */
}
```

**Face transforms** — each face is pre-rotated into its 3D position:
```css
.cube-face-front  { transform: translateZ(calc(var(--cube-width) / 2)); }
.cube-face-right  { transform: rotateY(90deg)  translateZ(calc(var(--cube-width) / 2)); }
.cube-face-left   { transform: rotateY(-90deg) translateZ(calc(var(--cube-width) / 2)); }
.cube-face-back   { transform: rotateY(180deg) translateZ(calc(var(--cube-width) / 2)); }
.cube-face-top    { transform: rotateX(90deg)  translateZ(calc(var(--cube-width) / 2)); }
```

**Do NOT add extra rotations** to face transforms (e.g. `rotateX(180deg)`) — this flips the backface toward the viewer, which combined with `backface-visibility: hidden` makes the face completely invisible (black screen).

---

## Gesture Summary

| Gesture | Result |
|---|---|
| Swipe left | `goRight()` — cube rotates left, next face slides in from right |
| Swipe right | `goLeft()` — cube rotates right, next face slides in from left |
| Swipe up | `goUp()` — returns from logout face to previous face |
| Swipe down | **Disabled** — previously went to logout face, removed to avoid accidental trigger |
| Arrow Left | `goLeft()` |
| Arrow Right | `goRight()` |
| Arrow Up | `goUp()` |
| Arrow Down | `goDown()` (keyboard only — not touch) |
| Triple-tap header | `goDown()` — goes to logout/top face |

---

## Face Names & Routes

```ts
type CubeFace = "front" | "left" | "right" | "back" | "top";

// yTick → face mapping (horizontal ring)
FACES_BY_TICKS = ["front", "left", "back", "right"];
// index 0=front, 1=left, 2=back, 3=right
// wraps around in both directions (modulo 4)
```

| CubeFace | Content | yTicks value |
|---|---|---|
| `"front"` | Chats list | 0 |
| `"left"` | Contacts | 1 (or any n where n%4=1) |
| `"back"` | Settings | 2 |
| `"right"` | Chat view placeholder | 3 |
| `"top"` | Logout | N/A (Y snapped to 0) |

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Adding `rotateX(180deg)` or `rotateY(180deg)` to a face CSS transform | `backface-visibility: hidden` makes flipped faces invisible — black screen result |
| Adding a counter-rotation wrapper inside the top face | Cascading 3D transforms produce mirrored/sideways content — use the `transitionEnabled` Y-snap pattern instead |
| Setting Y and activeFace to "top" in the same render | Browser animates both X and Y simultaneously — diagonal unnatural movement. Use the double-rAF pattern so Y snaps instantly, then X animates |
| Using one `requestAnimationFrame` instead of two | One rAF may not be enough for the browser to flush the `transition: none` style change before re-enabling transition — always double-rAF |
| Wiring `handleTouchStart`/`handleTouchEnd` to the cube element instead of wrapper | Cube element has `transform-style: preserve-3d` which can interfere with touch hit areas on some iOS versions — keep on outer wrapper |
| Enabling swipe-down for logout | Too easy to trigger accidentally while scrolling content — use triple-tap header instead |
| Resetting `tapCountRef` inside the triple-tap timeout before checking count | Always check `>= 3` before the timeout reset, not after |
| Using `goLeft`/`goRight` when already on top face | Both are guarded — they no-op when `activeFace === "top"` |
| Forgetting `+4) % 4` when computing face from yTicks | Negative yTicks (going right from front) produce negative modulo in JS — must use `((n % 4) + 4) % 4` |

---

## Adding a New Face

To add a new face (e.g. a bottom face):

1. **CSS** — add `.cube-face-bottom { transform: rotateX(-90deg) translateZ(calc(var(--cube-width) / 2)); }`
2. **Type** — add `"bottom"` to `CubeFace` in `useCubeNavigation.ts`
3. **Navigation function** — add `goUp2()` or hook into existing directional logic
4. **Rotation math** — the `rotation` useMemo must handle the new face's `x` value
5. **JSX** — add `<section className="cube-face cube-face-bottom">` inside the `.auth-cube` div
6. **`savedYTicksRef` pattern** — if the new face also requires Y snap, follow the same pattern as `goDown`/`goUp`
