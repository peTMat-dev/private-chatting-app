## Brief Android Conversion Plan:

### Current State:

- ✅ Face components exist (pure UI)
- ❌ Business logic is in monolithic page components (568 + 1145 lines)

### Conversion Strategy (3 Phases):

__Phase 1: Extract Face-Specific Hooks__ (12-16 hours)

- Create one hook per face (useLoginFace, useChatsFace, etc.)
- Each hook contains ONLY that face's business logic
- Hooks are platform-agnostic (work on Web AND Android)

__Phase 2: Create Cube Orchestrators__ (3-5 hours)

- Create useAuthCube and useHomeCube (web-only)
- These compose face hooks + add 3D cube navigation
- Pages become thin orchestrators (~50 lines each)

__Phase 3: Android Conversion__ (8-10 hours)

- Copy face hooks to React Native project (no changes!)
- Copy face components, adapt styles (CSS → StyleSheet)
- Replace cube orchestrators with React Native navigation
- Reuse 90% of code

### Key Insight:

__Face hooks = portable logic__ (copy to Android)\
__Face components = portable UI__ (adapt styles only)\
__Cube hooks = web-only__ (replace with React Navigation)

### Portability Rules (ENFORCEABLE — must hold before a hook is "portable")

A face hook is ONLY portable if ALL of the following are true:

1. **No web-only imports.** A face hook MUST NOT import or use any of:
   - `window`, `document`, `localStorage`, `sessionStorage`
   - `next/navigation` (`useRouter`, `useSearchParams`, etc.)
   - `useCubeNav` / `CubeNavigationContext` (cube navigation is web-only)
   - Any DOM type (`HTMLElement`, `KeyboardEvent<HTMLDivElement>`, etc.)
2. **Inject web-only behavior via props.** Anything platform-specific (navigation, storage, redirect) is passed in by the web orchestrator. Example: `useLogoutFace({ goUp, goLeft, onLoggedOut })` — the hook calls `onLoggedOut()`, the web component supplies the `localStorage`/`window.location` logic.
3. **Typed API responses.** Every `postJson<T>` call MUST supply an explicit response type `T`. No `unknown` defaults in portable code. Service-layer wrappers (`auth.service.ts`) must return typed results (`AuthResponse`), never raw `unknown`.
4. **Typed setters.** Form-state setters exposed by a hook must accept `Dispatch<SetStateAction<T>>` (both value and updater form), so components can call `setForm(prev => ({...prev}))`.

### Verification Gate (Definition of Done — run BEFORE declaring a hook portable)

Before marking any face hook "complete", run and confirm:

- `npx tsc --noEmit` → 0 errors in `client/src/hooks/` and `client/src/app/components/auth/`
- `grep -rE "useCubeNav|localStorage|window\.|next/navigation" client/src/hooks/use{Login,Register,ResetPassword,Logout,Info,Language}Face.ts` → **0 matches** (only `useAuthCube.ts` / `useHomeCube.ts` may match)
- Each hook's props explicitly declare every injected web dependency

If any check fails, the hook is NOT portable and must be fixed before proceeding.

### Result:

- Web: Clean, testable, maintainable code
- Android: 90% code reuse, fast conversion
********************************************************

Yes, I'm ready to follow the analysis and plan!

## What I Understand:

__Phase 1: Extract Face-Specific Hooks__ (Start here)

- Create 12 face hooks (6 auth + 6 home)
- Each hook contains business logic for one face
- Hooks are platform-agnostic (reusable for Android)

__Phase 2: Create Cube Orchestrators__

- Create useAuthCube and useHomeCube
- Compose face hooks + add web-specific navigation
- Refactor pages to ~50 lines each

__Phase 3: Android Conversion__ (Future)

- Copy face hooks to React Native (no changes!)
- Adapt face components (CSS → StyleSheet)
- Replace cube hooks with React Navigation

## Ready to Start:

I can begin implementing __Phase 1__ whenever you're ready. I'll start with:

1. __Auth face hooks__ (simpler, good starting point)

   - useLoginFace.ts
   - useRegisterFace.ts
   - useResetPasswordFace.ts
   - useLanguageFace.ts
   - useLogoutFace.ts
   - useInfoFace.ts

2. __Home face hooks__ (more complex)

   - useChatsFace.ts
   - useContactsFace.ts
   - useMessagesFace.ts
   - useSettingsFace.ts
   - useInfoFace.ts
   - useLogoutFace.ts

Each hook will be:

- Fully tested before moving to next
- Committed to git
- Platform-agnostic for Android reuse
