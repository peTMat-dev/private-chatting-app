# Analysis: Hooks Implementation for Face Components

## Executive Summary

The chat application has been successfully split into **face components** (presentational UI), but **custom hooks** (stateful logic) have NOT been extracted yet. This document analyzes the current state and provides a roadmap for hook implementation.

---

## Current Architecture

### ✅ Completed: Face Components

All UI has been extracted into independent, presentational components:

**Auth Page (6 faces):**
- `LoginFace.tsx` (96 lines) - Login form
- `RegisterFace.tsx` - Registration form
- `ResetPasswordFace.tsx` - Password reset
- `LanguageFace.tsx` - Language selector
- `LogoutFace.tsx` - Logout button
- `InfoFace.tsx` - Info/bugs bottom face

**Home Page (6 faces):**
- `ChatsFace.tsx` (158 lines) - Chat list
- `ContactsFace.tsx` (842 lines) - Contact management
- `MessagesFace.tsx` (204 lines) - Active chat view
- `SettingsFace.tsx` (268 lines) - User settings
- `InfoFace.tsx` (338 lines) - Info/announcements
- `LogoutFace.tsx` - Logout button

**Key Characteristic:** All faces are **pure presentational components** - they receive data and callbacks via props, with no internal state management.

### ✅ Completed: Existing Hooks

Two hooks already exist:
- `useSocket.ts` (40 lines) - WebSocket connection management
- `useCubeNavigation.ts` (210 lines) - 3D cube rotation/navigation

### ❌ Missing: Business Logic Hooks

All business logic remains in monolithic page components:
- `client/src/app/page.tsx` (568 lines) - Auth logic
- `client/src/app/home/page.tsx` (1145 lines) - Home logic

---

## Detailed Analysis

### Auth Page (`page.tsx` - 568 lines)

**Current State:**
```typescript
// All state in one component
const [loginForm, setLoginForm] = useState({ username, password })
const [registerForm, setRegisterForm] = useState({ firstName, lastName, ... })
const [forgotEmail, setForgotEmail] = useState('')
const [resetPassword, setResetPassword] = useState('')
const [lang, setLang] = useState('en')
const [toast, setToast] = useState(null)
const [loading, setLoading] = useState({ login, register, forgot })
const [loginSuccess, setLoginSuccess] = useState(false)
const [registrationSuccess, setRegistrationSuccess] = useState(false)
const [activeInfoTab, setActiveInfoTab] = useState('update')
const [infoItems, setInfoItems] = useState([])
const [reportedBugs, setReportedBugs] = useState([])
// ... 15+ more state variables

// All handlers in one component
const handleLogin = async (e) => { ... }
const handleRegister = async (e) => { ... }
const handleForgot = async (e) => { ... }
const handleTokenReset = async (e) => { ... }
const handleLangChange = (code) => { ... }
const handleLogout = () => { ... }

// All side effects in one component
useEffect(() => { /* fetch infos */ }, [activeFace, activeInfoTab])
useEffect(() => { /* spin animation */ }, [pendingRedirect])
useEffect(() => { /* toast timeout */ }, [toast])
```

**What Needs Extraction:**
- Login form state + validation + submission
- Register form state + validation + submission
- Password reset flow (forgot + token reset)
- Language management
- Info/bugs fetching
- Toast notifications
- Login spin animation
- Computed disabled states

**Proposed Hook:** `useAuthCube.ts` (~400-500 lines)

---

### Home Page (`home/page.tsx` - 1145 lines)

**Current State:**
```typescript
// 40+ state variables
const [contacts, setContacts] = useState([]) // chats list
const [userContacts, setUserContacts] = useState([])
const [settings, setSettings] = useState(null)
const [timezones, setTimezones] = useState([])
const [publicUsers, setPublicUsers] = useState([])
const [activeChatId, setActiveChatId] = useState(null)
const [activeChatMessages, setActiveChatMessages] = useState([])
const [messageInput, setMessageInput] = useState('')
const [showNewChat, setShowNewChat] = useState(false)
const [showRequests, setShowRequests] = useState(false)
const [incomingRequests, setIncomingRequests] = useState([])
const [outgoingRequests, setOutgoingRequests] = useState([])
const [contactGroups, setContactGroups] = useState([])
const [confirmDialog, setConfirmDialog] = useState(null)
const [alertDialog, setAlertDialog] = useState(null)
// ... 30+ more state variables

// 20+ handler functions
const fetchChats = async () => { ... }
const fetchContacts = async () => { ... }
const handleRemoveContact = async (id) => { ... }
const handleAddPublicUser = async (id, name) => { ... }
const handleSendMessage = async () => { ... }
const handleDeleteMessage = (id) => { ... }
const handleCreateGroup = async () => { ... }
const handleApproveRequest = async (id) => { ... }
// ... 15+ more handlers

// 8+ side effects
useEffect(() => { /* fetch chats */ }, [fetchChats])
useEffect(() => { /* fetch contacts */ }, [username])
useEffect(() => { /* fetch settings */ }, [activeFace, username])
useEffect(() => { /* socket: contact_approved */ }, [socket])
useEffect(() => { /* socket: new_message */ }, [socket, fetchChats])
useEffect(() => { /* fetch infos */ }, [activeFace, activeInfoTab])
// ... 5+ more effects
```

**What Needs Extraction:**
- Chats state + fetching
- Contacts state + CRUD operations
- Messages state + sending
- Settings management
- Public user search + add/remove
- Contact requests (incoming/outgoing)
- Contact groups management
- Group chat creation
- Info/bugs fetching
- Dialog state (confirm/alert)
- Socket event handlers
- Computed values (sorted lists)

**Proposed Hook:** `useHomeCube.ts` (~600-800 lines)

---

## Proposed Hook Structure

### 1. `useAuthCube.ts`

```typescript
interface UseAuthCubeReturn {
  // Login
  loginForm: LoginForm;
  setLoginForm: (form: LoginForm) => void;
  loginDisabled: boolean;
  loadingLogin: boolean;
  loginSuccess: boolean;
  loginError: string | null;
  handleLogin: (e: FormEvent) => Promise<void>;
  
  // Register
  registerForm: RegisterForm;
  setRegisterForm: (form: RegisterForm) => void;
  registerDisabled: boolean;
  loadingRegister: boolean;
  registerSuccess: boolean;
  registerErrors: string[] | null;
  handleRegister: (e: FormEvent) => Promise<void>;
  
  // Password Reset
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  resetPassword: string;
  setResetPassword: (pwd: string) => void;
  resetConfirmPassword: string;
  setResetConfirmPassword: (pwd: string) => void;
  forgotDisabled: boolean;
  resetDisabled: boolean;
  loadingForgot: boolean;
  handleForgot: (e: FormEvent) => Promise<void>;
  handleTokenReset: (e: FormEvent) => Promise<void>;
  
  // UI State
  face: CubeFace;
  setFace: (face: CubeFace) => void;
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  showLangSelect: boolean;
  setShowLangSelect: (show: boolean) => void;
  
  // Info/Bugs
  activeInfoTab: InfoTab;
  setActiveInfoTab: (tab: InfoTab) => void;
  infoItems: InfoItem[];
  loadingInfoItems: boolean;
  selectedInfo: InfoItem | null;
  setSelectedInfo: (item: InfoItem | null) => void;
  reportedBugs: ReportedBug[];
  loadingBugs: boolean;
  bugTitleInput: string;
  setBugTitleInput: (title: string) => void;
  bugInput: string;
  setBugInput: (input: string) => void;
  bugCategoryInput: string;
  setBugCategoryInput: (cat: string) => void;
  submittingBug: boolean;
  bugReported: boolean;
  bugSubView: 'list' | 'report';
  setBugSubView: (view: 'list' | 'report') => void;
  handleSubmitBug: () => Promise<void>;
  
  // Toast
  toast: ToastMessage | null;
  showToast: (message: ToastMessage) => void;
  
  // Navigation (from useCubeNavigation)
  goLeft: () => void;
  goRight: () => void;
  goDown: () => void;
  goUp: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  
  // Translations
  tr: Translations;
}
```

**Responsibilities:**
- All auth form state management
- Form validation logic
- API calls for login/register/reset
- Info/bugs data fetching
- Toast notification system
- Login spin animation
- Language persistence

---

### 2. `useHomeCube.ts`

```typescript
interface UseHomeCubeReturn {
  // Chats
  contacts: ContactSummary[]; // chats list
  error: string | null;
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  newChatSelectedIds: number[];
  setNewChatSelectedIds: (ids: number[]) => void;
  newChatTitle: string;
  setNewChatTitle: (title: string) => void;
  creatingChat: boolean;
  newChatError: string | null;
  setNewChatError: (error: string | null) => void;
  handleOpenChat: (id: number, name: string, isGroup: boolean) => void;
  handleCreateChat: () => Promise<void>;
  
  // Contacts
  userContacts: ContactItem[];
  contactsError: string | null;
  contactSortOrder: 'asc' | 'desc';
  setContactSortOrder: (order: 'asc' | 'desc') => void;
  contactSearch: string;
  setContactSearch: (search: string) => void;
  sortedContacts: ContactItem[];
  removingContactId: number | null;
  handleRemoveContact: (id: number) => Promise<void>;
  handleChatWithContact: (id: number) => Promise<void>;
  fetchUserContacts: () => Promise<void>;
  
  // Public Users
  showPublicUserSelect: boolean;
  setShowPublicUserSelect: (show: boolean) => void;
  publicUsers: PublicUser[];
  loadingPublicUsers: boolean;
  publicUserSearch: string;
  setPublicUserSearch: (search: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  sortedPublicUsers: PublicUser[];
  removingPublicUserId: number | null;
  addingPublicUserId: number | null;
  handleRemovePublicUser: (id: number) => Promise<void>;
  handleAddPublicUser: (id: number, displayName: string) => Promise<void>;
  fetchPublicUsers: () => Promise<void>;
  
  // Contact Requests
  showRequests: boolean;
  setShowRequests: (show: boolean) => void;
  loadingRequests: boolean;
  incomingRequests: ContactRequest[];
  outgoingRequests: ContactRequest[];
  approvingRequestId: number | null;
  rejectingRequestId: number | null;
  cancellingRequestId: number | null;
  handleApproveRequest: (id: number) => Promise<void>;
  handleRejectRequest: (id: number) => Promise<void>;
  handleCancelRequest: (requestId: number, userId: number) => Promise<void>;
  fetchRequests: () => Promise<void>;
  
  // Contact Groups
  showContactListGroups: boolean;
  setShowContactListGroups: (show: boolean) => void;
  contactGroups: ContactGroup[];
  contactGroupsError: string | null;
  loadingContactGroups: boolean;
  groupChatTitleEdit: { groupId: number; value: string } | null;
  setGroupChatTitleEdit: (edit: { groupId: number; value: string } | null) => void;
  removingGroupId: number | null;
  setRemovingGroupId: (id: number | null) => void;
  groupChatCreating: boolean;
  handleChatWithGroup: (group: ContactGroup, title: string) => Promise<void>;
  fetchContactGroups: () => Promise<void>;
  
  // Create Group
  showCreateGroup: boolean;
  setShowCreateGroup: (show: boolean) => void;
  createGroupError: string | null;
  createGroupName: string;
  setCreateGroupName: (name: string) => void;
  creatingGroup: boolean;
  handleCreateGroup: () => Promise<void>;
  createGroupSelectedIds: number[];
  setCreateGroupSelectedIds: (ids: number[]) => void;
  
  // Messages
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
  activeChatName: string;
  activeChatIsGroup: boolean;
  activeChatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
  messageInput: string;
  setMessageInput: (input: string) => void;
  sendingMessage: boolean;
  handleSendMessage: () => Promise<void>;
  handleDeleteMessage: (messageId: number) => void;
  handleMessageDoubleTap: (messageId: number) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  
  // Settings
  settings: UserSettings | null;
  settingsError: string | null;
  savingSettings: boolean;
  settingsSaved: boolean;
  handleSaveSettings: (e: FormEvent) => Promise<void>;
  timezones: Array<{ timezone_name: string; display_name: string }>;
  showMaxParticipantsSelect: boolean;
  setShowMaxParticipantsSelect: (show: boolean) => void;
  showTimezoneSelect: boolean;
  setShowTimezoneSelect: (show: boolean) => void;
  
  // Language
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  showLangSelect: boolean;
  setShowLangSelect: (show: boolean) => void;
  handleLangChange: (code: LangCode) => void;
  
  // Info/Bugs
  activeInfoTab: InfoTab;
  setActiveInfoTab: (tab: InfoTab) => void;
  infoItems: InfoItem[];
  loadingInfoItems: boolean;
  selectedInfo: InfoItem | null;
  setSelectedInfo: (item: InfoItem | null) => void;
  reportedBugs: ReportedBug[];
  loadingBugs: boolean;
  bugTitleInput: string;
  setBugTitleInput: (title: string) => void;
  bugInput: string;
  setBugInput: (input: string) => void;
  bugCategoryInput: string;
  setBugCategoryInput: (cat: string) => void;
  submittingBug: boolean;
  bugReported: boolean;
  bugSubView: 'list' | 'report';
  setBugSubView: (view: 'list' | 'report') => void;
  handleSubmitBug: () => Promise<void>;
  
  // Dialogs
  confirmDialog: { show: boolean; message: string; onConfirm: () => void } | null;
  setConfirmDialog: (dialog: { show: boolean; message: string; onConfirm: () => void } | null) => void;
  alertDialog: { show: boolean; message: string; title?: string } | null;
  setAlertDialog: (dialog: { show: boolean; message: string; title?: string } | null) => void;
  
  // Whose Contact Am I
  showWhoseContactAmI: boolean;
  setShowWhoseContactAmI: (show: boolean) => void;
  loadingWhoseContactAmI: boolean;
  whoseContactAmI: MemberGroup[];
  fetchWhoseContactAmI: () => Promise<void>;
  
  // Navigation (from useCubeNavigation)
  face: CubeFace;
  setFace: (face: CubeFace) => void;
  goLeft: () => void;
  goRight: () => void;
  goDown: () => void;
  goUp: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
  handleHeaderTripleTap: () => void;
  handleFooterTripleTap: () => void;
  
  // Translations
  tr: Translations;
}
```

**Responsibilities:**
- All chat/contact/message state management
- Contact CRUD operations
- Group management
- Message sending/deletion
- Settings management
- Public user search
- Contact request handling
- Info/bugs fetching
- Dialog management
- Socket event handling
- Computed values (sorted lists)

---

## Implementation Plan

### Phase 1: Create `useAuthCube.ts` (Est. 2-3 hours)

**Step 1.1:** Create hook file
- Extract all auth state from `page.tsx`
- Implement all handlers
- Add computed values (disabled states)
- Include navigation logic
- Return complete interface

**Step 1.2:** Refactor `page.tsx`
- Replace with thin orchestrator (~50-100 lines)
- Call `useAuthCube()` hook
- Pass props to face components
- Remove all state/handler logic

**Step 1.3:** Test auth flow
- Login
- Register
- Password reset
- Language change
- Info/bugs viewing
- Logout

---

### Phase 2: Create `useHomeCube.ts` (Est. 3-4 hours)

**Step 2.1:** Create hook file
- Extract all home state from `home/page.tsx`
- Implement all handlers
- Add computed values (sorted lists)
- Include socket listeners
- Return complete interface

**Step 2.2:** Refactor `home/page.tsx`
- Replace with thin orchestrator (~50-100 lines)
- Call `useHomeCube()` hook
- Pass props to face components
- Remove all state/handler logic

**Step 2.3:** Test home flow
- Chat list + create chat
- Contact management
- Message sending
- Settings save
- Info/bugs viewing
- Logout

---

### Phase 3: Create Hooks Index (Est. 15 minutes)

**File:** `client/src/hooks/index.ts`
```typescript
export { useAuthCube } from './useAuthCube';
export { useHomeCube } from './useHomeCube';
export { useSocket } from '../lib/useSocket';
export { useCubeNavigation } from '../lib/useCubeNavigation';
```

---

## Benefits After Implementation

### Code Metrics
- **page.tsx:** 568 lines → ~50 lines (91% reduction)
- **home/page.tsx:** 1143 lines → ~50 lines (96% reduction)
- **New hooks:** ~1000-1200 lines (organized, testable logic)

### Maintainability
- ✅ Logic grouped by feature (auth/home)
- ✅ Easy to locate specific functionality
- ✅ Reduced cognitive load
- ✅ Clear separation of concerns

### Testability
- ✅ Unit test hooks without React rendering
- ✅ Mock API calls easily
- ✅ Test state transitions
- ✅ Test computed values

### Performance
- ✅ Easier to memoize specific logic
- ✅ Can optimize hook independently
- ✅ Profile with React DevTools

### Collaboration
- ✅ Multiple devs can work on different hooks
- ✅ No merge conflicts in page components
- ✅ Clear ownership of features

---

## Risk Assessment

### Risk Level: **LOW**

**Why Low Risk:**
1. ✅ Faces already decoupled (no changes to components)
2. ✅ Hooks are pure logic extraction (no behavior changes)
3. ✅ Easy rollback via git
4. ✅ Existing functionality remains intact
5. ✅ Type safety maintained

**Potential Issues:**
- Hook dependency arrays (useCallback/useMemo)
- Socket listener cleanup
- Animation timing (login spin)
- State initialization order

**Mitigation:**
- Careful dependency array management
- Proper cleanup in useEffect returns
- Preserve exact timing logic
- Test thoroughly before commit

---

## Rollback Plan

If issues arise:

```bash
# Revert page components
git checkout client/src/app/page.tsx
git checkout client/src/app/home/page.tsx

# Remove new hooks
rm client/src/hooks/useAuthCube.ts
rm client/src/hooks/useHomeCube.ts
rm client/src/hooks/index.ts

# Existing hooks remain untouched
# git status should show only deletions
```

---

## Estimated Effort

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Create `useAuthCube.ts` | 2-3 hours | Medium |
| 1 | Refactor `page.tsx` | 30 minutes | Low |
| 1 | Test auth flow | 30 minutes | Low |
| 2 | Create `useHomeCube.ts` | 3-4 hours | High |
| 2 | Refactor `home/page.tsx` | 30 minutes | Low |
| 2 | Test home flow | 30 minutes | Low |
| 3 | Create hooks index | 15 minutes | Low |
| **Total** | | **7-9 hours** | |

---

## Recommendation

**Proceed with full implementation** in this order:
1. Start with `useAuthCube.ts` (simpler, good proof of concept)
2. Test thoroughly
3. Implement `useHomeCube.ts` (more complex)
4. Test thoroughly
5. Create hooks index
6. Final integration testing

This approach provides:
- Early validation of the pattern
- Incremental complexity
- Easy debugging
- Minimal risk

---

## Next Steps

1. Review this analysis
2. Confirm approach
3. Begin Phase 1: `useAuthCube.ts`
4. Proceed based on testing results