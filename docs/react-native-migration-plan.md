# React Native Migration Plan — CubCha (Cube Chat)

## 1. Current Architecture Summary

### Stack
| Layer | Current | Target |
|-------|---------|--------|
| Framework | Next.js 16 (React 19) | Expo SDK (React Native) + Expo Web |
| Styling | CSS variables + Bootstrap 5 | React Native StyleSheet + theme tokens |
| 3D Cube | CSS `transform-style: preserve-3d` + `rotateX/Y` | Reanimated 3D transforms (`perspective`, `rotateX/Y`, `translateZ`) — true 3D cube on all platforms |
| Real-time | socket.io-client | socket.io-client (same, RN-compatible) |
| Auth | httpOnly cookie (`cubcha_session`) | Secure cookie on web / AsyncStorage on native |
| i18n | Custom `i18n.ts` with 3 languages (EN, SK, DE) | Same translation objects, new delivery |
| Theme | Token-based (`tokens.ts`) with dark/light | Same tokens → StyleSheet values |
| State | Per-face hooks, no global store | Same hook architecture (portable) |

### Two Cube Screens
1. **Auth Cube** (`/page.tsx`) — 6 faces: Login (front), Register (right), Reset Password (back), Language (left), Logout (top), Info (bottom)
2. **Home Cube** (`/home/page.tsx`) — 6 faces: Chats (front), Contacts (left), Settings (back), Messages (right), Info (bottom), Logout (top)

### Cube Navigation
- **Swipe gestures** (touch start/end with 40px threshold)
- **Keyboard arrows** (web/desktop only)
- **Triple-tap** on header → go down (to Info), on footer → go up (to Logout)
- **Programmatic** `setFace("front"|"left"|"right"|"back"|"top"|"bottom")`

---

## 2. Recommended Framework: Expo (React Native)

### Why Expo
- **Single codebase** for Android + Web (Expo Web)
- **Expo Router** for file-based routing (similar to Next.js App Router)
- **Built-in** secure storage, haptics, gestures, animations
- **EAS Build** for Android APK/AAB generation
- **OTA updates** via EAS Update
- **No native code** needed for this app's features

### Project Structure (Proposed)
```
cubcha/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (theme + language providers)
│   ├── index.tsx               # Auth cube (login/register/reset/lang)
│   └── home/
│       └── index.tsx           # Home cube (chats/contacts/messages/settings)
├── src/
│   ├── components/
│   │   ├── cube/
│   │   │   ├── CubeContainer.tsx       # Animated face transition container
│   │   │   ├── CubeNavigationContext.tsx
│   │   │   └── useCubeNavigation.ts    # Adapted for RN gestures
│   │   ├── auth/
│   │   │   ├── LoginFace.tsx
│   │   │   ├── RegisterFace.tsx
│   │   │   ├── ResetPasswordFace.tsx
│   │   │   ├── LanguageFace.tsx
│   │   │   ├── LogoutFace.tsx
│   │   │   └── InfoFace.tsx
│   │   ├── home/
│   │   │   ├── ChatsFace.tsx
│   │   │   ├── ContactsFace.tsx
│   │   │   ├── MessagesFace.tsx
│   │   │   ├── SettingsFace.tsx
│   │   │   ├── InfoFace.tsx
│   │   │   └── LogoutFace.tsx
│   │   └── ui/                 # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Alert.tsx
│   │       ├── Modal.tsx
│   │       ├── FlatList.tsx
│   │       └── Toast.tsx
│   ├── hooks/                  # Portable hooks (mostly unchanged)
│   │   ├── useAuthCube.ts
│   │   ├── useHomeCube.ts
│   │   ├── useLoginFace.ts
│   │   ├── useChatsFace.ts
│   │   ├── useContactsFace.ts
│   │   ├── useMessagesFace.ts
│   │   ├── useSettingsFace.ts
│   │   ├── useInfoFace.ts
│   │   └── useLogoutFace.ts
│   ├── services/               # API + socket (mostly unchanged)
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   └── socket.service.ts
│   ├── theme/                  # Same token system
│   │   ├── tokens.ts
│   │   ├── dark.ts
│   │   ├── light.ts
│   │   ├── index.ts
│   │   └── ThemeContext.tsx    # Adapted for RN
│   └── lib/
│       ├── i18n.ts             # Same translations
│       └── LanguageContext.tsx
├── app.json
├── package.json
└── tsconfig.json
```

---

## 3. The True 3D Cube (Core Design)

### Concept
The CSS 3D cube is **directly replicated** in React Native using `react-native-reanimated` 3D transforms. All 6 faces are positioned in 3D space, and the entire cube rotates — exactly like the current web implementation. This works identically on **Android, iOS, and desktop web** (Expo Web).

### How It Maps from CSS to Reanimated

| CSS (Current) | Reanimated (Target) |
|---------------|---------------------|
| `perspective: 1200px` on stage | `{ perspective: 1200 }` on container |
| `transform-style: preserve-3d` | Nested `Animated.View` with 3D transforms |
| `rotateX(${x}deg) rotateY(${y}deg)` on cube | `rotateX` + `rotateY` on cube container |
| `translateZ(calc(var(--cube-width)/2))` on front face | `{ translateZ: cubeWidth / 2 }` on front face |
| `rotateY(90deg) translateZ(...)` on right face | `{ rotateY: '90deg' }, { translateZ: cubeWidth / 2 }` |
| `rotateY(-90deg) translateZ(...)` on left face | `{ rotateY: '-90deg' }, { translateZ: cubeWidth / 2 }` |
| `rotateY(180deg) translateZ(...)` on back face | `{ rotateY: '180deg' }, { translateZ: cubeWidth / 2 }` |
| `rotateX(90deg) translateZ(...)` on top face | `{ rotateX: '90deg' }, { translateZ: cubeWidth / 2 }` |
| `rotateX(-90deg) translateZ(...)` on bottom face | `{ rotateX: '-90deg' }, { translateZ: cubeWidth / 2 }` |
| `backface-visibility: hidden` | `{ backfaceVisibility: 'hidden' }` |
| `transition: transform 0.5s ease-out` | `withTiming(targetRotation, { duration: 500 })` |

### Responsive Sizing

| Platform | Cube Size | Behavior |
|----------|-----------|----------|
| **Desktop browser** (Expo Web) | `min(340px, 85vw)` width, `min(520px, 78vh)` height | Centered 3D cube, same as current web |
| **Mobile/Tablet** (Android) | `min(90vw, screenWidth - 48px)` width, `min(78vh, screenHeight - 120px)` height | Larger cube filling most of screen, still rotates in 3D |

The cube dimensions are computed at runtime from `Dimensions.get('window')` and update on rotation/resize.

### Implementation: `CubeContainer.tsx`

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Dimensions, Platform } from 'react-native';

type CubeFace = 'front' | 'left' | 'right' | 'back' | 'top' | 'bottom';

// Face positioning — identical to CSS transforms
const FACE_TRANSFORMS: Record<CubeFace, object> = {
  front:  [{ rotateY: '0deg' },   { translateZ: 0 }], // set dynamically
  right:  [{ rotateY: '90deg' },  { translateZ: 0 }],
  left:   [{ rotateY: '-90deg' }, { translateZ: 0 }],
  back:   [{ rotateY: '180deg' }, { translateZ: 0 }],
  top:    [{ rotateX: '90deg' },  { translateZ: 0 }],
  bottom: [{ rotateX: '-90deg' }, { translateZ: 0 }],
};

function CubeContainer({ faces, rotation, transitionEnabled, onTouchStart, onTouchEnd }) {
  const { width: screenW } = Dimensions.get('window');
  const cubeWidth = Platform.OS === 'web'
    ? Math.min(340, screenW * 0.85)
    : Math.min(screenW * 0.9, screenW - 48);
  const halfCube = cubeWidth / 2;

  // The cube container rotates based on rotation.x and rotation.y
  // (driven by useCubeNavigation — same logic as current web)
  const cubeStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${rotation.x.value}deg` },
      { rotateY: `${rotation.y.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cubeStage, { perspective: 1200 }]}>
        <Animated.View style={[styles.cube, cubeStyle]}>
          {Object.entries(faces).map(([faceName, FaceComponent]) => (
            <Animated.View
              key={faceName}
              style={[
                styles.cubeFace,
                { width: cubeWidth, height: cubeHeight },
                {
                  transform: [
                    ...FACE_TRANSFORMS[faceName].map(t => {
                      // Replace translateZ: 0 with actual halfCube
                      if ('translateZ' in t) return { translateZ: halfCube };
                      return t;
                    }),
                  ],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <FaceComponent />
            </Animated.View>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
```

### Swipe Gesture → Cube Rotation
The existing `useCubeNavigation.ts` rotation math maps **1:1** to Reanimated:

```ts
// Current web (CSS):
style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}

// React Native (Reanimated):
useAnimatedStyle(() => ({
  transform: [
    { perspective: 1200 },
    { rotateX: `${rotationX.value}deg` },
    { rotateY: `${rotationY.value}deg` },
  ],
}))
```

The `goLeft()`, `goRight()`, `goUp()`, `goDown()` functions increment/decrement `yTicks` and compute rotation angles — this logic is **100% portable**. Only the animation driver changes:
- **Web**: CSS `transition: transform 0.5s ease-out`
- **Native**: `withTiming(targetAngle, { duration: 500, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })`

### Touch/Swipe Handling
The current `handleTouchStart`/`handleTouchEnd` logic (40px threshold, dominant axis detection) is portable. On native, we additionally use `react-native-gesture-handler` for smoother gesture recognition:

```ts
const panGesture = Gesture.Pan()
  .onBegin((e) => { touchStartRef.current = { x: e.x, y: e.y }; })
  .onEnd((e) => {
    const dx = e.translationX;
    const dy = e.translationY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < 40 && absDy < 40) return;
    if (absDx > absDy) {
      if (dx < 0) goRight(); else goLeft();
    } else {
      if (dy > 0) goUp(); else goDown();
    }
  });
```

### Haptic Feedback (Native Only)
```ts
import * as Haptics from 'expo-haptics';

// On successful face change:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// On snap-back (swipe didn't meet threshold):
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### Visual Enhancements
- **Green glow on cube edges**: `shadowColor` + `shadowOpacity` on each face border
- **Perspective depth**: The `perspective: 1200` value creates natural depth
- **Smooth rotation**: 500ms cubic-bezier easing matches the current web feel

---

## 4. Key Migration Challenges & Solutions

### 4.1 CSS 3D Transforms → Reanimated 3D Transforms (1:1 Mapping)
| Web (Current) | React Native (Target) |
|---------------|----------------------|
| `perspective: 1200px` on stage | `{ perspective: 1200 }` on container |
| `transform-style: preserve-3d` | Nested `Animated.View` with 3D transforms (native supports this) |
| `rotateX(${x}deg) rotateY(${y}deg)` | `useAnimatedStyle` with `rotateX` + `rotateY` |
| `translateZ(calc(var(--cube-width)/2))` | `{ translateZ: cubeWidth / 2 }` — computed at runtime |
| CSS `transition: transform 0.5s ease-out` | `withTiming(target, { duration: 500, easing: ... })` |
| `backface-visibility: hidden` | `{ backfaceVisibility: 'hidden' }` style property |

**Solution**: The 3D cube is replicated almost identically. `react-native-reanimated` v3 supports all needed 3D transforms (`perspective`, `rotateX`, `rotateY`, `translateZ`, `backfaceVisibility`) on both native and web. The `useCubeNavigation` hook's rotation math is 100% portable — only the animation driver changes from CSS transitions to `withTiming()`.

### 4.2 Bootstrap CSS → React Native Components
| Bootstrap Component | React Native Replacement |
|--------------------|-------------------------|
| `list-group` / `list-group-flush` | `FlatList` with custom item separators |
| `form-control` inputs | Custom `TextInput` with theme styles |
| `btn` / `btn-outline-*` | Custom `TouchableOpacity` + themed styles |
| `card` | Custom `View` with `Card` component |
| `modal` / `offcanvas` | `Modal` from `react-native` or custom overlay |
| `alert` | Custom `Alert` component |
| `accordion` | Custom collapsible `View` with `LayoutAnimation` |
| `row` / `col-*` grid | `Flexbox` (flexDirection: 'row', flexWrap) |
| `form-check` (radio/checkbox) | Custom `Pressable` with icon |

**Solution**: Build a small UI component library (`src/components/ui/`) that maps Bootstrap patterns to React Native primitives using the existing theme tokens.

### 4.3 Cookie-Based Auth → Platform-Specific Storage
| Platform | Session Storage |
|----------|----------------|
| Web (Expo Web) | httpOnly cookies (same as current) |
| Android | `expo-secure-store` for session token |

**Solution**: Create a platform-aware auth service:
```ts
// services/auth.service.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null; // cookies handled automatically
  }
  return SecureStore.getItemAsync('cubcha_session');
}

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync('cubcha_session', token);
}
```

The server API needs a minor update: accept `Authorization: Bearer <token>` header in addition to cookies for native clients.

### 4.4 CSS Variables → Theme Tokens in StyleSheet
The existing `tokens.ts` already defines themes as plain objects — this is directly usable:

```ts
// theme/ThemeContext.tsx (React Native version)
import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { dark } from './dark';
import { light } from './light';
import type { Theme } from './tokens';

const ThemeContext = createContext<Theme>(dark);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');
  const theme = themeName === 'light' ? light : dark;
  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

// Usage in components:
function MyComponent() {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.md,
    },
  });
}
```

### 4.5 Socket.IO Client
`socket.io-client` works in React Native with no changes. The existing `useSocket.ts` hook is fully portable.

### 4.6 Navigation (Next.js Router → Expo Router)
| Next.js | Expo Router |
|---------|-------------|
| `useRouter().push("/home")` | `router.push("/home")` |
| `useSearchParams()` | `useLocalSearchParams()` |
| `app/page.tsx` → `/` | `app/index.tsx` → `/` |
| `app/home/page.tsx` → `/home` | `app/home/index.tsx` → `/home` |

---

## 5. Dependencies (React Native)

### Core
```json
{
  "dependencies": {
    "expo": "~52.x",
    "expo-router": "~4.x",
    "react": "18.x",
    "react-native": "0.76.x",
    "react-native-reanimated": "~3.x",
    "react-native-gesture-handler": "~2.x",
    "react-native-safe-area-context": "~4.x",
    "expo-secure-store": "~14.x",
    "expo-haptics": "~14.x",
    "socket.io-client": "^4.8.3"
  }
}
```

### Why These Libraries
| Library | Purpose |
|---------|---------|
| `react-native-reanimated` | High-performance animations for cube transitions (runs on UI thread) |
| `react-native-gesture-handler` | Native swipe/pan gesture detection |
| `react-native-safe-area-context` | Handle notches, status bars on Android |
| `expo-secure-store` | Encrypted storage for session tokens |
| `expo-haptics` | Haptic feedback on face transitions |

---

## 6. What Stays the Same (Portable Code)

These files can be copied with **minimal or no changes**:

### Hooks (Business Logic) — ~90% portable
- `useLoginFace.ts` — form state + API calls
- `useRegisterFace.ts` — form state + API calls
- `useResetPasswordFace.ts` — form state + API calls
- `useChatsFace.ts` — chat list state + API calls
- `useContactsFace.ts` — contact management state + API calls
- `useMessagesFace.ts` — message state + API calls + socket events
- `useSettingsFace.ts` — settings state + API calls
- `useInfoFace.ts` — info/bug report state + API calls
- `useLogoutFace.ts` — logout logic

### Services — ~80% portable
- `api.service.ts` — needs platform-aware base URL + auth header
- `auth.service.ts` — needs platform-aware token storage
- Socket logic — fully portable

### i18n — 100% portable
- `i18n.ts` — translation objects work as-is
- `LanguageContext.tsx` — minor adaptation for RN

### Theme tokens — 100% portable
- `tokens.ts`, `dark.ts`, `light.ts` — already platform-agnostic

---

## 7. What Needs Rewriting

### Full Rewrite
| Component | Reason |
|-----------|--------|
| All face components (12 total) | HTML/Bootstrap → React Native primitives |
| `globals.css` (1406 lines) | CSS → StyleSheet per component |
| `CubeContainer` | New component replacing CSS 3D cube |
| `useCubeNavigation.ts` | Adapt for RN gestures (react-native-gesture-handler) |
| `CubeNavigationContext.tsx` | Minor adaptation |

### Partial Rewrite
| File | Changes |
|------|---------|
| `api.service.ts` | Add platform-aware auth header |
| `auth.service.ts` | Add SecureStore for native |
| `ThemeContext.tsx` | Use RN context + StyleSheet |
| `useHomeCube.ts` | Minor: remove Next.js router dependency |
| `useAuthCube.ts` | Minor: use Expo Router |

---

## 8. Migration Phases

### Phase 1: Project Setup (1-2 days)
- [ ] Initialize Expo project with TypeScript
- [ ] Configure Expo Router
- [ ] Install dependencies (reanimated, gesture-handler, secure-store, haptics)
- [ ] Copy portable code (hooks, services, i18n, theme tokens)
- [ ] Set up ThemeProvider and LanguageProvider for RN
- [ ] Configure API base URL for both web and native

### Phase 2: UI Component Library (3-4 days)
- [ ] Build `Button` component (replaces `.auth-btn`, `.ghost-btn`)
- [ ] Build `Input` component (replaces `.auth-input`)
- [ ] Build `Card` component (replaces `.auth-card`, `.register-card`)
- [ ] Build `Alert` component (replaces `.auth-alert`, `.auth-success`, `.auth-error`)
- [ ] Build `Modal` component (replaces drawer/modal patterns)
- [ ] Build `FlatList` wrappers (replaces `list-group`)
- [ ] Build `Toast` component (replaces `.toast-green`)
- [ ] Build collapsible/accordion component (for Contacts face sections)

### Phase 3: Cube Container + Navigation (3-4 days)
- [ ] Implement `CubeContainer` with reanimated
- [ ] Implement swipe gesture detection with gesture-handler
- [ ] Implement slide + tilt animation for horizontal transitions
- [ ] Implement slide + tilt animation for vertical transitions
- [ ] Add haptic feedback on face change
- [ ] Adapt `useCubeNavigation.ts` for RN (remove keyboard, adapt touch)
- [ ] Update `CubeNavigationContext` for RN
- [ ] Test all 4 swipe directions + triple-tap navigation

### Phase 4: Auth Cube Faces (3-4 days)
- [ ] Rewrite `LoginFace` with RN components
- [ ] Rewrite `RegisterFace` with RN components
- [ ] Rewrite `ResetPasswordFace` with RN components
- [ ] Rewrite `LanguageFace` with RN components
- [ ] Rewrite `LogoutFace` with RN components
- [ ] Rewrite `InfoFace` with RN components
- [ ] Wire up auth cube in `app/index.tsx`
- [ ] Test full auth flow (login → redirect to home)

### Phase 5: Home Cube Faces (5-7 days)
- [ ] Rewrite `ChatsFace` (list + new chat creation)
- [ ] Rewrite `ContactsFace` (most complex — 7 accordion sections, 841 lines)
- [ ] Rewrite `MessagesFace` (real-time chat with socket.io)
- [ ] Rewrite `SettingsFace` (theme/lang/timezone selectors)
- [ ] Rewrite `InfoFace` (info items + bug reporting)
- [ ] Rewrite `LogoutFace`
- [ ] Wire up home cube in `app/home/index.tsx`
- [ ] Test real-time messaging end-to-end

### Phase 6: Server API Updates (1-2 days)
- [ ] Add `Authorization: Bearer` header support in auth middleware
- [ ] Return session token in login response body (for native clients)
- [ ] Test both cookie (web) and header (native) auth flows

### Phase 7: Polish & Testing (3-4 days)
- [ ] Test on Android device/emulator
- [ ] Test on Expo Web (browser)
- [ ] Optimize animation performance
- [ ] Add loading states and error boundaries
- [ ] Test offline behavior and reconnection
- [ ] Accessibility audit (screen reader support)
- [ ] Performance profiling

### Total Estimated Time: 19-27 days

---

## 9. Server-Side Changes Required

Minimal — the server is already a standalone Express API:

1. **Auth middleware** (`server/src/middleware/auth.middleware.ts`):
   - Currently reads `cubcha_session` from cookies
   - Add: also check `Authorization: Bearer <token>` header
   - If header token is valid, authenticate the request

2. **Login route** (`server/src/routes/auth.ts`):
   - Currently sets cookie only
   - Add: also return `{ token: "..." }` in response body for native clients

3. **CORS** (if native app uses different origin):
   - Already configured for the VPS domain
   - Native Android app will use the same API URL

---

## 10. Cube Face Layout Map

### Auth Cube
```
         [Top: Logout]
            ↑ (swipe down)
[Left: Language] ← [Front: Login] → [Right: Register]
            ↓ (swipe up)
        [Bottom: Info]
         [Back: Reset Password]
```

### Home Cube
```
         [Top: Logout]
            ↑ (swipe down)
[Left: Contacts] ← [Front: Chats] → [Right: Messages]
            ↓ (swipe up)
        [Bottom: Info]
         [Back: Settings]
```

---

## 11. Animation Specification

### Cube Rotation (Same as Current Web)
```
Duration: 500ms
Easing: cubic-bezier(0.2, 0.8, 0.2, 1)  // decelerate — matches current CSS

Horizontal rotation (swipe left/right):
  - rotateY: current → current ± 90deg
  - rotateX: stays at baseX (-5deg)
  - All 6 faces rotate together as one cube

Vertical rotation (swipe up/down):
  - rotateX: current → current ± 90deg
  - rotateY: snaps to 0 first (no animation), then rotateX animates
  - Same two-step snap as current web implementation

Perspective: 1200 (creates natural 3D depth)
```

### Interactive Gesture Feedback
```
During swipe (before release):
  - Cube rotates in real-time following finger (via shared values)
  - Max interactive rotation: ±45deg (half of a face transition)
  - On release below threshold: spring back to current face
  - On release above threshold: animate to next face (500ms)
```

### Haptic Feedback (Native Only)
- Light tap on swipe start (`Haptics.impactAsync(Light)`)
- Medium impact on face change completion (`Haptics.impactAsync(Medium)`)
- Error vibration on snap-back (`Haptics.notificationAsync(Error)`)

---

## 12. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ContactsFace complexity (841 lines, 7 sections) | High | Break into sub-components, tackle section by section |
| Animation performance on low-end Android | Medium | Use Reanimated (UI thread), avoid JS thread animations |
| Cookie auth on Android WebView | Medium | Use Bearer token header for native, cookies for web only |
| Bootstrap grid/layout patterns | Low | Flexbox covers all needed layouts |
| Socket.IO reconnection on mobile | Medium | Already handled by socket.io-client, add AppState listener |
| Expo Web compatibility | Low | Expo Web is mature, most RN libs support web |

---

## 13. Summary

**The 3D cube is fully replicable in React Native on all platforms.** Key points:

1. The **true 3D CSS cube** is directly replicated using `react-native-reanimated` 3D transforms (`perspective`, `rotateX`, `rotateY`, `translateZ`, `backfaceVisibility`)
2. The cube **looks and behaves identically** on desktop web (Expo Web) and Android — same 3D rotation, same perspective, same face positioning
3. The **swipe gestures** (left/right/up/down) drive the same rotation math as the current web implementation
4. The `useCubeNavigation` hook's rotation logic (`yTicks`, `rotation.x/y`, `goLeft/Right/Up/Down`) is **100% portable** — only the animation driver changes from CSS transitions to `withTiming()`
5. **~70% of the business logic** (hooks, services, i18n, theme tokens) is directly portable
6. The **server needs minimal changes** (add Bearer token auth alongside cookies)
7. **Expo** is the ideal framework for single-codebase Android + Web deployment
8. **Responsive sizing**: compact cube on desktop (~340px), larger cube on mobile (~90vw), same 3D behavior everywhere

---

## 14. Readiness Review (2026-08-28)

### Current State of `client_rn`

The Expo project has been initialized and the core cube infrastructure is in place. Here is where things stand against the planned phases:

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project Setup | ✅ Done — Expo project created, deps installed, providers wired, platform-aware API base URL |
| Phase 2 | UI Component Library | ⚠️ Skipped by design — `src/components/ui/` does not exist; faces use inline RN primitives (TouchableOpacity/TextInput/StyleSheet) with a lightweight ad-hoc toast in `app/index.tsx`. Acceptable; extract primitives later if duplication grows |
| Phase 3 | Cube Container + Navigation | ✅ Done — `CubeContainer.tsx` (3D matrix math for Android, `preserve-3d` for web/iOS) and `useCubeNavigation.ts` (shared values, gestures, triple-tap, finger-following drag). ⚠️ Haptic feedback not yet wired (`expo-haptics` installed but unused) |
| Phase 4 | Auth Cube Faces | ✅ Done — all 6 faces (`LoginFace`, `RegisterFace`, `ResetPasswordFace`, `LanguageFace`, `LogoutFace`, `InfoFace`) + hooks ported and wired in `app/index.tsx`. TSC passes with 0 errors |
| Phase 5 | Home Cube Faces | ❌ Not started — `app/home/` does not exist. ⚠️ Note: login success already does `router.push("/home")`, so tapping "Go home" currently has no destination |
| Phase 6 | Server API Updates | ✅ Done — `auth.middleware.ts` accepts `Authorization: Bearer` headers, login response returns `token: sessionToken` in body |
| Phase 7 | Polish & Testing | ❌ Not started — no device/emulator test pass yet, no haptics, no error boundaries, no accessibility audit |

### What Exists in `client_rn` (updated 2026-08-28)

```
client_rn/
├── app/
│   ├── _layout.tsx                  # Root layout (GestureHandlerRootView, StatusBar, Stack, providers)
│   └── index.tsx                    # Auth cube screen — all 6 real faces wired
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginFace.tsx        # ✅ ported
│   │   │   ├── RegisterFace.tsx     # ✅ ported
│   │   │   ├── ResetPasswordFace.tsx# ✅ ported
│   │   │   ├── LanguageFace.tsx     # ✅ ported
│   │   │   ├── LogoutFace.tsx       # ✅ ported
│   │   │   └── InfoFace.tsx         # ✅ ported (heading_cube + null-safe date fix)
│   │   └── cube/
│   │       └── CubeContainer.tsx    # Full 3D cube (matrix math for Android, preserve-3d elsewhere); face label removed per user request
│   ├── hooks/
│   │   ├── useLoginFace.ts          # ✅ ported
│   │   ├── useRegisterFace.ts       # ✅ ported
│   │   ├── useResetPasswordFace.ts  # ✅ ported
│   │   ├── useLanguageFace.ts       # ✅ ported
│   │   ├── useLogoutFace.ts         # ✅ ported
│   │   └── useInfoFace.ts           # ✅ ported
│   ├── lib/
│   │   ├── api.ts                   # Platform-aware base URL + Bearer token + clearToken()
│   │   ├── i18n.ts                  # ✅ ported
│   │   ├── formTypes.ts             # ✅ ported
│   │   ├── LanguageContext.tsx      # ✅ ported (platform-aware storage)
│   │   └── useCubeNavigation.ts     # Navigation hook (Reanimated shared values, gestures, drag, triple-tap)
│   ├── services/
│   │   ├── api.service.ts           # ✅ ported
│   │   └── auth.service.ts          # ✅ ported
│   └── theme/
│       ├── tokens.ts / dark.ts / light.ts / index.ts  # ✅ ported
│       └── ThemeContext.tsx         # ✅ ported
├── app.json                         # Android config, adaptive icons, Expo plugins
├── package.json                     # All deps installed (incl. expo-haptics, not yet used)
└── restore-android-config.sh        # Gradle config for low-memory builds
```

### Known Deviations From the Plan

1. **No `useAuthCube.ts` hook** — auth cube wiring (face map, login/logout callbacks, toast) is done directly in `app/index.tsx` instead of a dedicated hook. Functionally equivalent.
2. **No `CubeNavigationContext.tsx`** — the web client has it; the RN port passes navigation values as props. Fine for now.
3. **No shared UI primitives (`src/components/ui/`)** — faces use inline RN components. Deviation from Phase 2, acceptable short-term.
4. **`/home` route missing** — `app/index.tsx` pushes `/home` on login success but `app/home/index.tsx` does not exist yet (Phase 5). This is the most critical gap: a successful login currently dead-ends.

### Corrections to This Plan

The following inaccuracies were found in the document and are noted here for reference:

1. **§1 table** says auth storage is "AsyncStorage on native" — this contradicts §4.3 which correctly specifies `expo-secure-store`. **Use `expo-secure-store`** as described in §4.3.

2. **§5 Dependencies** lists outdated version targets (Expo ~52.x, RN 0.76.x, Reanimated ~3.x). The actual installed versions are **Expo ~57.0.16, React Native 0.86.2, Reanimated 4.5.1**. The dependency list should be updated to reflect these.

3. **Phase 3 is already complete** — the checklist items in §8 Phase 3 should be marked as done. The cube container, navigation hook, gestures, and keyboard support are all implemented.

4. **§4.3 / Phase 1 — API base URL** needs attention: the current `client/src/lib/api.ts` relies on `process.env.NEXT_PUBLIC_API_BASE_URL` and `window.location.origin`, neither of which works in React Native. A platform-aware URL resolver is needed (e.g., `expo-constants` or a hardcoded URL for native).

### Verdict (updated 2026-08-28)

**Phases 1, 3, 4, 6 are complete. Phase 2 was deliberately skipped (inline RN primitives instead of a shared UI library).**

The logical next step is **Phase 5 (Home Cube Faces)** — it is the most critical gap because a successful login in `app/index.tsx` already does `router.push("/home")`, but `app/home/index.tsx` does not exist, so authenticated users currently hit a dead end.

Recommended order for Phase 5:
1. Create `app/home/index.tsx` with a minimal shell (reuse the cube + nav infra from the auth screen)
2. Port `useHomeCube` + `ChatsFace` (front face) first
3. Then `MessagesFace` (socket.io real-time), `ContactsFace` (largest, 841 lines on web), `SettingsFace`, `InfoFace`, `LogoutFace`
4. Follow with Phase 7 polish: wire haptics (`expo-haptics` already installed), test on device/emulator and Expo Web
