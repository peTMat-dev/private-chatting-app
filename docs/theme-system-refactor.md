# Theme System Refactor Plan

## Overview

This document outlines the phased approach to refactoring the global CSS and color system into a comprehensive Theme System using React Context.

**Current State:** CSS variables in `globals.css`  
**Target State:** Theme system with design tokens exposed through ThemeContext  
**Approach:** Incremental migration in 6 phases

---

## Theme Contract Definition

Before writing any code, defifne the Theme object structure. This becomes the contract that both Web and Android consume.

```
Theme
 ├── colors
 │   ├── green (primary accent)
 │   ├── greenStrong
 │   ├── greenSoft
 │   ├── greenLabel
 │   ├── background (was 'black')
 │   ├── panel
 │   ├── panelMuted
 │   ├── text (was 'form-text')
 │   ├── inputBg
 │   ├── border
 │   ├── borderStrong
 │   ├── error
 │   ├── success
 │   └── warning
 ├── typography
 │   ├── fontFamily
 │   ├── fontSize
 │   ├── fontWeight
 │   └── lineHeight
 ├── spacing
 │   ├── xs, sm, md, lg, xl
 ├── radius
 │   ├── sm, md, lg, full
 ├── shadows
 │   ├── soft
 │   └── strong
 └── animation
     ├── duration
     └── easing
```

This contract ensures both platforms consume the same theme structure.

---

## Phase 0 – Define Theme Contract

**Goal:** Create the Theme type definition before any implementation.

### Actions

1. Create `src/theme/tokens.ts` with complete Theme interface
2. Document each token's purpose and usage
3. Get team sign-off on structure
4. **No implementation yet - only types**

### Success Criteria

- Theme interface fully defined
- Both web and mobile teams understand the contract
- No code written, only type definitions

---

## Phase 1 – Create Theme Infrastructure

**Goal:** Set up theme system without touching components.

### New Folder Structure

```
src/
    theme/
        tokens.ts          # Theme type definitions
        light.ts           # Light theme values
        ThemeContext.tsx   # React context provider
```

### Actions

1. Create `src/theme/` directory
2. Create `tokens.ts` - Define Theme interface (from Phase 0)
3. Create `light.ts` - Extract all design values from `globals.css`
4. Create `ThemeContext.tsx` - Implement provider with SSR support
5. Wrap app in `ThemeProvider` in `layout.tsx` (similar to LanguageProvider)
6. **Do NOT touch any components yet**

### SSR-Safe Implementation

Follow the LanguageContext pattern for SSR:

```typescript
// Read initial theme from cookie in layout.tsx (server-side)
const cookieStore = await cookies();
const cookieTheme = cookieStore.get("cubcha_theme")?.value;
const initialTheme = cookieTheme && isValidTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;

// Pass to ThemeProvider
<ThemeProvider initialTheme={initialTheme}>
  {children}
</ThemeProvider>
```

### Success Criteria

- ThemeProvider wraps application
- Theme values accessible via `useTheme()` hook
- No visual changes to app
- SSR hydration works (no flash of wrong theme)
- Theme persists via cookies

---

## Phase 2 – Temporary CSS Bridge

**Goal:** Keep CSS working during migration while Theme manages values.

### Approach

This is the web styling layer. ThemeContext is the source of truth, and CSS variables expose theme values to CSS.

**During migration:** Keep CSS variables, but generate/update them from Theme.

**After Phase 3:** CSS variables remain the primary web styling interface. ThemeContext is the source of truth that updates them. They are not removed because the app has a CSS-heavy 3D cube UI and animations.

### Actions

1. ThemeProvider updates CSS variables via `useEffect`:
   ```typescript
   useEffect(() => {
     const root = document.documentElement;
     root.style.setProperty('--color-green', theme.colors.green);
     root.style.setProperty('--color-panel', theme.colors.panel);
     // ... etc
   }, [theme]);
   ```
2. Components continue using CSS variables (no changes needed)
3. The Theme object is the single source of truth
4. ThemeContext exposes the current Theme to the application
5. **Components don't know about ThemeContext yet**

### What STAYS in globals.css

```css
/* CSS Reset */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* Body/HTML base */
body { ... }

/* Scrollbar styling */
::-webkit-scrollbar { ... }

/* Animations */
@keyframes cube-rotate { ... }
@keyframes fade-in { ... }

/* Cube transforms */
.cube-container { ... }
.face { ... }

/* Layout utilities */
.flex { ... }
.grid { ... }
```

### What CHANGES in globals.css

CSS variables remain, but are now managed by ThemeContext instead of being hardcoded in `:root`.

### Success Criteria

- CSS variables auto-update when theme changes
- Components work exactly as before
- The Theme object is the single source of truth, exposed through ThemeContext
- Easy to verify: change theme object, see CSS variables update

---

## Phase 3 – Component Migration (Gradual)

**Goal:** Components consume theme values through the Theme system. During migration, most components continue using CSS variables generated from Theme.

### Key Principle

**Preferred approach:** CSS variables generated from Theme.

Components use CSS variables as before, but values come from Theme-generated CSS variables.

**Exception:** Use `theme.colors.xxx` directly when a value must be computed in JavaScript.

This ensures consistency across the codebase. Don't mix multiple approaches - pick one and stick with it.

### Migration Pattern Examples

**Before (CSS variables):**
```tsx
const styles = {
  backgroundColor: 'var(--color-panel)',
  color: 'var(--color-green)'
};
```

**After (Option A - Inline styles):**
```tsx
const theme = useTheme();
const styles = {
  backgroundColor: theme.colors.panel,
  color: theme.colors.green
};
```

**After (Option B - CSS classes, theme-generated variables):**
```tsx
// Component stays the same, CSS variables now come from ThemeContext
const styles = {
  backgroundColor: 'var(--color-panel)', // Still works!
  color: 'var(--color-green)'
};
```

### Actions

1. Start with simplest components (InfoFace, LanguageFace)
2. Migrate each component to use the preferred Theme architecture (CSS variables generated from Theme)
3. Use direct `theme.xxx` access only when JavaScript calculations require it
4. Work through auth components
5. Then home components
6. Update one component at a time
7. Test each component after migration

### Priority Order

1. **Auth faces** (simpler, less state)
   - InfoFace.tsx
   - LanguageFace.tsx
   - LoginFace.tsx
   - RegisterFace.tsx
   - ResetPasswordFace.tsx
   - LogoutFace.tsx

2. **Home faces** (more complex)
   - InfoFace.tsx
   - SettingsFace.tsx
   - ContactsFace.tsx
   - ChatsFace.tsx
   - MessagesFace.tsx
   - LogoutFace.tsx

3. **Hooks** (if they use theme values)

### Success Criteria

- Each component uses Theme (via CSS variables or direct access)
- No hardcoded design values in components
- Visual appearance unchanged
- Consistent approach across all components
- Tests pass after each component migration

---

## Phase 4 – Settings Integration

**Goal:** User customization through SettingsFace → ThemeContext → re-render.

### Important: This is About User-Customizable Colors

Your current project already supports dark/light mode. The Theme System must preserve the existing modes while moving color control into ThemeContext. Future color customization and presets should build on the same system.

### Current Flow (CSS Variables)

```
SettingsFace
    ↓
update CSS variables (document.documentElement.style)
    ↓
browser repaints
```

### New Flow (ThemeContext)

```
SettingsFace
    ↓
update ThemeContext state
    ↓
context consumers re-render (or CSS variables update)
    ↓
new theme values applied
```

### Actions

1. Update `useSettingsFace.ts` hook to manage theme state
2. Add color customization UI in SettingsFace (color pickers, presets)
3. Theme changes persist through the user database and are restored when the user logs in.
4. Keep CSS variable bridge. Settings updates ThemeContext, which updates CSS variables automatically.
5. SettingsFace becomes the theme customization interface

### Success Criteria

- Users can customize theme colors in settings without breaking existing dark/light modes
- Changes persist across sessions
- All components update immediately
- No direct CSS variable manipulation from SettingsFace or hooks
- ThemeContext handles CSS variable updates
- Existing dark/light mode continues to work through ThemeContext

---

## Phase 5 – Android Compatibility

**Goal:** Ensure theme system works for future Android app.

### Architecture Benefit

Android app will consume the same theme structure:

```typescript
// Web
const theme = useTheme();

// Android (React Native)
const theme = useTheme(); // Same API
```

### Actions

1. Document Theme API for mobile team
2. Export theme types from shared package (if applicable)
3. Ensure theme is platform-agnostic (no web-specific CSS)
- Theme tokens contain values only (colors, spacing, typography, etc.)
- CSS variables and cube rendering stay web-specific
- Android will consume the same theme values but implement its own rendering
4. Create usage examples for React Native

### Success Criteria

- Theme API documented
- No web-specific code in theme definitions
- Mobile team can consume same theme structure
- Theme tokens are platform-agnostic

---

## What Belongs Where

### ✅ Theme (TypeScript)
- Color values
- Typography settings
- Spacing scale
- Border radius values
- Shadow definitions
- Animation timings

### ✅ globals.css (Permanent)
- CSS reset rules
- HTML/body base styles
- Scrollbar styling
- Keyframe animations
- **Core cube rendering and 3D navigation mechanics** ⭐
- Perspective and transform rules
- Cube animation keyframes
- Layout utilities (flex, grid helpers)

> **Note:** The cube is a core identity element of the application. Do not move the cube engine into ThemeContext.

### ✅ Hybrid (During Migration - Phase 2-3)
- CSS variables generated from ThemeContext
- Used by web components and CSS styles
- ThemeContext remains the single source of truth
- CSS variables are not legacy; they are the web rendering layer
- The cube engine, animations, transforms, and layout remain CSS-based

---

## Benefits of This Approach

1. **Type Safety** - Theme values are typed, not string-based CSS variables
2. **IDE Support** - Autocomplete for theme values
3. **User Customization** - Easy to add color pickers and presets
4. **Android Ready** - Same theme structure works on mobile
5. **Maintainability** - The Theme object is the single source of truth for design values
6. **Consistency** - Follows existing pattern (LanguageContext)
7. **Future-proof** - ThemeContext can be replaced without changing Theme structure

---

## Risk Mitigation

1. **Incremental approach** - App works after each phase
2. **Component-by-component** - Easy to rollback if issues
3. **No breaking changes** - CSS variables remain as fallback during migration
4. **SSR-safe** - Theme detection via cookies prevents hydration mismatch
5. **Test coverage** - Verify each component after migration

---

## Related Files

- `client/src/app/globals.css` - Current global styles
- `client/src/lib/LanguageContext.tsx` - Pattern to follow for SSR
- `client/src/app/layout.tsx` - Where ThemeProvider will wrap app
- `client/src/app/components/home/SettingsFace.tsx` - Theme customization UI
- `client/src/hooks/useSettingsFace.ts` - Settings state management

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 0 (define Theme contract)
3. Implement incrementally
4. Test thoroughly after each phase
5. Deploy incrementally
