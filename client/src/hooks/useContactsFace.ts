import { useCallback, useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { buildApiUrl, postJson } from "../lib/api";
import type {
  ContactItem,
  PublicUser,
  ContactRequest,
  MemberGroup,
  ContactGroup,
  ApiContactsResponse,
  ApiPublicUsersResponse,
  ApiContactGroupsResponse,
  ApiWhoseContactAmIResponse,
} from "../lib/formTypes";

interface UseContactsFaceOptions {
  username: string;
  showAlert: (message: string, title?: string) => void;
  onOpenChat: (id: number, name: string, isGroup: boolean) => void;
  fetchChats: () => Promise<void>;
}

interface UseContactsFaceReturn {
  // User contacts
  userContacts: ContactItem[];
  setUserContacts: Dispatch<SetStateAction<ContactItem[]>>;
  contactsError: string | null;
  contactSortOrder: "asc" | "desc";
  setContactSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  contactSearch: string;
  setContactSearch: Dispatch<SetStateAction<string>>;
  sortedContacts: ContactItem[];
  removingContactId: number | null;
  handleRemoveContact: (id: number) => Promise<void>;
  handleChatWithContact: (id: number) => Promise<void>;
  fetchUserContacts: () => Promise<void>;

  // Public users
  showPublicUserSelect: boolean;
  setShowPublicUserSelect: Dispatch<SetStateAction<boolean>>;
  publicUsers: PublicUser[];
  setPublicUsers: Dispatch<SetStateAction<PublicUser[]>>;
  sortedPublicUsers: PublicUser[];
  loadingPublicUsers: boolean;
  publicUserSearch: string;
  setPublicUserSearch: Dispatch<SetStateAction<string>>;
  sortOrder: "asc" | "desc";
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  removingPublicUserId: number | null;
  addingPublicUserId: number | null;
  handleRemovePublicUser: (id: number) => Promise<void>;
  handleAddPublicUser: (id: number, displayName: string) => Promise<void>;
  fetchPublicUsers: () => Promise<void>;

  // Contact groups
  showContactListGroups: boolean;
  setShowContactListGroups: Dispatch<SetStateAction<boolean>>;
  contactGroups: ContactGroup[];
  contactGroupsError: string | null;
  loadingContactGroups: boolean;
  groupChatTitleEdit: { groupId: number; value: string } | null;
  setGroupChatTitleEdit: Dispatch<SetStateAction<{ groupId: number; value: string } | null>>;
  removingGroupId: number | null;
  setRemovingGroupId: Dispatch<SetStateAction<number | null>>;
  groupChatCreating: boolean;
  handleChatWithGroup: (g: ContactGroup, title: string) => Promise<void>;
  fetchContactGroups: () => Promise<void>;

  // Create group
  showCreateGroup: boolean;
  setShowCreateGroup: Dispatch<SetStateAction<boolean>>;
  createGroupError: string | null;
  createGroupName: string;
  setCreateGroupName: Dispatch<SetStateAction<string>>;
  creatingGroup: boolean;
  handleCreateGroup: () => Promise<void>;
  createGroupSelectedIds: number[];
  setCreateGroupSelectedIds: Dispatch<SetStateAction<number[]>>;

  // Contact requests
  showRequests: boolean;
  setShowRequests: Dispatch<SetStateAction<boolean>>;
  loadingRequests: boolean;
  incomingRequests: ContactRequest[];
  setIncomingRequests: Dispatch<SetStateAction<ContactRequest[]>>;
  outgoingRequests: ContactRequest[];
  setOutgoingRequests: Dispatch<SetStateAction<ContactRequest[]>>;
  approvingRequestId: number | null;
  rejectingRequestId: number | null;
  cancellingRequestId: number | null;
  handleApproveRequest: (id: number) => Promise<void>;
  handleRejectRequest: (id: number) => Promise<void>;
  handleCancelRequest: (requestId: number, userId: number) => Promise<void>;
  fetchRequests: () => Promise<void>;

  // Private request
  showRequestInput: boolean;
  setShowRequestInput: Dispatch<SetStateAction<boolean>>;
  requestDisplayName: string;
  setRequestDisplayName: Dispatch<SetStateAction<string>>;
  privateRequestSent: boolean;
  setPrivateRequestSent: Dispatch<SetStateAction<boolean>>;
  handleSendRequest: () => Promise<void>;

  // Whose contact am I
  showWhoseContactAmI: boolean;
  setShowWhoseContactAmI: Dispatch<SetStateAction<boolean>>;
  loadingWhoseContactAmI: boolean;
  whoseContactAmI: MemberGroup[];
  fetchWhoseContactAmI: () => Promise<void>;

  // Contact list toggle
  showContactList: boolean;
  setShowContactList: Dispatch<SetStateAction<boolean>>;
}

export function useContactsFace({
  username,
  showAlert,
  onOpenChat,
  fetchChats,
}: UseContactsFaceOptions): UseContactsFaceReturn {
  // User contacts state
  const [userContacts, setUserContacts] = useState<ContactItem[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">("asc");
  const [contactSearch, setContactSearch] = useState("");
  const [removingContactId, setRemovingContactId] = useState<number | null>(null);
  const [showContactList, setShowContactList] = useState(false);

  // Public users state
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [publicUserSearch, setPublicUserSearch] = useState("");
  const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
  const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
  const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
  const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);

  // Contact groups state
  const [showContactListGroups, setShowContactListGroups] = useState(false);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [contactGroupsError, setContactGroupsError] = useState<string | null>(null);
  const [loadingContactGroups, setLoadingContactGroups] = useState(false);
  const [removingGroupId, setRemovingGroupId] = useState<number | null>(null);
  const [groupChatTitleEdit, setGroupChatTitleEdit] = useState<{ groupId: number; value: string } | null>(null);
  const [groupChatCreating, setGroupChatCreating] = useState(false);

  // Create group state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupSelectedIds, setCreateGroupSelectedIds] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  // Contact requests state
  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ContactRequest[]>([]);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null);

  // Private request state
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState("");
  const [privateRequestSent, setPrivateRequestSent] = useState(false);

  // Whose contact am I state
  const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
  const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
  const [whoseContactAmI, setWhoseContactAmI] = useState<MemberGroup[]>([]);

  // Computed: sorted contacts
  const sortedContacts = useMemo(() => {
    const filtered = userContacts.filter((c) =>
      c.displayName.toLowerCase().includes(contactSearch.toLowerCase())
    );
    return filtered.sort((a, b) =>
      contactSortOrder === "asc"
        ? a.displayName.localeCompare(b.displayName)
        : b.displayName.localeCompare(a.displayName)
    );
  }, [userContacts, contactSearch, contactSortOrder]);

  // Computed: sorted public users
  const sortedPublicUsers = useMemo(() => {
    const filtered = publicUsers.filter((u) =>
      u.displayName.toLowerCase().includes(publicUserSearch.toLowerCase())
    );
    return filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.displayName.localeCompare(b.displayName)
        : b.displayName.localeCompare(a.displayName)
    );
  }, [publicUsers, publicUserSearch, sortOrder]);

  // Fetch user contacts
  const fetchUserContacts = useCallback(async () => {
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
  }, [username]);

  // Initial fetch of contacts
  useEffect(() => {
    fetchUserContacts();
  }, [fetchUserContacts]);

  // Fetch public users
  const fetchPublicUsers = useCallback(async () => {
    if (!username) {
      showAlert("Session expired. Please log in again.", "Error");
      return;
    }
    setLoadingPublicUsers(true);
    try {
      const url = buildApiUrl("/contacts/public-users");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiPublicUsersResponse;
      if (!res.ok || !data.success) {
        showAlert(data.error || "Unable to load public users", "Error");
        return;
      }
      setPublicUsers((data.data as PublicUser[]) || []);
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setLoadingPublicUsers(false);
    }
  }, [username, showAlert]);

  // Initial fetch of public users
  useEffect(() => {
    if (publicUsers.length === 0 && username) {
      fetchPublicUsers();
    }
  }, [username, publicUsers.length, fetchPublicUsers]);

  // Handle remove contact
  const handleRemoveContact = useCallback(async (contactId: number) => {
    setRemovingContactId(contactId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/remove", {
        contactUserId: contactId,
      });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to remove contact", "Error");
        return;
      }
      setUserContacts((prev) => prev.filter((c) => c.id !== contactId));
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === contactId ? { ...u, isAlreadyContact: false, hasPendingRequest: false } : u))
      );
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setRemovingContactId(null);
    }
  }, [showAlert]);

  // Handle chat with contact
  const handleChatWithContact = useCallback(async (contactId: number) => {
    const contact = userContacts.find((c) => c.id === contactId);
    if (!contact) return;

    try {
      const { ok, data } = await postJson<{ success: boolean; data?: { conversationId: number }; error?: string }>(
        "/chats/open-with-contact",
        { contactUserId: contactId }
      );
      if (!ok || !data.success || !data.data) {
        showAlert(data.error || "Failed to open chat", "Error");
        return;
      }
      onOpenChat(data.data.conversationId, contact.displayName, false);
      fetchChats();
    } catch (err) {
      showAlert((err as Error).message, "Error");
    }
  }, [userContacts, onOpenChat, fetchChats, showAlert]);

  // Handle remove public user
  const handleRemovePublicUser = useCallback(async (userId: number) => {
    setRemovingPublicUserId(userId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/remove", {
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to remove contact", "Error");
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAlreadyContact: false } : u))
      );
      fetchUserContacts();
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setRemovingPublicUserId(null);
    }
  }, [showAlert, fetchUserContacts]);

  // Handle add public user
  const handleAddPublicUser = useCallback(async (userId: number, displayName: string) => {
    if (!userId || !displayName) return;
    setAddingPublicUserId(userId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/add-public", {
        contactUserId: userId,
      });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to send contact request", "Error");
        return;
      }
      setPublicUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, hasPendingRequest: true } : u))
      );
      if (showRequests) fetchRequests();
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setAddingPublicUserId(null);
    }
  }, [showAlert, showRequests]);

  // Fetch contact groups
  const fetchContactGroups = useCallback(async () => {
    if (!username) return;
    setLoadingContactGroups(true);
    setContactGroupsError(null);
    try {
      const url = buildApiUrl("/contacts/groups");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiContactGroupsResponse;
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
  }, [username]);

  // Handle chat with group
  const handleChatWithGroup = useCallback(async (g: ContactGroup, title: string) => {
    setGroupChatCreating(true);
    try {
      const { ok, data } = await postJson<{ success: boolean; data?: { conversationId: number }; error?: string }>(
        `/contacts/groups/${g.id}/chat`,
        { chatName: title }
      );
      if (!ok || !data.success || !data.data) {
        showAlert(data.error || "Failed to open group chat", "Error");
        return;
      }
      onOpenChat(data.data.conversationId, title, true);
      fetchChats();
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setGroupChatCreating(false);
    }
  }, [onOpenChat, fetchChats, showAlert]);

  // Handle create group
  const handleCreateGroup = useCallback(async () => {
    if (!createGroupName.trim()) {
      setCreateGroupError("Group name is required");
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
  }, [createGroupName, createGroupSelectedIds, fetchContactGroups, showContactListGroups]);

  // Fetch whose contact am I
  const fetchWhoseContactAmI = useCallback(async () => {
    if (!username) return;
    setLoadingWhoseContactAmI(true);
    try {
      const url = buildApiUrl("/contacts/whose-contact-am-i");
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiWhoseContactAmIResponse;
      if (!res.ok || !data.success) {
        showAlert(data.error || "Unable to load", "Error");
        return;
      }
      setWhoseContactAmI(data.data || []);
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setLoadingWhoseContactAmI(false);
    }
  }, [username, showAlert]);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
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
      showAlert((err as Error).message, "Error");
    } finally {
      setLoadingRequests(false);
    }
  }, [username, showAlert]);

  // Handle approve request
  const handleApproveRequest = useCallback(async (requestId: number) => {
    setApprovingRequestId(requestId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/requests/approve", { requestId });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to approve request", "Error");
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      fetchUserContacts();
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setApprovingRequestId(null);
    }
  }, [showAlert, fetchUserContacts]);

  // Handle reject request
  const handleRejectRequest = useCallback(async (requestId: number) => {
    setRejectingRequestId(requestId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/requests/reject", { requestId });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to reject request", "Error");
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setRejectingRequestId(null);
    }
  }, [showAlert]);

  // Handle cancel request
  const handleCancelRequest = useCallback(async (requestId: number, targetId: number) => {
    setCancellingRequestId(requestId);
    try {
      const { ok, data } = await postJson<{ success: boolean; error?: string }>("/contacts/requests/cancel", { requestId });
      if (!ok || !data.success) {
        showAlert(data.error || "Failed to cancel request", "Error");
        return;
      }
      setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      setPublicUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, hasPendingRequest: false } : u));
    } catch (err) {
      showAlert((err as Error).message, "Error");
    } finally {
      setCancellingRequestId(null);
    }
  }, [showAlert]);

  // Handle send request
  const handleSendRequest = useCallback(async () => {
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
  }, [requestDisplayName, showRequests, fetchRequests]);

  return {
    // User contacts
    userContacts,
    setUserContacts,
    contactsError,
    contactSortOrder,
    setContactSortOrder,
    contactSearch,
    setContactSearch,
    sortedContacts,
    removingContactId,
    handleRemoveContact,
    handleChatWithContact,
    fetchUserContacts,

    // Public users
    showPublicUserSelect,
    setShowPublicUserSelect,
    publicUsers,
    setPublicUsers,
    sortedPublicUsers,
    loadingPublicUsers,
    publicUserSearch,
    setPublicUserSearch,
    sortOrder,
    setSortOrder,
    removingPublicUserId,
    addingPublicUserId,
    handleRemovePublicUser,
    handleAddPublicUser,
    fetchPublicUsers,

    // Contact groups
    showContactListGroups,
    setShowContactListGroups,
    contactGroups,
    contactGroupsError,
    loadingContactGroups,
    groupChatTitleEdit,
    setGroupChatTitleEdit,
    removingGroupId,
    setRemovingGroupId,
    groupChatCreating,
    handleChatWithGroup,
    fetchContactGroups,

    // Create group
    showCreateGroup,
    setShowCreateGroup,
    createGroupError,
    createGroupName,
    setCreateGroupName,
    creatingGroup,
    handleCreateGroup,
    createGroupSelectedIds,
    setCreateGroupSelectedIds,

    // Contact requests
    showRequests,
    setShowRequests,
    loadingRequests,
    incomingRequests,
    setIncomingRequests,
    outgoingRequests,
    setOutgoingRequests,
    approvingRequestId,
    rejectingRequestId,
    cancellingRequestId,
    handleApproveRequest,
    handleRejectRequest,
    handleCancelRequest,
    fetchRequests,

    // Private request
    showRequestInput,
    setShowRequestInput,
    requestDisplayName,
    setRequestDisplayName,
    privateRequestSent,
    setPrivateRequestSent,
    handleSendRequest,

    // Whose contact am I
    showWhoseContactAmI,
    setShowWhoseContactAmI,
    loadingWhoseContactAmI,
    whoseContactAmI,
    fetchWhoseContactAmI,

    // Contact list toggle
    showContactList,
    setShowContactList,
  };
}