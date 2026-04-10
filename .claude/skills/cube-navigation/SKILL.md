---
name: cube-navigation
description: 'Debug, modify, or extend the 3D cube rotation, swiping, touch events, keyboard navigation, and face transitions in this app. Use when asked to change swipe gestures, add new faces, fix rotation bugs, change how the top/logout face is accessed, or modify cube animation.'
argument-hint: 'Optional: specify area (e.g. swipe gestures, triple tap, top face, rotation math, CSS transform, keyboard navigation)'
---

# Cube Navigation Skill

## File Map

| File | Purpose |
|---|---|
| `client/src/lib/useCubeNavigation.ts` | All navigation state, gestures, rotation logic |
| `client/src/app/home/page.tsx` | Mounts the hook, wires events to the wrapper div and face headers |
| `client/src/app/globals.css` | CSS 3D transforms for each face, cube stage perspective, transition |

**State & Refs, Returned API, full wiring JSX, CSS code blocks:** See [navigation-reference.md](navigation-reference.md)

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

| Handler | Wired to | Behaviour |
|---|---|---|
| `handleTouchStart` | wrapper `onTouchStart` | Records `{x, y}` touch start |
| `handleTouchEnd` | wrapper `onTouchEnd` | `\|dx\| > \|dy\|` → left/right; upward only → `goUp()`; swipe-down disabled |
| `handleKeyDown` | wrapper `onKeyDown` | Arrow keys → navigation |
| `handleHeaderTripleTap` | each `.cube-face-header onClick` | 3 taps ≤ 600ms → `goDown()` |

Threshold: 40px. Wire to outer wrapper, NOT the cube element (`preserve-3d` can interfere on iOS).

---

## Wiring in `home/page.tsx`

See [navigation-reference.md](navigation-reference.md) for full JSX examples.

---

## CSS — Key Rules

`perspective: 1200px` on stage. `transition: transform 0.7s cubic-bezier(...)` on cube. **`backface-visibility: hidden`** on `.cube-face` — NEVER add extra rotations to face CSS transforms (black screen result).

See [navigation-reference.md](navigation-reference.md) for full CSS code and face transforms.

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

## Common Mistakes

| Mistake | Correct |
|---|---|
| Adding `rotateX/Y(180deg)` to face CSS | `backface-visibility: hidden` → black screen |
| Counter-rotation wrapper inside top face | Cascading 3D = mirrored/sideways — use double-rAF Y-snap |
| Setting Y + `activeFace="top"` same render | Diagonal animation — ALWAYS use double-rAF |
| One `requestAnimationFrame` instead of two | May not flush `transition: none` — ALWAYS double-rAF |
| Wiring touch handlers to cube element | `preserve-3d` interferes with iOS touch — use outer wrapper |
| Forgetting `+4) % 4` for face from yTicks | `((n % 4) + 4) % 4` handles negative values |

---

## Adding a New Face

To add a new face (e.g. a bottom face):

1. **CSS** — add `.cube-face-bottom { transform: rotateX(-90deg) translateZ(calc(var(--cube-width) / 2)); }`
2. **Type** — add `"bottom"` to `CubeFace` in `useCubeNavigation.ts`
3. **Navigation function** — add `goUp2()` or hook into existing directional logic
4. **Rotation math** — the `rotation` useMemo must handle the new face's `x` value
5. **JSX** — add `<section className="cube-face cube-face-bottom">` inside the `.auth-cube` div
6. **`savedYTicksRef` pattern** — if the new face also requires Y snap, follow the same pattern as `goDown`/`goUp`
