# Migration Plan: Expo (client_rn) → React Native CLI (client_v1)

## Objective
Migrate the 3D cube navigation from `client_rn` (Expo) to `client_v1` (React Native CLI) **without any Expo dependencies**.

---

## Current State Analysis

### client_rn (Expo) - Source
- **Framework**: Expo SDK ~57.0.8
- **Navigation**: expo-router
- **Components**: 3D cube with gesture handling
- **Entry**: `index.ts` → expo-router
- **Screens**: Auth cube (index.tsx) with placeholder faces
- **Assets**: Icons for Android/iOS/web

### client_v1 (React Native CLI) - Target
- **Framework**: React Native 0.86.2
- **Navigation**: @react-navigation/native (already installed)
- **Current**: Basic template app (NewAppScreen)
- **Entry**: `index.js` → AppRegistry
- **Native folders**: android/, ios/ already set up

---

## What Will Be Migrated

### ✅ Components to Migrate
1. **CubeContainer.tsx** - 3D cube rendering with gestures
2. **useCubeNavigation.ts** - Cube navigation logic and state
3. **AuthCubeScreen.tsx** - Example screen showing cube usage
4. **Assets** - Icons and splash screens

### ❌ NOT Migrating (Doesn't Exist Yet)
- Home cube screen
- Actual face components (Login, Register, etc.)
- API services
- Theme system
- i18n
- Socket integration

---

## Migration Steps

### Phase 1: Dependencies & Configuration

#### Step 1.1: Update client_v1/package.json
**Remove:**
- `@react-native/new-app-screen` (boilerplate placeholder)

**Keep (already installed):**
- `@react-navigation/native` ✅
- `@react-navigation/native-stack` ✅
- `react-native-reanimated` ✅
- `react-native-gesture-handler` ✅
- `react-native-safe-area-context` ✅
- `react-native-screens` ✅
- `react-native-keychain` ✅ (replaces expo-secure-store)

**Add:**
- `react-native-haptics` (replaces expo-haptics)
- `react-native-splash-screen` (replaces expo-splash-screen)

#### Step 1.2: Update client_v1/app.json
Add from client_rn:
```json
{
  "name": "CubCha",
  "displayName": "CubCha",
  "slug": "cubcha",
  "scheme": "cubcha",
  "version": "1.0.0",
  "orientation": "portrait",
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.cubcha.app"
  },
  "android": {
    "package": "com.cubcha.app",
    "adaptiveIcon": {
      "backgroundColor": "#E6F4FE",
      "foregroundImage": "./assets/android-icon-foreground.png",
      "backgroundImage": "./assets/android-icon-background.png",
      "monochromeImage": "./assets/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  },
  "web": {
    "favicon": "./assets/favicon.png"
  }
}
```

#### Step 1.3: Update client_v1/tsconfig.json
Change extends from `@react-native/typescript-config` to match Expo's strict mode:
```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "strict": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

---

### Phase 2: Copy Cube Components

#### Step 2.1: Create directory structure
```bash
mkdir -p client_v1/src/components/cube
mkdir -p client_v1/src/screens
mkdir -p client_v1/assets
```

#### Step 2.2: Copy CubeContainer.tsx
**From:** `client_rn/src/components/cube/CubeContainer.tsx`  
**To:** `client_v1/src/components/cube/CubeContainer.tsx`  
**Changes:** None - works as-is

#### Step 2.3: Copy useCubeNavigation.ts
**From:** `client_rn/src/components/cube/useCubeNavigation.ts`  
**To:** `client_v1/src/components/cube/useCubeNavigation.ts`  
**Changes:** None - works as-is

#### Step 2.4: Copy AuthCubeScreen.tsx
**From:** `client_rn/app/index.tsx`  
**To:** `client_v1/src/screens/AuthCubeScreen.tsx`  
**Changes:** 
- Remove expo-router imports
- Replace expo-status-bar with react-native StatusBar
- Adapt to use as a regular screen component

---

### Phase 3: Copy Assets

#### Step 3.1: Copy all assets
```bash
cp -r client_rn/assets/* client_v1/assets/
```

**Files to copy:**
- android-icon-background.png
- android-icon-foreground.png
- android-icon-monochrome.png
- favicon.png
- icon.png
- splash-icon.png

---

### Phase 4: Set Up Navigation

#### Step 4.1: Create AppNavigator.tsx
**Location:** `client_v1/src/navigation/AppNavigator.tsx`

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthCubeScreen from '../screens/AuthCubeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="AuthCube"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen 
              name="AuthCube" 
              component={AuthCubeScreen} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

#### Step 4.2: Update App.tsx
**Replace entire content of:** `client_v1/App.tsx`

```typescript
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

---

### Phase 5: Install Dependencies

#### Step 5.1: Install npm packages
```bash
cd client_v1
npm install react-native-haptics react-native-splash-screen
npm uninstall @react-native/new-app-screen
```

#### Step 5.2: Install pods (iOS)
```bash
cd client_v1/ios && pod install && cd ..
```

---

### Phase 6: Test

#### Step 6.1: Run on iOS
```bash
cd client_v1
npm run ios
```

#### Step 6.2: Run on Android
```bash
cd client_v1
npm run android
```

#### Step 6.3: Verify functionality
- ✅ Cube renders with 6 faces
- ✅ Swipe gestures work (left/right/up/down)
- ✅ Keyboard navigation works on web (arrow keys)
- ✅ Animations are smooth
- ✅ No Expo dependencies in package.json
- ✅ No console errors

---

## Technical Details

### No Expo Dependencies Used
The cube components use only:
- `react-native` (core)
- `react-native-reanimated` (animations)
- `react-native-gesture-handler` (gestures)
- `react-native-safe-area-context` (safe area)

All of these are **standard React Native libraries** that work without Expo.

### Keyboard Navigation
The keyboard navigation is **already implemented** in CubeContainer.tsx:
```typescript
useEffect(() => {
  if (Platform.OS !== "web") return;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft": goRight(); break;
      case "ArrowRight": goLeft(); break;
      case "ArrowDown": goUp(); break;
      case "ArrowUp": goDown(); break;
    }
  };
  
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [goLeft, goRight, goUp, goDown]);
```

This works on:
- ✅ Web (when running web build)
- ✅ Automatically disabled on mobile (Platform.OS check)

### Navigation Compatibility
@react-navigation/native is:
- ✅ The standard for React Native apps
- ✅ Used by Facebook, Instagram, Discord
- ✅ Fully native on iOS/Android
- ✅ Works with React Native CLI
- ✅ No Expo required

---

## Rollback Plan

If issues occur:
1. Keep `client_rn` folder intact (don't delete)
2. Git commit before migration
3. Can revert to Expo version anytime

---

## Success Criteria

- [ ] App launches on iOS without crashes
- [ ] App launches on Android without crashes
- [ ] Cube renders with all 6 faces
- [ ] Swipe gestures work on mobile
- [ ] Keyboard navigation works on web
- [ ] No Expo packages in package.json
- [ ] No console errors
- [ ] Animations are smooth (60fps)

---

## Next Steps After Migration

Once cube is working:
1. Build actual face components (Login, Register, etc.)
2. Add home cube screen
3. Integrate API services
4. Add theme system
5. Add i18n
6. Add socket.io for chat

---

## Estimated Time
- **Phase 1-2**: 30 minutes (config + copy files)
- **Phase 3**: 10 minutes (assets)
- **Phase 4**: 20 minutes (navigation setup)
- **Phase 5**: 15 minutes (install deps)
- **Phase 6**: 30 minutes (testing)
- **Total**: ~1.5 - 2 hours

---

## Notes
- All cube components are **pure React Native** - no Expo-specific code
- The migration is mostly **copy-paste** with minimal changes
- Keyboard navigation is preserved from Expo version
- The cube will look and behave **identically** to Expo version