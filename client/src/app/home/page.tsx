"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl, postJson } from "../../lib/api";
import { LANGUAGES, getLang, setLang, t, type LangCode } from "../../lib/i18n";
import { useCubeNavigation, type CubeFace } from "../../lib/useCubeNavigation";
import { useSocket } from "../../lib/useSocket";
import ChatsFace from "./components/ChatsFace";
import ContactsFace from "./components/ContactsFace";
import SettingsFace from "./components/SettingsFace";
import MessagesFace from "./components/MessagesFace";
import HomeInfoFace from "./components/InfoFace";
import HomeLogoutFace from "./components/LogoutFace";
import type { ContactSummary, ContactItem, ApiChatsResponse, ApiContactsResponse, PublicUser, ContactRequest, MemberGroup, ContactGroup, ApiPublicUsersResponse, UserSettings, ApiSettingsResponse, ApiTimezonesResponse, ChatMessage, InfoItem, ReportedBug } from "./types";


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
  const [whoseContactAmI, setWhoseContactAmI] = useState<MemberGroup[]>([]);
  const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
  const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ContactRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null);
  const [showContactListGroups, setShowContactListGroups] = useState(false);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [contactGroupsError, setContactGroupsError] = useState<string | null>(null);
  const [loadingContactGroups, setLoadingContactGroups] = useState(false);
  const [removingGroupId, setRemovingGroupId] = useState<number | null>(null);
  const [groupChatTitleEdit, setGroupChatTitleEdit] = useState<{ groupId: number; value: string } | null>(null);
  const [groupChatCreating, setGroupChatCreating] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupSelectedIds, setCreateGroupSelectedIds] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

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
  const [username, setUsername] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);

  // Bottom face state
  type InfoTab = "update" | "manual" | "announcement" | "reported_bugs";
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>("update");
  const [infoItems, setInfoItems] = useState<InfoItem[]>([]);
  const [loadingInfoItems, setLoadingInfoItems] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null);
  const [reportedBugs, setReportedBugs] = useState<ReportedBug[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [bugTitleInput, setBugTitleInput] = useState("");
  const [bugInput, setBugInput] = useState("");
  const [bugCategoryInput, setBugCategoryInput] = useState("Other");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [bugReported, setBugReported] = useState(false);
  const [bugSubView, setBugSubView] = useState<"list" | "report">("list");

  useEffect(() => {
    fetch(buildApiUrl("/auth/me"), { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          window.location.href = "/";
          return;
        }
        return res.json();
      })
      .then((d) => {
        if (d?.username) {
          setUsername(d.username);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        window.location.href = "/";
      });
  }, []);

  const { socket } = useSocket(username);

  const fetchChats = useCallback(async () => {
    if (!username) return;
    try {
      const url = buildApiUrl("/chats");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiChatsResponse;
      if (!res.ok || !data.success) {
        setError(data.error || "Unable to load chats");
        return;
      }
      const personal = data.personal || [];
      const groups = data.groups || [];
      const list: ContactSummary[] = [...personal, ...groups].map((d) => ({
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
    fetch(buildApiUrl("/settings"), { credentials: "include", headers: { Accept: "application/json" } })
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
        const url = buildApiUrl("/contacts");
        const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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
        const url = buildApiUrl("/settings");
        const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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
        const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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
      const url = buildApiUrl("/contacts/public-users");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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

  const fetchContactGroups = async () => {
    if (!username) return;
    setLoadingContactGroups(true);
    setContactGroupsError(null);
    try {
      const url = buildApiUrl("/contacts/groups");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as { success: boolean; data?: ContactGroup[]; error?: string };
      if (!res.ok || !data.success) {
        setContactGroupsError(data.error || "Unable to load groups");
        return;
      }
      setContactGroups(data.data || []);
    } catch (err) {
      setContactGroupsError((err as Error).message);
    } finally {
      setLoadingContactGroups(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createGroupName.trim()) {
      setCreateGroupError(tr.groupNameRequired);
      return;
    }
    setCreatingGroup(true);
    setCreateGroupError(null);
    try {
      // Phase 1: create group
      const initRes = await fetch(buildApiUrl("/contacts/groups/init"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ groupName: createGroupName.trim().slice(0, 32) }),
      });
      const initData = (await initRes.json()) as { success: boolean; data?: { groupId: number }; error?: string };
      if (!initRes.ok || !initData.success || !initData.data?.groupId) {
        setCreateGroupError(initData.error || "Failed to create group");
        return;
      }
      const groupId = initData.data.groupId;

      // Phase 2: add selected members (if any)
      if (createGroupSelectedIds.length > 0) {
        const membersRes = await fetch(buildApiUrl(`/contacts/groups/${groupId}/members`), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ memberIds: createGroupSelectedIds }),
        });
        const membersData = (await membersRes.json()) as { success: boolean; error?: string };
        if (!membersRes.ok || !membersData.success) {
          setCreateGroupError(membersData.error || "Failed to add members");
          return;
        }
      }

      // Reset form and refresh groups list
      setCreateGroupName("");
      setCreateGroupSelectedIds([]);
      setShowCreateGroup(false);
      fetchContactGroups();
      if (!showContactListGroups) {
        setShowContactListGroups(true);
      }
    } catch (err) {
      setCreateGroupError((err as Error).message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const fetchWhoseContactAmI = async () => {
    if (!username) return;
    setLoadingWhoseContactAmI(true);
    try {
      const url = buildApiUrl("/contacts/whose-contact-am-i");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as { success: boolean; data?: MemberGroup[]; error?: string };
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
        fetch(buildApiUrl("/contacts/requests/incoming"), { credentials: "include", headers: { Accept: "application/json" } }),
        fetch(buildApiUrl("/contacts/requests/outgoing"), { credentials: "include", headers: { Accept: "application/json" } }),
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
      const { ok, data } = await postJson("/contacts/requests/approve", { requestId });
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
      const { ok, data } = await postJson("/contacts/requests/reject", { requestId });
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
      const { ok, data } = await postJson("/contacts/requests/cancel", { requestId });
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
      const url = buildApiUrl("/contacts");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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
      const url = buildApiUrl(`/chats/${conversationId}/messages`);
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
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
    setFace("right");
  };

  const handleChatWithContact = async (contactId: number) => {
    try {
      const { ok, data } = await postJson("/chats", { participantUserIds: [contactId] });
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

  const handleChatWithGroup = async (group: ContactGroup, title: string) => {
    if (group.memberIds.length === 0) return;
    setGroupChatCreating(true);
    try {
      const { ok, data } = await postJson("/chats", {
        participantUserIds: group.memberIds,
        ...(group.memberIds.length > 1 ? { title: title.trim() || group.name } : {}),
      });
      if (!ok || !data.success) {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to open chat" });
        return;
      }
      setGroupChatTitleEdit(null);
      fetchChats();
      handleOpenChat(data.data.conversationId, data.data.name, data.data.isGroup);
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setGroupChatCreating(false);
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
      const { ok, data } = await postJson(`/chats/${activeChatId}/messages`, { text });
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
          const url = buildApiUrl(`/chats/${activeChatId}/messages/${messageId}`);
          const res = await fetch(url, { method: "DELETE", credentials: "include", headers: { Accept: "application/json" } });
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
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
      setTimeout(async () => {
        // Clear session on server and redirect
        try {
          await fetch(buildApiUrl("/auth/logout"), { method: "POST", credentials: "include" });
        } catch {
          // Ignore errors — redirect regardless
        }
        window.location.href = "/";
      }, 500); // Wait for rotation to complete
    }, 500); // Wait for up movement to complete
  };

  // Fetch infos when bottom face is active (non-bugs tabs)
  useEffect(() => {
    if (activeFace !== "bottom" || !username) return;
    if (activeInfoTab === "reported_bugs") {
      if (reportedBugs.length > 0) return;
      setLoadingBugs(true);
      fetch(buildApiUrl("/infos/reported-bugs"), { credentials: "include", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((d: { success: boolean; data?: ReportedBug[]; error?: string }) => {
          if (d.success) setReportedBugs(d.data || []);
        })
        .catch(() => {})
        .finally(() => setLoadingBugs(false));
      return;
    }
    setInfoItems([]);
    setSelectedInfo(null);
    setLoadingInfoItems(true);
    fetch(buildApiUrl(`/infos?category=${activeInfoTab}&language_code=${lang}`), { credentials: "include", headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d: { success: boolean; data?: InfoItem[]; error?: string }) => {
        if (d.success) setInfoItems(d.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingInfoItems(false));
  }, [activeFace, activeInfoTab, username, lang, reportedBugs.length]);

  const handleSubmitBug = async () => {
    if (!bugTitleInput.trim() || !bugInput.trim() || !bugCategoryInput || submittingBug) return;
    setSubmittingBug(true);
    try {
      const res = await fetch(buildApiUrl("/infos/report-bug"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ title: bugTitleInput.trim(), description: bugInput.trim(), category: bugCategoryInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBugTitleInput("");
        setBugInput("");
        setBugCategoryInput("Other");
        setBugReported(true);
        setReportedBugs([]); // reset so it reloads on next visit
        setTimeout(() => setBugReported(false), 4000);
      } else {
        setAlertDialog({ show: true, title: "Error", message: data.error || "Failed to submit bug report" });
      }
    } catch (err) {
      setAlertDialog({ show: true, title: "Error", message: (err as Error).message });
    } finally {
      setSubmittingBug(false);
    }
  };

  const tr = t(lang);

  if (!authChecked) return null;

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
          <ChatsFace
            contacts={contacts}
            error={error}
            showNewChat={showNewChat}
            setShowNewChat={setShowNewChat}
            newChatSelectedIds={newChatSelectedIds}
            setNewChatSelectedIds={setNewChatSelectedIds}
            newChatTitle={newChatTitle}
            setNewChatTitle={setNewChatTitle}
            creatingChat={creatingChat}
            newChatError={newChatError}
            setNewChatError={setNewChatError}
            handleOpenChat={handleOpenChat}
            handleCreateChat={handleCreateChat}
            userContacts={userContacts}
            handleHeaderTripleTap={handleHeaderTripleTap}
            handleFooterTripleTap={handleFooterTripleTap}
            setFace={setFace}
            tr={tr}
          />

          {/* Left: Contacts */}
          <ContactsFace
            handleHeaderTripleTap={handleHeaderTripleTap}
            handleFooterTripleTap={handleFooterTripleTap}
            showPublicUserSelect={showPublicUserSelect}
            setShowPublicUserSelect={setShowPublicUserSelect}
            sortedPublicUsers={sortedPublicUsers}
            loadingPublicUsers={loadingPublicUsers}
            publicUserSearch={publicUserSearch}
            setPublicUserSearch={setPublicUserSearch}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            removingPublicUserId={removingPublicUserId}
            addingPublicUserId={addingPublicUserId}
            handleRemovePublicUser={handleRemovePublicUser}
            handleAddPublicUser={handleAddPublicUser}
            fetchPublicUsers={fetchPublicUsers}
            showRequestInput={showRequestInput}
            setShowRequestInput={setShowRequestInput}
            requestDisplayName={requestDisplayName}
            setRequestDisplayName={setRequestDisplayName}
            privateRequestSent={privateRequestSent}
            setPrivateRequestSent={setPrivateRequestSent}
            handleSendRequest={handleSendRequest}
            showContactList={showContactList}
            setShowContactList={setShowContactList}
            contactsError={contactsError}
            userContacts={userContacts}
            contactSortOrder={contactSortOrder}
            setContactSortOrder={setContactSortOrder}
            contactSearch={contactSearch}
            setContactSearch={setContactSearch}
            sortedContacts={sortedContacts}
            removingContactId={removingContactId}
            handleRemoveContact={handleRemoveContact}
            handleChatWithContact={handleChatWithContact}
            fetchUserContacts={fetchUserContacts}
            showContactListGroups={showContactListGroups}
            setShowContactListGroups={setShowContactListGroups}
            contactGroupsError={contactGroupsError}
            loadingContactGroups={loadingContactGroups}
            contactGroups={contactGroups}
            groupChatTitleEdit={groupChatTitleEdit}
            setGroupChatTitleEdit={setGroupChatTitleEdit}
            removingGroupId={removingGroupId}
            setRemovingGroupId={setRemovingGroupId}
            groupChatCreating={groupChatCreating}
            handleChatWithGroup={handleChatWithGroup}
            fetchContactGroups={fetchContactGroups}
            showCreateGroup={showCreateGroup}
            setShowCreateGroup={setShowCreateGroup}
            createGroupError={createGroupError}
            createGroupName={createGroupName}
            setCreateGroupName={setCreateGroupName}
            creatingGroup={creatingGroup}
            handleCreateGroup={handleCreateGroup}
            createGroupSelectedIds={createGroupSelectedIds}
            setCreateGroupSelectedIds={setCreateGroupSelectedIds}
            showRequests={showRequests}
            setShowRequests={setShowRequests}
            loadingRequests={loadingRequests}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            approvingRequestId={approvingRequestId}
            rejectingRequestId={rejectingRequestId}
            cancellingRequestId={cancellingRequestId}
            handleApproveRequest={handleApproveRequest}
            handleRejectRequest={handleRejectRequest}
            handleCancelRequest={handleCancelRequest}
            fetchRequests={fetchRequests}
            showWhoseContactAmI={showWhoseContactAmI}
            setShowWhoseContactAmI={setShowWhoseContactAmI}
            loadingWhoseContactAmI={loadingWhoseContactAmI}
            whoseContactAmI={whoseContactAmI}
            fetchWhoseContactAmI={fetchWhoseContactAmI}
            tr={tr}
          />

          {/* Back: User Settings */}
          <SettingsFace
            settings={settings}
            setSettings={setSettings}
            settingsError={settingsError}
            savingSettings={savingSettings}
            settingsSaved={settingsSaved}
            handleSaveSettings={handleSaveSettings}
            timezones={timezones}
            lang={lang}
            showLangSelect={showLangSelect}
            setShowLangSelect={setShowLangSelect}
            handleLangChange={handleLangChange}
            showMaxParticipantsSelect={showMaxParticipantsSelect}
            setShowMaxParticipantsSelect={setShowMaxParticipantsSelect}
            showTimezoneSelect={showTimezoneSelect}
            setShowTimezoneSelect={setShowTimezoneSelect}
            handleHeaderTripleTap={handleHeaderTripleTap}
            handleFooterTripleTap={handleFooterTripleTap}
            tr={tr}
          />

          {/* Right: Chat view */}
          <MessagesFace
            activeChatId={activeChatId}
            activeChatName={activeChatName}
            activeChatIsGroup={activeChatIsGroup}
            activeChatMessages={activeChatMessages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            chatLoading={chatLoading}
            chatError={chatError}
            sendingMessage={sendingMessage}
            confirmDialog={confirmDialog}
            setConfirmDialog={setConfirmDialog}
            handleSendMessage={handleSendMessage}
            handleDeleteMessage={handleDeleteMessage}
            handleMessageDoubleTap={handleMessageDoubleTap}
            settings={settings}
            handleHeaderTripleTap={handleHeaderTripleTap}
            handleFooterTripleTap={handleFooterTripleTap}
            setFace={setFace}
            messagesEndRef={messagesEndRef}
            tr={tr}
          />

          {/* Bottom: Info / Announcements */}
          <HomeInfoFace
            activeInfoTab={activeInfoTab}
            setActiveInfoTab={setActiveInfoTab}
            infoItems={infoItems}
            loadingInfoItems={loadingInfoItems}
            selectedInfo={selectedInfo}
            setSelectedInfo={setSelectedInfo}
            reportedBugs={reportedBugs}
            loadingBugs={loadingBugs}
            bugTitleInput={bugTitleInput}
            setBugTitleInput={setBugTitleInput}
            bugInput={bugInput}
            setBugInput={setBugInput}
            bugCategoryInput={bugCategoryInput}
            setBugCategoryInput={setBugCategoryInput}
            submittingBug={submittingBug}
            bugReported={bugReported}
            bugSubView={bugSubView}
            setBugSubView={setBugSubView}
            handleSubmitBug={handleSubmitBug}
            lang={lang}
            goDown={goDown}
            tr={tr}
          />

          {/* Top: Logout */}
          <HomeLogoutFace
            handleLogout={handleLogout}
            goUp={goUp}
            tr={tr}
          />
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
