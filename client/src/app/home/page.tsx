"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Contact from "../components/Contact";
import { buildApiUrl, postJson } from "../../lib/api";
import { LANGUAGES, getLang, setLang, t, type LangCode } from "../../lib/i18n";
import { useCubeNavigation, type CubeFace } from "../../lib/useCubeNavigation";
import { useSocket } from "../../lib/useSocket";

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
  isGroup: boolean;
};

type ContactItem = {
  id: number;
  displayName: string;
  status_st: boolean;
  addedAt: string;
  isPublic: boolean;
};

type ApiChatsResponse = {
  success: boolean;
  count?: number;
  data?: Array<{ id: number; name: string; lastMessage: string; isGroup: boolean }>;
  error?: string;
};

type ApiContactsResponse = {
  success: boolean;
  count?: number;
  data?: ContactItem[];
  error?: string;
};

type PublicUser = {
  id: number;
  displayName: string;
  isAlreadyContact: boolean;
  canBeAddedToContacts: boolean;
  hasPendingRequest: boolean;
};

type ContactRequest = {
  requestId: number;
  userId: number;
  displayName: string;
  requestedAt: string;
};

type ApiPublicUsersResponse = {
  success: boolean;
  count?: number;
  data?: PublicUser[];
  error?: string;
  message?: string;
};

type UserSettings = {
  user_language: string;
  default_max_chat_participants: number;
  public: boolean;
  user_timezone: string;
  can_be_added_to_contacts: boolean;
  display_name?: string;
};

type ApiSettingsResponse = {
  success: boolean;
  data?: UserSettings;
  error?: string;
};

type ApiTimezonesResponse = {
  success: boolean;
  data?: Array<{ timezone_name: string; display_name: string }>;
  error?: string;
};

type ChatMessage = {
  messageId: number;
  text: string;
  senderUserId: number;
  senderDisplayName: string;
  sentAt: string;
  isOwn: boolean;
};

// Cube faces: front=Chats, left=Contacts, right=Chat view, back=Settings, top=Logout
// CubeFace type imported from useCubeNavigation

export default function HomeCube() {
  const {
    activeFace,
    yTicks,
    setActiveFace,
    setYTicks,
    transitionEnabled,
    rotation,
    goLeft,
    goRight,
    goDown,
    goUp,
    setFace,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleHeaderTripleTap,
    handleFooterTripleTap,
  } = useCubeNavigation("front");
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userContacts, setUserContacts] = useState<ContactItem[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [timezones, setTimezones] = useState<Array<{ timezone_name: string; display_name: string }>>([]);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">("asc");
  const [publicUserSearch, setPublicUserSearch] = useState("");
  const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
  const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [privateRequestSent, setPrivateRequestSent] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState("");
  const [showMaxParticipantsSelect, setShowMaxParticipantsSelect] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [lang, setLangState] = useState<LangCode>("en");
  const [showLangSelect, setShowLangSelect] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [removingContactId, setRemovingContactId] = useState<number | null>(null);
  const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
  const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);
  const [whoseContactAmI, setWhoseContactAmI] = useState<{ id: number; displayName: string }[]>([]);
  const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
  const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ContactRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null);

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>("");
  const [activeChatIsGroup, setActiveChatIsGroup] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSelectedIds, setNewChatSelectedIds] = useState<number[]>([]);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ messageId: number; time: number } | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("");

  useEffect(() => {
    setLangState(getLang());
  }, []);

  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; message: string; onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; message: string; title?: string } | null>(null);
  const username = useMemo(() => {
    try {
      return localStorage.getItem("cubcha_username") || "";
    } catch {
      return "";
    }
  }, []);

  const { socket } = useSocket(username);

  const fetchChats = useCallback(async () => {
    if (!username) return;
    try {
      const url = buildApiUrl(`/chats?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiChatsResponse;
      if (!res.ok || !data.success) {
        setError(data.error || "Unable to load chats");
        return;
      }
      const list: ContactSummary[] = (data.data || []).map((d) => ({
        id: d.id,
        name: d.name,
        lastMessage: d.lastMessage || "",
        isGroup: d.isGroup,
      }));
      setContacts(list);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [username]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch own display name once username is available
  useEffect(() => {
    if (!username) return;
    fetch(buildApiUrl(`/settings?username=${encodeURIComponent(username)}`), { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d: ApiSettingsResponse) => { if (d.success && d.data?.display_name) setCurrentUserDisplayName(d.data.display_name); })
      .catch(() => {});
  }, [username]);

  useEffect(() => {
    let aborted = false;
    const fetchContacts = async () => {
      if (!username) {
        return;
      }
      try {
        const url = buildApiUrl(`/contacts?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiContactsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setContactsError(data.error || "Unable to load contacts");
          return;
        }
        if (!aborted) setUserContacts(data.data || []);
      } catch (err) {
        if (!aborted) setContactsError((err as Error).message);
      }
    };
    fetchContacts();
    return () => {
      aborted = true;
    };
  }, [username]);

  useEffect(() => {
    if (publicUsers.length === 0 && username) {
      fetchPublicUsers();
    }
  }, [username, publicUsers.length]);

  // Fetch user settings and timezones when navigating to settings face
  useEffect(() => {
    if (activeFace !== "back" || !username) return;
    
    let aborted = false;
    
    const fetchSettings = async () => {
      try {
        const url = buildApiUrl(`/settings?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiSettingsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setSettingsError(data.error || "Unable to load settings");
          return;
        }
        if (!aborted && data.data) setSettings(data.data);
      } catch (err) {
        if (!aborted) setSettingsError((err as Error).message);
      }
    };

    const fetchTimezones = async () => {
      try {
        const url = buildApiUrl("/settings/timezones");
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiTimezonesResponse;
        if (res.ok && data.success && data.data) {
          if (!aborted) setTimezones(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch timezones:", err);
      }
    };

    fetchSettings();
    fetchTimezones();
    
    return () => {
      aborted = true;
    };
  }, [activeFace, username]);

  const fetchPublicUsers = async () => {
    if (!username) {
      setAlertDialog({ show: true, title: "Error", message: "Session expired. Please log in again." });
      return;
    }
    setLoadingPublicUsers(true);
    try {
      const url = buildApiUrl(`/contacts/public-users?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiPublicUsersResponse;
      if (!res.ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Unable to load public users" });
        return;
      }
      setPublicUsers((data.data as PublicUser[]) || []);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setLoadingPublicUsers(false);
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    setRemovingContactId(contactId);
    try {
      const { ok, data } = await postJson("/contacts/remove", {
        username,
        contactUserId: contactId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to remove contact" });
        return;
      }
      setUserContacts((prev) => prev.filter((c) => c.id !== contactId));
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === contactId ? { ...u, isAlreadyContact: false, hasPendingRequest: false } : u))
      );
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setRemovingContactId(null);
    }
  };

  const handleRemovePublicUser = async (userId: number) => {
    setRemovingPublicUserId(userId);
    try {
      const { ok, data } = await postJson("/contacts/remove", {
        username,
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to remove contact" });
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: false } : u))
      );
      fetchUserContacts();
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setRemovingPublicUserId(null);
    }
  };

  const handleAddPublicUser = async (userId: number, displayName: string) => {
    if (!userId || !displayName) return;
    setAddingPublicUserId(userId);
    try {
      const { ok, data } = await postJson("/contacts/add-public", {
        username,
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to send contact request" });
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, hasPendingRequest: true } : u))
      );
      if (showRequests) fetchRequests();
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setAddingPublicUserId(null);
    }
  };

  const fetchWhoseContactAmI = async () => {
    if (!username) return;
    setLoadingWhoseContactAmI(true);
    try {
      const url = buildApiUrl(`/contacts/whose-contact-am-i?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as { success: boolean; data?: { id: number; displayName: string }[]; error?: string };
      if (!res.ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Unable to load" });
        return;
      }
      setWhoseContactAmI(data.data || []);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setLoadingWhoseContactAmI(false);
    }
  };

  const fetchRequests = async () => {
    if (!username) return;
    setLoadingRequests(true);
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        fetch(buildApiUrl(`/contacts/requests/incoming?username=${encodeURIComponent(username)}`), { headers: { Accept: "application/json" } }),
        fetch(buildApiUrl(`/contacts/requests/outgoing?username=${encodeURIComponent(username)}`), { headers: { Accept: "application/json" } }),
      ]);
      const [incomingData, outgoingData] = await Promise.all([
        incomingRes.json() as Promise<{ success: boolean; data?: ContactRequest[]; error?: string }>,
        outgoingRes.json() as Promise<{ success: boolean; data?: ContactRequest[]; error?: string }>,
      ]);
      if (incomingData.success) setIncomingRequests(incomingData.data || []);
      if (outgoingData.success) setOutgoingRequests(outgoingData.data || []);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    setApprovingRequestId(requestId);
    try {
      const { ok, data } = await postJson("/contacts/requests/approve", { username, requestId });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to approve request" });
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      fetchUserContacts();
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setRejectingRequestId(requestId);
    try {
      const { ok, data } = await postJson("/contacts/requests/reject", { username, requestId });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to reject request" });
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setRejectingRequestId(null);
    }
  };

  const handleCancelRequest = async (requestId: number, targetId: number) => {
    setCancellingRequestId(requestId);
    try {
      const { ok, data } = await postJson("/contacts/requests/cancel", { username, requestId });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to cancel request" });
        return;
      }
      setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      setPublicUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, hasPendingRequest: false } : u));
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleSendRequest = async () => {
    if (!requestDisplayName.trim()) return;
    try {
      await postJson("/contacts/request", {
        username,
        displayName: requestDisplayName.trim(),
      });
      if (showRequests) fetchRequests();
    } catch {
      // Intentionally ignored — always show same neutral message to protect privacy
    }
    setRequestDisplayName("");
    setPrivateRequestSent(true);
  };

  const fetchUserContacts = async () => {
    if (!username) return;
    try {
      const url = buildApiUrl(`/contacts?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiContactsResponse;
      if (!res.ok || !data.success) {
        setContactsError(data.error || "Unable to load contacts");
        return;
      }
      setUserContacts(data.data || []);
      setContactsError(null);
    } catch (err) {
      setContactsError((err as Error).message);
    }
  };

  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!username) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const url = buildApiUrl(`/chats/${conversationId}/messages?username=${encodeURIComponent(username)}`);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as { success: boolean; data?: ChatMessage[]; error?: string };
      if (!res.ok || !data.success) {
        setChatError(data.error || "Unable to load messages");
        return;
      }
      setActiveChatMessages(data.data || []);
    } catch (err) {
      setChatError((err as Error).message);
    } finally {
      setChatLoading(false);
    }
  }, [username]);

  // Keep activeChatIdRef in sync so socket handler can read it without re-subscribing
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages]);

  // Load messages whenever the right face becomes active with a selected chat
  useEffect(() => {
    if (activeFace === "right" && activeChatId !== null) {
      fetchMessages(activeChatId);
    }
  }, [activeFace, activeChatId, fetchMessages]);

  // Phase 6: real-time contact_approved push
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId }: { userId: number; displayName: string }) => {
      fetchUserContacts();
      setOutgoingRequests((prev) => prev.filter((r) => r.userId !== userId));
      setPublicUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isAlreadyContact: true, hasPendingRequest: false } : u)
      );
    };
    socket.on("contact_approved", handler);
    return () => { socket.off("contact_approved", handler); };
  }, [socket]);

  // Phases 8+9: real-time new_message push
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: {
      conversationId: number; messageId: number; text: string;
      senderUserId: number; senderDisplayName: string; sentAt: string;
    }) => {
      // Append to the open chat (dedup against optimistic messages)
      if (activeChatIdRef.current === payload.conversationId) {
        setActiveChatMessages((prev) => {
          if (prev.some((m) => m.messageId === payload.messageId)) return prev;
          return [...prev, {
            messageId: payload.messageId,
            text: payload.text,
            senderUserId: payload.senderUserId,
            senderDisplayName: payload.senderDisplayName,
            sentAt: payload.sentAt,
            isOwn: false,
          }];
        });
      }
      // Update chats list last message
      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) { fetchChats(); return prev; }
        const next = [...prev];
        next[idx] = { ...next[idx], lastMessage: payload.text };
        return next;
      });
    };
    socket.on("new_message", handler);
    return () => { socket.off("new_message", handler); };
  }, [socket, fetchChats]);

  const sortedPublicUsers = useMemo(() => {
    const sorted = [...publicUsers];
    sorted.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      return b.displayName.localeCompare(a.displayName);
    });
    const term = publicUserSearch.trim().toLowerCase();
    return term ? sorted.filter((u) => u.displayName.toLowerCase().includes(term)) : sorted;
  }, [publicUsers, sortOrder, publicUserSearch]);

  const sortedContacts = useMemo(() => {
    const sorted = [...userContacts];
    sorted.sort((a, b) => {
      if (contactSortOrder === "asc") {
        return a.displayName.localeCompare(b.displayName);
      }
      return b.displayName.localeCompare(a.displayName);
    });
    const term = contactSearch.trim().toLowerCase();
    return term ? sorted.filter((c) => c.displayName.toLowerCase().includes(term)) : sorted;
  }, [userContacts, contactSortOrder, contactSearch]);

  const handleOpenChat = (conversationId: number, name: string, isGroup: boolean) => {
    setActiveChatId(conversationId);
    setActiveChatName(name);
    setActiveChatIsGroup(isGroup);
    setActiveChatMessages([]);
    setChatError(null);
    goRight();
  };

  const handleChatWithContact = async (contactId: number) => {
    try {
      const { ok, data } = await postJson("/chats", { username, participantUserIds: [contactId] });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to open chat" });
        return;
      }
      fetchChats();
      handleOpenChat(data.data.conversationId, data.data.name, data.data.isGroup);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    }
  };

  const handleCreateChat = async () => {
    if (newChatSelectedIds.length === 0) return;
    const isGroup = newChatSelectedIds.length > 1;
    if (isGroup && !newChatTitle.trim()) {
      setNewChatError(t(lang).groupTitleRequired);
      return;
    }
    setCreatingChat(true);
    setNewChatError(null);
    try {
      const { ok, data } = await postJson("/chats", {
        username,
        participantUserIds: newChatSelectedIds,
        ...(isGroup ? { title: newChatTitle.trim() } : {}),
      });
      if (!ok || !data.success) {
        setNewChatError(data.error || "Failed to create chat");
        return;
      }
      setShowNewChat(false);
      setNewChatSelectedIds([]);
      setNewChatTitle("");
      fetchChats();
      handleOpenChat(data.data.conversationId, data.data.name, data.data.isGroup);
    } catch (err) {
      setNewChatError((err as Error).message);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChatId || sendingMessage) return;
    const text = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);
    const tempId = -Date.now();
    setActiveChatMessages((prev) => [...prev, {
      messageId: tempId, text, senderUserId: -1, senderDisplayName: currentUserDisplayName, sentAt: new Date().toISOString(), isOwn: true,
    }]);
    try {
      const { ok, data } = await postJson(`/chats/${activeChatId}/messages`, { username, text });
      if (!ok || !data.success) {
        setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== tempId));
        setMessageInput(text);
        return;
      }
      setActiveChatMessages((prev) =>
        prev.map((m) => m.messageId === tempId ? { ...m, messageId: data.data.messageId, sentAt: data.data.sentAt } : m)
      );
    } catch {
      setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      setMessageInput(text);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (!activeChatId || !username) return;
    setConfirmDialog({
      show: true,
      message: "Delete this message?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const url = buildApiUrl(
            `/chats/${activeChatId}/messages/${messageId}?username=${encodeURIComponent(username)}`
          );
          const res = await fetch(url, { method: "DELETE", headers: { Accept: "application/json" } });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to delete message" });
            return;
          }
          setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== messageId));
        } catch (err) {
          setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
        }
      },
    });
  };

  const handleMessageDoubleTap = (messageId: number) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.messageId === messageId && now - last.time < 400) {
      lastTapRef.current = null;
      handleDeleteMessage(messageId);
    } else {
      lastTapRef.current = { messageId, time: now };
    }
  };

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || !username) return;

    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSaved(false);

    try {
      const url = buildApiUrl("/settings");
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          ...settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSettingsError(data.error || "Failed to save settings");
        return;
      }

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setSettingsError((err as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLangChange = (code: LangCode) => {
    setLang(code);
    setLangState(code);
    if (settings) setSettings({ ...settings, user_language: code });
    setShowLangSelect(false);
  };

  const handleLogout = () => {
    // Step 1: Move up from TOP face back to previous face
    goUp();
    // Step 2: After animation, rotate left and logout
    setTimeout(() => {
      goLeft();
      setTimeout(() => {
        // Clear session and redirect
        try {
          localStorage.removeItem("cubcha_username");
        } catch (e) {
          // Ignore storage errors
        }
        window.location.href = "/";
      }, 500); // Wait for rotation to complete
    }, 500); // Wait for up movement to complete
  };

  const tr = t(lang);

  return (
    <div
      className="mobile-auth-screen fade-in"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="auth-cube-stage">
        <div
          className="auth-cube"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: transitionEnabled ? undefined : "none",
          }}
        >
          {/* Front: Chats list */}
          <section className="cube-face cube-face-front">
            <section className="auth-stack">
              <article className="auth-card cube-face-panel">
                <div className="cube-face-content">
                  <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                    <h2>{tr.chats}</h2>
                  </div>

                  {/* New Chat accordion */}
                  <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowNewChat(!showNewChat);
                        setNewChatSelectedIds([]);
                        setNewChatTitle("");
                        setNewChatError(null);
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.newChat}
                    </button>
                    {showNewChat && (
                      <div style={{ marginTop: "0.65rem" }}>
                        {userContacts.length === 0 ? (
                          <div style={{ padding: "0.5rem 0", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsYet}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", paddingBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {tr.selectContacts}
                            </div>
                            <div className="auth-input" style={{ padding: 0, maxHeight: "150px", overflowY: "auto" }}>
                              {userContacts.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => setNewChatSelectedIds((prev) =>
                                    prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                  )}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.45rem 0.75rem",
                                    borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                    cursor: "pointer",
                                    color: newChatSelectedIds.includes(c.id) ? "#00FFFF" : "var(--color-green)",
                                    backgroundColor: newChatSelectedIds.includes(c.id) ? "rgba(3,160,98,0.1)" : "transparent",
                                  }}
                                >
                                  <span style={{ flex: 1, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.displayName}
                                  </span>
                                  <span style={{ fontSize: "0.8rem" }}>{newChatSelectedIds.includes(c.id) ? "\u2611" : "\u2610"}</span>
                                </div>
                              ))}
                            </div>
                            {newChatSelectedIds.length >= 2 && (
                              <input
                                type="text"
                                value={newChatTitle}
                                onChange={(e) => setNewChatTitle(e.target.value)}
                                placeholder={tr.groupTitle}
                                style={{
                                  marginTop: "0.5rem", width: "100%", fontSize: "0.8rem",
                                  padding: "0.35rem 0.5rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)", outline: "none",
                                }}
                              />
                            )}
                            {newChatError && (
                              <p style={{ color: "rgba(255,80,80,0.8)", fontSize: "0.75rem", margin: "0.35rem 0 0" }}>
                                {newChatError}
                              </p>
                            )}
                            {newChatSelectedIds.length > 0 && (
                              <button
                                className="add-contact-btn"
                                onClick={handleCreateChat}
                                disabled={creatingChat}
                                style={{ width: "100%", marginTop: "0.5rem" }}
                              >
                                {creatingChat ? "\u2026" : newChatSelectedIds.length === 1 ? tr.openChat : tr.createGroup}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {error ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>{tr.couldNotLoadChats}</h2>
                      <p>{error}</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>{tr.noChatsYet}</h2>
                      <p>{tr.addContactsToStart}</p>
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush chats-list">
                      {contacts.map((c) => (
                        <Contact key={c.id} contact_name={c.name} onClick={() => handleOpenChat(Number(c.id), c.name, c.isGroup)}>
                          {c.lastMessage}
                        </Contact>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </article>
            </section>
          </section>

          {/* Left: Contacts */}
          <section className="cube-face cube-face-left">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                  <h2>{tr.contacts}</h2>
                </div>
                
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(3, 160, 98, 0.15)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowPublicUserSelect(!showPublicUserSelect);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowContactList(false);
                        setShowRequests(false);
                        setPublicUserSearch("");
                        if (!showPublicUserSelect && publicUsers.length === 0) {
                          fetchPublicUsers();
                        }
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.addPublicUser}
                    </button>
                    
                    {showPublicUserSelect && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "asc" ? "active" : ""}`}
                            onClick={() => setSortOrder("asc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            A-Z
                          </button>
                          <button
                            type="button"
                            className={`sort-btn ${sortOrder === "desc" ? "active" : ""}`}
                            onClick={() => setSortOrder("desc")}
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                          >
                            Z-A
                          </button>
                          <input
                            type="text"
                            value={publicUserSearch}
                            onChange={(e) => setPublicUserSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") setPublicUserSearch(""); }}
                            placeholder="🔍"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "0.75rem",
                              padding: "0.35rem 0.4rem",
                              background: "rgba(3,160,98,0.08)",
                              border: "1px solid rgba(3,160,98,0.3)",
                              borderRadius: "0.25rem",
                              color: "var(--color-green)",
                              outline: "none",
                            }}
                          />
                          {publicUserSearch && (
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => setPublicUserSearch("")}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div
                          className="auth-input"
                          style={{ 
                            cursor: "pointer", 
                            width: "100%",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0",
                            opacity: loadingPublicUsers ? 0.6 : 1
                          }}
                        >
                          {loadingPublicUsers ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : sortedPublicUsers.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.noPublicUsers}
                            </div>
                          ) : (
                            sortedPublicUsers.map((user) => {
                              const isBusy = removingPublicUserId === user.id || addingPublicUserId === user.id;
                              return (
                              <div
                                key={user.id}
                                style={{
                                  padding: "0.45rem 0.75rem",
                                  cursor: "default",
                                  backgroundColor: "transparent",
                                  color: user.isAlreadyContact ? "rgba(180,180,180,0.5)" : "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {user.displayName}
                                </span>
                                <button
                                  className={`contact-action-btn ${user.isAlreadyContact ? "contact-action-btn--tick" : user.hasPendingRequest ? "contact-action-btn--pending" : !user.canBeAddedToContacts ? "contact-action-btn--blocked" : "contact-action-btn--add"}`}
                                  style={!user.canBeAddedToContacts ? { color: "#ff5555" } : {}}
                                  onClick={() => {
                                    if (isBusy || loadingPublicUsers || user.hasPendingRequest || !user.canBeAddedToContacts) return;
                                    if (user.isAlreadyContact) {
                                      handleRemovePublicUser(user.id);
                                    } else {
                                      handleAddPublicUser(user.id, user.displayName);
                                    }
                                  }}
                                  disabled={isBusy || loadingPublicUsers || (!user.isAlreadyContact && (user.hasPendingRequest || !user.canBeAddedToContacts))}
                                  title={user.isAlreadyContact ? "Remove contact" : user.hasPendingRequest ? tr.requestPending : !user.canBeAddedToContacts ? tr.cannotBeRequested : "Send contact request"}
                                >
                                  {isBusy ? "…" : user.isAlreadyContact ? "☑" : user.hasPendingRequest ? "⌛" : !user.canBeAddedToContacts ? "🚫" : "☐"}
                                </button>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowRequestInput(!showRequestInput);
                        setPrivateRequestSent(false);
                        setShowPublicUserSelect(false);
                        setShowRequests(false);
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.requestByName}
                    </button>
                    
                    {showRequestInput && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {privateRequestSent ? (
                          <p style={{ fontSize: "0.75rem", color: "var(--color-green)", margin: "0", textAlign: "center", padding: "0.5rem 0", opacity: 0.75 }}>
                            {tr.privateRequestSent}
                          </p>
                        ) : (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="text"
                              value={requestDisplayName}
                              onChange={(e) => setRequestDisplayName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && requestDisplayName.trim()) handleSendRequest(); }}
                              placeholder={tr.enterDisplayName}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: "0.75rem",
                                padding: "0.35rem 0.4rem",
                                background: "rgba(3,160,98,0.08)",
                                border: "1px solid rgba(3,160,98,0.3)",
                                borderRadius: "0.25rem",
                                color: "var(--color-green)",
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={() => handleSendRequest()}
                              disabled={!requestDisplayName.trim()}
                              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        setShowContactList(!showContactList);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        setContactSearch("");
                      }}
                      style={{ width: "100%" }}
                    >
                      ☰ {tr.contactList}
                    </button>
                    {showContactList && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {contactsError ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(255,80,80,0.8)", fontSize: "0.8rem" }}>
                            {tr.couldNotLoadContacts}
                          </div>
                        ) : userContacts.length === 0 ? (
                          <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                            {tr.noContactsYet}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "asc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("asc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                A-Z
                              </button>
                              <button
                                type="button"
                                className={`sort-btn ${contactSortOrder === "desc" ? "active" : ""}`}
                                onClick={() => setContactSortOrder("desc")}
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                              >
                                Z-A
                              </button>
                              <input
                                type="text"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setContactSearch(""); }}
                                placeholder="🔍"
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: "0.75rem",
                                  padding: "0.35rem 0.4rem",
                                  background: "rgba(3,160,98,0.08)",
                                  border: "1px solid rgba(3,160,98,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "var(--color-green)",
                                  outline: "none",
                                }}
                              />
                              {contactSearch && (
                                <button
                                  type="button"
                                  className="sort-btn"
                                  onClick={() => setContactSearch("")}
                                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div
                              className="auth-input"
                              style={{ padding: 0, maxHeight: "180px", overflowY: "auto" }}
                            >
                              {sortedContacts.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0.45rem 0.75rem",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  gap: "0.4rem",
                                }}
                              >
                                <span style={{ color: "var(--color-green)", fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {c.displayName}{!c.isPublic && <span style={{ marginLeft: "0.3rem", fontSize: "0.75rem" }}>🔒</span>}
                                </span>
                                <button
                                  className="contact-action-btn contact-action-btn--chat"
                                  onClick={() => handleChatWithContact(c.id)}
                                  title="💬"
                                >
                                  💬
                                </button>
                                <button
                                  className="contact-action-btn contact-action-btn--tick"
                                  onClick={() => handleRemoveContact(c.id)}
                                  disabled={removingContactId === c.id}
                                >
                                  {removingContactId === c.id ? "…" : "☑"}
                                </button>
                              </div>
                            ))}
                          </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showRequests;
                        setShowRequests(next);
                        setShowContactList(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowWhoseContactAmI(false);
                        if (next) fetchRequests();
                      }}
                      style={{ width: "100%" }}
                    >
                      📬 {tr.requests}
                    </button>
                    {showRequests && (
                      <div style={{ marginTop: "0.75rem" }}>
                        {loadingRequests ? (
                          <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                            {tr.loadingUsers}
                          </div>
                        ) : (
                          <>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", padding: "0 0.5rem 0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {tr.incomingRequests}
                              </div>
                              <div
                                className="auth-input"
                                style={{ padding: 0, maxHeight: "130px", overflowY: "auto" }}
                              >
                                {incomingRequests.length === 0 ? (
                                  <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                                    {tr.noIncomingRequests}
                                  </div>
                                ) : (
                                  incomingRequests.map((req) => (
                                    <div
                                      key={req.requestId}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0.45rem 0.75rem",
                                        borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                        gap: "0.4rem",
                                      }}
                                    >
                                      <span style={{ flex: 1, color: "var(--color-green)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {req.displayName}
                                      </span>
                                      <button
                                        className="contact-action-btn contact-action-btn--tick"
                                        onClick={() => handleApproveRequest(req.requestId)}
                                        disabled={approvingRequestId === req.requestId || rejectingRequestId === req.requestId}
                                        title={tr.approveRequest}
                                      >
                                        {approvingRequestId === req.requestId ? "\u2026" : "\u2713"}
                                      </button>
                                      <button
                                        className="contact-action-btn contact-action-btn--remove"
                                        onClick={() => handleRejectRequest(req.requestId)}
                                        disabled={approvingRequestId === req.requestId || rejectingRequestId === req.requestId}
                                        title={tr.rejectRequest}
                                      >
                                        {rejectingRequestId === req.requestId ? "\u2026" : "\u2717"}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.7rem", color: "rgba(3,160,98,0.55)", padding: "0 0.5rem 0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {tr.outgoingRequests}
                              </div>
                              <div
                                className="auth-input"
                                style={{ padding: 0, maxHeight: "130px", overflowY: "auto" }}
                              >
                                {outgoingRequests.length === 0 ? (
                                  <div style={{ padding: "0.5rem 0.75rem", color: "rgba(3,160,98,0.5)", fontSize: "0.8rem", textAlign: "center" }}>
                                    {tr.noOutgoingRequests}
                                  </div>
                                ) : (
                                  outgoingRequests.map((req) => (
                                    <div
                                      key={req.requestId}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0.45rem 0.75rem",
                                        borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                        gap: "0.4rem",
                                      }}
                                    >
                                      <span style={{ flex: 1, color: "var(--color-green)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {req.displayName}
                                      </span>
                                      <button
                                        className="contact-action-btn contact-action-btn--cancel"
                                        onClick={() => handleCancelRequest(req.requestId, req.userId)}
                                        disabled={cancellingRequestId === req.requestId}
                                        title={tr.cancelRequest}
                                      >
                                        {cancellingRequestId === req.requestId ? "\u2026" : "\u2715"}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className="add-contact-btn"
                      onClick={() => {
                        const next = !showWhoseContactAmI;
                        setShowWhoseContactAmI(next);
                        setShowContactList(false);
                        setShowPublicUserSelect(false);
                        setShowRequestInput(false);
                        setPrivateRequestSent(false);
                        setShowRequests(false);
                        if (next) fetchWhoseContactAmI();
                      }}
                      style={{ width: "100%" }}
                    >
                      {tr.whoseContactAmI}
                    </button>
                    {showWhoseContactAmI && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div
                          className="auth-input"
                          style={{ padding: 0, maxHeight: "180px", overflowY: "auto", opacity: loadingWhoseContactAmI ? 0.6 : 1 }}
                        >
                          {loadingWhoseContactAmI ? (
                            <div style={{ padding: "0.75rem", color: "var(--color-green)", textAlign: "center" }}>
                              {tr.loadingUsers}
                            </div>
                          ) : whoseContactAmI.length === 0 ? (
                            <div style={{ padding: "0.75rem", color: "rgba(3,160,98,0.5)", textAlign: "center", fontSize: "0.8rem" }}>
                              —
                            </div>
                          ) : (
                            whoseContactAmI.map((user) => (
                              <div
                                key={user.id}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  color: "var(--color-green)",
                                  borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {user.displayName}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
            </article>
          </section>

          {/* Back: User Settings */}
          <section className="cube-face cube-face-back">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header" onClick={handleHeaderTripleTap}>
                  <h2>{tr.userSettings}</h2>
                </div>
                
                {settingsError && !settings ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true" />
                    <h3>{tr.couldNotLoadSettings}</h3>
                    <p>{settingsError}</p>
                  </div>
                ) : !settings ? (
                  <div className="empty-state">
                    <p>{tr.loadingSettings}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="d-flex flex-column" style={{ gap: "1rem" }}>
                    {settingsSaved && (
                      <div className="auth-alert" style={{ background: "rgba(3, 160, 98, 0.12)", border: "1px solid rgba(3, 160, 98, 0.4)" }}>
                        <strong>{tr.settingsSaved}</strong> {tr.settingsSavedMsg}
                      </div>
                    )}
                    
                    {settingsError && (
                      <div className="auth-alert">
                        <strong>Error:</strong> {settingsError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="user-language" className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        {tr.language}
                      </label>
                      <button
                        id="user-language"
                        type="button"
                        className="auth-input"
                        onClick={() => setShowLangSelect(!showLangSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {LANGUAGES.find((l) => l.code === lang)?.label}
                      </button>
                      {showLangSelect && (
                        <div
                          className="auth-input"
                          style={{
                            maxWidth: "180px",
                            marginTop: "0.5rem",
                            maxHeight: "220px",
                            overflowY: "auto",
                            padding: "0",
                          }}
                        >
                          {LANGUAGES.map((l) => (
                            <div
                              key={l.code}
                              onClick={() => handleLangChange(l.code)}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: lang === l.code ? "rgba(3, 160, 98, 0.15)" : "transparent",
                                color: lang === l.code ? "#00FFFF" : "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)"; }}
                              onMouseLeave={(e) => { if (lang !== l.code) e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              {l.label}{lang === l.code ? " ✓" : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="auth-label" style={{ marginBottom: "0.25rem" }}>
                        {tr.maxChatParticipants} <small style={{ color: "var(--color-form-text)", opacity: 0.7, fontSize: "0.75rem", fontWeight: "normal" }}>(2-100)</small>
                      </label>
                      <button
                        type="button"
                        className="auth-input"
                        onClick={() => setShowMaxParticipantsSelect(!showMaxParticipantsSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {settings.default_max_chat_participants}
                      </button>
                      
                      {showMaxParticipantsSelect && (
                        <div
                          className="auth-input"
                          style={{ 
                            maxWidth: "180px", 
                            marginTop: "0.5rem",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0"
                          }}
                        >
                          {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
                            <div
                              key={num}
                              onClick={() => {
                                setSettings({ ...settings, default_max_chat_participants: num });
                                setShowMaxParticipantsSelect(false);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: settings.default_max_chat_participants === num 
                                  ? "rgba(3, 160, 98, 0.15)" 
                                  : "transparent",
                                color: "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                if (settings.default_max_chat_participants !== num) {
                                  e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (settings.default_max_chat_participants !== num) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="auth-label" style={{ marginBottom: "0.25rem", display: "block" }}>
                        {tr.timezone}
                      </label>
                      <button
                        type="button"
                        className="auth-input"
                        onClick={() => setShowTimezoneSelect(!showTimezoneSelect)}
                        style={{ cursor: "pointer", maxWidth: "180px", textAlign: "left" }}
                      >
                        {timezones.find(tz => tz.timezone_name === settings.user_timezone)?.display_name || settings.user_timezone}
                      </button>
                      
                      {showTimezoneSelect && (
                        <div
                          className="auth-input"
                          style={{ 
                            maxWidth: "180px", 
                            marginTop: "0.5rem",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0"
                          }}
                        >
                          {timezones.map((tz) => (
                            <div
                              key={tz.timezone_name}
                              onClick={() => {
                                setSettings({ ...settings, user_timezone: tz.timezone_name });
                                setShowTimezoneSelect(false);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                backgroundColor: settings.user_timezone === tz.timezone_name 
                                  ? "rgba(3, 160, 98, 0.15)" 
                                  : "transparent",
                                color: "var(--color-green)",
                                borderBottom: "1px solid rgba(3, 160, 98, 0.1)",
                                transition: "background-color 0.2s",
                                fontSize: "0.85rem"
                              }}
                              onMouseEnter={(e) => {
                                if (settings.user_timezone !== tz.timezone_name) {
                                  e.currentTarget.style.backgroundColor = "rgba(3, 160, 98, 0.08)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (settings.user_timezone !== tz.timezone_name) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              {tz.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        id="profile-public"
                        type="checkbox"
                        checked={settings.public_st}
                        onChange={(e) => setSettings({ ...settings, public_st: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer", margin: 0 }}
                      />
                      <label htmlFor="profile-public" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                        {tr.makeProfilePublic}
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        id="allow-contact-requests"
                        type="checkbox"
                        checked={settings.can_be_added_to_contacts}
                        onChange={(e) => setSettings({ ...settings, can_be_added_to_contacts: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer", margin: 0 }}
                      />
                      <label htmlFor="allow-contact-requests" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                        {tr.allowContactRequests}
                      </label>
                    </div>

                    <button type="submit" className="auth-btn" disabled={savingSettings} style={{ marginTop: "0.25rem" }}>
                    {savingSettings ? tr.saving : tr.saveSettings}
                    </button>
                  </form>
                )}
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </div>
            </article>
          </section>

          {/* Right: Chat view */}
          <section className="cube-face cube-face-right">
            {confirmDialog?.show && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.55)",
                  borderRadius: "inherit",
                }}
              >
                <div
                  className="auth-card"
                  style={{
                    width: "fit-content",
                    maxWidth: "220px",
                    padding: "0.85rem 1rem",
                    boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)",
                  }}
                >
                  <p style={{ color: "var(--color-green)", fontSize: "0.9rem", margin: "0 0 1rem 0", textAlign: "center" }}>
                    {confirmDialog.message}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setConfirmDialog(null)}
                      style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                    >
                      {tr.cancel}
                    </button>
                    <button
                      type="button"
                      className="auth-btn"
                      onClick={confirmDialog.onConfirm}
                      style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                    >
                      {tr.confirmAction}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="cube-face-header" onClick={handleHeaderTripleTap} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setFace("front")}
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minWidth: 0 }}
                  >
                    ←
                  </button>
                  <h2 style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {activeChatName || tr.chat}
                  </h2>
                </div>

                {!activeChatId ? (
                  <p className="hero-copy">{tr.openConversation}</p>
                ) : chatLoading ? (
                  <div className="empty-state"><p>{tr.loadingUsers}</p></div>
                ) : chatError ? (
                  <div className="empty-state"><p>{chatError}</p></div>
                ) : (
                  <>
                    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {activeChatMessages.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <p style={{ color: "rgba(3,160,98,0.5)", fontSize: "0.85rem" }}>{tr.noMessagesYet}</p>
                        </div>
                      ) : (
                        activeChatMessages.map((m, i) => {
                          const msgDate = new Date(m.sentAt);
                          const msgDay = msgDate.toDateString();
                          const prevDay = i > 0 ? new Date(activeChatMessages[i - 1].sentAt).toDateString() : null;
                          const showSeparator = msgDay !== prevDay;
                          const today = new Date().toDateString();
                          const yesterday = new Date(Date.now() - 864e5).toDateString();
                          const separatorLabel = msgDay === today ? "Today" : msgDay === yesterday ? "Yesterday" : msgDate.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
                          return (
                            <div key={m.messageId}>
                              {showSeparator && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0" }}>
                                  <div style={{ flex: 1, height: "1px", background: "rgba(3,160,98,0.2)" }} />
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-green)", whiteSpace: "nowrap" }}>{separatorLabel}</span>
                                  <div style={{ flex: 1, height: "1px", background: "rgba(3,160,98,0.2)" }} />
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: "column", alignItems: m.isOwn ? "flex-end" : "flex-start" }}>
                                {activeChatIsGroup && m.senderDisplayName && (
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-green)", marginBottom: "0.15rem" }}>
                                    {m.senderDisplayName}
                                  </span>
                                )}
                                <div
                                  style={{
                                    maxWidth: "75%",
                                    padding: "0.4rem 0.65rem",
                                    borderRadius: m.isOwn ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                                    background: m.isOwn ? "rgba(3,160,98,0.25)" : "rgba(3,160,98,0.1)",
                                    border: "1px solid rgba(3,160,98,0.3)",
                                    color: "var(--color-green)",
                                    fontSize: "0.85rem",
                                    wordBreak: "break-word",
                                    cursor: m.isOwn ? "pointer" : "default",
                                  }}
                                  onDoubleClick={m.isOwn ? () => handleDeleteMessage(m.messageId) : undefined}
                                  onTouchEnd={m.isOwn ? () => handleMessageDoubleTap(m.messageId) : undefined}
                                >
                                  {m.text}
                                </div>
                                <span style={{ fontSize: "0.65rem", color: "var(--color-green)", marginTop: "0.1rem" }}>
                                  {msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid rgba(3, 160, 98, 0.15)", display: "flex", gap: "0.4rem", alignItems: "flex-end" }}>
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                        }}
                        placeholder={tr.typeMessage}
                        rows={1}
                        style={{
                          flex: 1, resize: "none", fontSize: "0.85rem",
                          padding: "0.4rem 0.6rem",
                          background: "rgba(3,160,98,0.08)",
                          border: "1px solid rgba(3,160,98,0.3)",
                          borderRadius: "0.5rem",
                          color: "var(--color-green)", outline: "none", fontFamily: "inherit",
                        }}
                      />
                      <button
                        type="button"
                        className="contact-action-btn contact-action-btn--add"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !messageInput.trim()}
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.6rem" }}
                      >
                        {sendingMessage ? "\u2026" : tr.sendMessage}
                      </button>
                    </div>
                  </>
                )}
                <div className="cube-face-footer" onClick={handleFooterTripleTap}>▼</div>
              </div>
            </article>
          </section>

          {/* Bottom: Info / Announcements */}
          <section className="cube-face cube-face-bottom">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Info</h2>
                </div>
                <p style={{ color: "rgba(3, 160, 98, 0.7)", fontSize: "0.9rem", textAlign: "center", marginTop: "1rem" }}>
                  Updates, announcements, and manual coming soon.
                </p>
                <button
                  className="ghost-btn mt-3"
                  type="button"
                  onClick={goDown}
                >
                  {tr.cancel}
                </button>
              </div>
            </article>
          </section>

          {/* Top: Logout */}
          <section className="cube-face cube-face-top">
            <article className="auth-card cube-face-panel">
              <h2>{tr.logout}</h2>
              <p className="hero-copy">
                {tr.logoutPrompt}
              </p>
              <button
                className="auth-btn"
                type="button"
                onClick={handleLogout}
              >
                {tr.logOut}
              </button>
              <button
                className="ghost-btn mt-3"
                type="button"
                onClick={goUp}
              >
                {tr.cancel}
              </button>
            </article>
          </section>
        </div>
      </div>

      {/* Confirm Dialog is now rendered as an absolute overlay inside the chat face */}

      {/* Custom Alert Dialog - Outside cube stage to avoid fixed-in-transform trap */}
      {alertDialog?.show && (
          <div 
            className="auth-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 3rem)",
              maxWidth: "280px", 
              padding: "1.25rem",
              zIndex: 100,
              boxShadow: "0 10px 40px rgba(6, 236, 144, 0.4)"
            }}
            >
              {alertDialog.title && (
                <h3 style={{ color: "var(--color-green)", fontSize: "1rem", margin: "0 0 0.75rem 0", fontWeight: 600, textAlign: "center" }}>
                  {alertDialog.title}
                </h3>
              )}
              <p style={{ color: "rgba(3, 160, 98, 0.8)", fontSize: "0.85rem", margin: "0 0 1rem 0", textAlign: "center" }}>
                {alertDialog.message}
              </p>
              <button
                type="button"
                className="auth-btn"
                onClick={() => setAlertDialog(null)}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
              >
                {tr.ok}
              </button>
            </div>
        )}
    </div>

  );
}
