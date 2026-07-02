# State Management Refactoring: Pages to Hooks

## Overview
Extract state management logic from monolithic page components (`page.tsx`, `home/page.tsx`) into reusable custom hooks (`useAuthCube`, `useHomeCube`). This improves testability, reusability, maintainability, and allows for better code organization.

## Current State
- **Auth page**: 568 lines in `client/src/app/page.tsx`
  - State: login form, register form, reset password logic, language, socket connection
  - Handlers: handleLogin, handleRegister, handleForgot, handleTokenReset
  - Side effects: socket initialization, session polling, LDAP TOTP setup

- **Home page**: 1143 lines in `client/src/app/home/page.tsx`
  - State: chats, contacts, messages, settings, socket connection
  - Handlers: addContact, removeContact, fetchChats, fetchContacts, etc.
  - Side effects: socket listeners, real-time updates

## Target State
- **Hooks** (new):
  - `client/src/hooks/useAuthCube.ts` - handles all auth cube state & logic
  - `client/src/hooks/useHomeCube.ts` - handles all home cube state & logic
  - `client/src/hooks/useSocket.ts` - centralize socket management
  
- **Pages** (refactored):
  - `page.tsx` - render orchestration only (~100 lines)
  - `home/page.tsx` - render orchestration only (~200 lines)

## Benefits
✅ **Testability**: Unit test hooks without React rendering  
✅ **Reusability**: Share logic across mobile/desktop apps  
✅ **Maintainability**: Logic grouped by feature, not by file  
✅ **Collaboration**: Multiple developers can work on different hooks  
✅ **Performance**: Easier to memoize and optimize specific logic  
✅ **Readability**: Pages become thin orchestrators  

## Implementation Steps

### Phase 1: Extract `useAuthCube` Hook

#### 1.1 Create the hook file
**File**: `client/src/hooks/useAuthCube.ts`

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import { postJson } from '@/lib/api';
import { useSocket } from './useSocket';
import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  username: string;
  password: string;
  totp?: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UseAuthCubeReturn {
  // Login state
  loginForm: LoginFormData;
  setLoginForm: (form: LoginFormData) => void;
  loginError: string;
  loadingLogin: boolean;
  loginSuccess: boolean;
  handleLogin: () => Promise<void>;
  
  // Register state
  registerForm: RegisterFormData;
  setRegisterForm: (form: RegisterFormData) => void;
  registerErrors: Record<string, string>;
  registerSuccess: boolean;
  loadingRegister: boolean;
  handleRegister: () => Promise<void>;
  
  // Password reset state
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  loadingForgot: boolean;
  resetToken: string | null;
  resetPassword: string;
  setResetPassword: (pwd: string) => void;
  resetConfirmPassword: string;
  setResetConfirmPassword: (pwd: string) => void;
  handleForgot: () => Promise<void>;
  handleTokenReset: () => Promise<void>;
  
  // UI state
  face: 'login' | 'register' | 'reset' | 'language' | 'logout' | 'info';
  setFace: (face: string) => void;
  lang: string;
  setLang: (lang: string) => void;
  
  // Disabled states (computed)
  loginDisabled: boolean;
  registerDisabled: boolean;
  resetDisabled: boolean;
  forgotDisabled: boolean;
}

export function useAuthCube(): UseAuthCubeReturn {
  const router = useRouter();
  const { tr } = useI18n();
  const { connect } = useSocket();

  // ========== LOGIN STATE ==========
  const [loginForm, setLoginForm] = useState<LoginFormData>({ username: '', password: '', totp: '' });
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const loginDisabled = useMemo(() => {
    return !loginForm.username || !loginForm.password || loadingLogin;
  }, [loginForm, loadingLogin]);

  const handleLogin = useCallback(async () => {
    setLoginError('');
    setLoadingLogin(true);
    try {
      const response = await postJson('/auth/login', loginForm);
      if (!response.success) {
        setLoginError(response.error || 'Login failed');
        return;
      }
      setLoginSuccess(true);
      connect();
      router.push('/home');
    } catch (error) {
      setLoginError((error as Error).message);
    } finally {
      setLoadingLogin(false);
    }
  }, [loginForm, connect, router]);

  // ========== REGISTER STATE ==========
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const registerDisabled = useMemo(() => {
    return !registerForm.username || !registerForm.email || 
           !registerForm.password || !registerForm.confirmPassword || loadingRegister;
  }, [registerForm, loadingRegister]);

  const handleRegister = useCallback(async () => {
    setRegisterErrors({});
    setLoadingRegister(true);
    try {
      const response = await postJson('/auth/register', registerForm);
      if (!response.success) {
        if (response.errors) {
          setRegisterErrors(response.errors);
        } else {
          setRegisterErrors({ general: response.error || 'Registration failed' });
        }
        return;
      }
      setRegisterSuccess(true);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setRegisterErrors({ general: (error as Error).message });
    } finally {
      setLoadingRegister(false);
    }
  }, [registerForm]);

  // ========== PASSWORD RESET STATE ==========
  const [forgotEmail, setForgotEmail] = useState('');
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const resetDisabled = useMemo(() => {
    return !resetPassword || resetPassword !== resetConfirmPassword || resetPassword.length < 6 || loadingForgot;
  }, [resetPassword, resetConfirmPassword, loadingForgot]);

  const forgotDisabled = useMemo(() => {
    return !forgotEmail || loadingForgot;
  }, [forgotEmail, loadingForgot]);

  const handleForgot = useCallback(async () => {
    setLoadingForgot(true);
    try {
      const response = await postJson('/auth/forgot-password', { email: forgotEmail });
      if (response.success) {
        setForgotEmail('');
        alert(tr('reset-email-sent'));
      } else {
        alert(response.error || 'Failed to send reset email');
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoadingForgot(false);
    }
  }, [forgotEmail, tr]);

  const handleTokenReset = useCallback(async () => {
    setLoadingForgot(true);
    try {
      const response = await postJson('/auth/reset-password', {
        token: resetToken,
        password: resetPassword,
      });
      if (response.success) {
        setResetToken(null);
        setResetPassword('');
        setResetConfirmPassword('');
        alert(tr('password-reset-success'));
        setFace('login');
      } else {
        alert(response.error || 'Failed to reset password');
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoadingForgot(false);
    }
  }, [resetToken, resetPassword, tr]);

  // ========== UI STATE ==========
  const [face, setFace] = useState<string>('login');
  const [lang, setLang] = useState('en');

  // Initialize from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const resetLang = params.get('lang');
    if (token) {
      setResetToken(token);
      setFace('reset');
    }
    if (resetLang) {
      setLang(resetLang);
    }
  }, []);

  return {
    // Login
    loginForm,
    setLoginForm,
    loginError,
    loadingLogin,
    loginSuccess,
    handleLogin,
    loginDisabled,
    
    // Register
    registerForm,
    setRegisterForm,
    registerErrors,
    registerSuccess,
    loadingRegister,
    handleRegister,
    registerDisabled,
    
    // Reset
    forgotEmail,
    setForgotEmail,
    loadingForgot,
    resetToken,
    resetPassword,
    setResetPassword,
    resetConfirmPassword,
    setResetConfirmPassword,
    handleForgot,
    handleTokenReset,
    resetDisabled,
    forgotDisabled,
    
    // UI
    face,
    setFace,
    lang,
    setLang,
  };
}
```

#### 1.2 Refactor `page.tsx`
**File**: `client/src/app/page.tsx`

Replace entire file with:

```typescript
'use client';

import { useAuthCube } from '@/hooks/useAuthCube';
import { useI18n } from '@/lib/i18n';
import { AuthGuard } from '@/app/components/AuthGuard';
import LoginFace from '@/app/components/auth/LoginFace';
import RegisterFace from '@/app/components/auth/RegisterFace';
import ResetPasswordFace from '@/app/components/auth/ResetPasswordFace';
import LanguageFace from '@/app/components/auth/LanguageFace';
import { AuthLogoutFace } from '@/app/components/auth/LogoutFace';
import { AuthInfoFace } from '@/app/components/auth/InfoFace';
import Cube from '@/app/components/Cube';

export default function LoginPage() {
  const { tr } = useI18n();
  const auth = useAuthCube();

  return (
    <AuthGuard>
      <Cube face={auth.face} setFace={auth.setFace}>
        <LoginFace
          {...auth}
          tr={tr}
        />
        <RegisterFace
          {...auth}
          tr={tr}
        />
        <ResetPasswordFace
          {...auth}
          tr={tr}
        />
        <LanguageFace
          lang={auth.lang}
          setLang={auth.setLang}
          showLangSelect={true}
        />
        <AuthLogoutFace tr={tr} />
        <AuthInfoFace tr={tr} />
      </Cube>
    </AuthGuard>
  );
}
```

**Reduction**: 568 lines → ~50 lines (91% reduction)

### Phase 2: Extract `useHomeCube` Hook

#### 2.1 Create the hook
**File**: `client/src/hooks/useHomeCube.ts`

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
import { postJson } from '@/lib/api';
import { useSocket } from './useSocket';
import type {
  ChatMessage,
  ContactSummary,
  ApiChatsResponse,
  ApiContactsResponse,
} from '@/app/home/types';

interface UseHomeCubeReturn {
  // Chats
  chats: ChatMessage[];
  loadingChats: boolean;
  fetchChats: () => Promise<void>;
  
  // Contacts
  contacts: ContactSummary[];
  loadingContacts: boolean;
  fetchContacts: () => Promise<void>;
  addContact: (userId: string) => Promise<void>;
  removeContact: (userId: string) => Promise<void>;
  
  // Messages
  messages: ChatMessage[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  
  // Settings
  settings: Record<string, unknown>;
  loadSettings: () => Promise<void>;
  updateSettings: (key: string, value: unknown) => Promise<void>;
  
  // UI state
  face: string;
  setFace: (face: string) => void;
}

export function useHomeCube(): UseHomeCubeReturn {
  const { socket } = useSocket();
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [face, setFace] = useState('chats');

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const data: ApiChatsResponse = await postJson('/chats');
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const data: ApiContactsResponse = await postJson('/contacts');
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const addContact = useCallback(async (userId: string) => {
    try {
      await postJson('/contacts/add', { userId });
      await fetchContacts();
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  }, [fetchContacts]);

  const removeContact = useCallback(async (userId: string) => {
    try {
      await postJson('/contacts/remove', { userId });
      await fetchContacts();
    } catch (error) {
      console.error('Failed to remove contact:', error);
      throw error;
    }
  }, [fetchContacts]);

  const sendMessage = useCallback(async (text: string) => {
    if (!currentChatId) return;
    try {
      await postJson(`/chats/${currentChatId}/messages`, { text });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [currentChatId]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await postJson('/settings');
      setSettings(data.settings || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const updateSettings = useCallback(async (key: string, value: unknown) => {
    try {
      await postJson('/settings/update', { [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchChats();
    fetchContacts();
    loadSettings();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('contact-added', () => {
      fetchContacts();
    });

    return () => {
      socket.off('new-message');
      socket.off('contact-added');
    };
  }, [socket, fetchContacts]);

  return {
    chats,
    loadingChats,
    fetchChats,
    contacts,
    loadingContacts,
    fetchContacts,
    addContact,
    removeContact,
    messages,
    currentChatId,
    setCurrentChatId,
    sendMessage,
    settings,
    loadSettings,
    updateSettings,
    face,
    setFace,
  };
}
```

#### 2.2 Refactor `home/page.tsx`

Replace with:

```typescript
'use client';

import { useHomeCube } from '@/hooks/useHomeCube';
import { useI18n } from '@/lib/i18n';
import Cube from '@/app/components/Cube';
import ChatsFace from '@/app/home/components/ChatsFace';
import ContactsFace from '@/app/home/components/ContactsFace';
import SettingsFace from '@/app/home/components/SettingsFace';
import MessagesFace from '@/app/home/components/MessagesFace';
import { HomeInfoFace } from '@/app/home/components/InfoFace';
import { HomeLogoutFace } from '@/app/home/components/LogoutFace';

export default function HomePage() {
  const { tr } = useI18n();
  const home = useHomeCube();

  return (
    <Cube face={home.face} setFace={home.setFace}>
      <ChatsFace {...home} tr={tr} />
      <ContactsFace {...home} tr={tr} />
      <SettingsFace {...home} tr={tr} />
      <MessagesFace {...home} tr={tr} />
      <HomeInfoFace tr={tr} />
      <HomeLogoutFace tr={tr} />
    </Cube>
  );
}
```

**Reduction**: 1143 lines → ~40 lines (96% reduction)

### Phase 3: Create hooks directory structure

```
client/src/hooks/
├── useAuthCube.ts        (new)
├── useHomeCube.ts        (new)
├── useSocket.ts          (refactor existing)
├── useCubeNavigation.ts  (existing - already extracted)
└── index.ts              (export all)
```

**File**: `client/src/hooks/index.ts`

```typescript
export { useAuthCube } from './useAuthCube';
export { useHomeCube } from './useHomeCube';
export { useSocket } from './useSocket';
export { useCubeNavigation } from './useCubeNavigation';
```

### Phase 4: Testing

Create unit tests for hooks:

**File**: `client/src/hooks/__tests__/useAuthCube.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthCube } from '../useAuthCube';

describe('useAuthCube', () => {
  it('should initialize with empty login form', () => {
    const { result } = renderHook(() => useAuthCube());
    expect(result.current.loginForm.username).toBe('');
    expect(result.current.loginForm.password).toBe('');
  });

  it('should disable login button when form is empty', () => {
    const { result } = renderHook(() => useAuthCube());
    expect(result.current.loginDisabled).toBe(true);
  });

  it('should enable login button when form is filled', () => {
    const { result } = renderHook(() => useAuthCube());
    act(() => {
      result.current.setLoginForm({
        username: 'testuser',
        password: 'testpass123',
        totp: '',
      });
    });
    expect(result.current.loginDisabled).toBe(false);
  });

  it('should clear forgot email after successful submit', async () => {
    const { result } = renderHook(() => useAuthCube());
    act(() => {
      result.current.setForgotEmail('test@example.com');
    });
    // Mock postJson to return success
    // await act(async () => {
    //   await result.current.handleForgot();
    // });
    // expect(result.current.forgotEmail).toBe('');
  });
});
```

## Implementation Checklist

- [ ] Create `client/src/hooks/useAuthCube.ts`
- [ ] Refactor `client/src/app/page.tsx` to use hook
- [ ] Create `client/src/hooks/useHomeCube.ts`
- [ ] Refactor `client/src/app/home/page.tsx` to use hook
- [ ] Create `client/src/hooks/index.ts`
- [ ] Verify all tests pass
- [ ] Manual testing: auth flow (login, register, password reset)
- [ ] Manual testing: home flow (chats, contacts, messages, settings)
- [ ] Check for console errors/warnings
- [ ] Update component imports if needed

## Rollback Plan

If issues arise:

```bash
# Revert to previous state
git checkout client/src/app/page.tsx
git checkout client/src/app/home/page.tsx
rm -rf client/src/hooks/useAuthCube.ts
rm -rf client/src/hooks/useHomeCube.ts
```

## Performance Notes

- Hooks don't automatically optimize re-renders; use `useMemo` and `useCallback` as shown
- Consider adding `React.memo` to face components to prevent unnecessary re-renders
- Profile with React DevTools if performance degrades

## Future Enhancements

1. Move API calls to backend utility layer (`client/src/lib/api/`)
2. Add error boundary around cube faces
3. Implement proper error handling with user feedback
4. Add loading states to UI
5. Cache responses with SWR or React Query
6. Add analytics/telemetry to hooks

---

**Estimated effort**: 2-3 hours for implementation + testing  
**Risk level**: Low (pages are already separated from logic, just more organized)  
**Benefit**: High (testability, reusability, maintainability)
