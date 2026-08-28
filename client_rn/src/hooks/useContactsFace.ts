import { useCallback, useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { getApi, postApi, fetchApiCustom } from '../services/api.service';
import type {
  ContactItem, PublicUser, ContactRequest, MemberGroup, ContactGroup,
  ApiContactsResponse, ApiPublicUsersResponse, ApiContactGroupsResponse, ApiWhoseContactAmIResponse,
} from '../lib/formTypes';

interface UseContactsFaceOptions {
  username: string;
  showAlert: (message: string, title?: string) => void;
  onOpenChat: (id: number, name: string, isGroup: boolean) => void;
  fetchChats: () => Promise<void>;
}

interface UseContactsFaceReturn {
  userContacts: ContactItem[];
  setUserContacts: Dispatch<SetStateAction<ContactItem[]>>;
  contactsError: string | null;
  contactSortOrder: 'asc' | 'desc';
  setContactSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>;
  contactSearch: string;
  setContactSearch: Dispatch<SetStateAction<string>>;
  sortedContacts: ContactItem[];
  removingContactId: number | null;
  handleRemoveContact: (id: number) => Promise<void>;
  handleChatWithContact: (id: number) => Promise<void>;
  fetchUserContacts: () => Promise<void>;
  showPublicUserSelect: boolean;
  setShowPublicUserSelect: Dispatch<SetStateAction<boolean>>;
  publicUsers: PublicUser[];
  setPublicUsers: Dispatch<SetStateAction<PublicUser[]>>;
  sortedPublicUsers: PublicUser[];
  loadingPublicUsers: boolean;
  publicUserSearch: string;
  setPublicUserSearch: Dispatch<SetStateAction<string>>;
  sortOrder: 'asc' | 'desc';
  setSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>;
  removingPublicUserId: number | null;
  addingPublicUserId: number | null;
  handleRemovePublicUser: (id: number) => Promise<void>;
  handleAddPublicUser: (id: number, displayName: string) => Promise<void>;
  fetchPublicUsers: () => Promise<void>;
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
  showCreateGroup: boolean;
  setShowCreateGroup: Dispatch<SetStateAction<boolean>>;
  createGroupError: string | null;
  createGroupName: string;
  setCreateGroupName: Dispatch<SetStateAction<string>>;
  creatingGroup: boolean;
  handleCreateGroup: () => Promise<void>;
  createGroupSelectedIds: number[];
  setCreateGroupSelectedIds: Dispatch<SetStateAction<number[]>>;
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
  showRequestInput: boolean;
  setShowRequestInput: Dispatch<SetStateAction<boolean>>;
  requestDisplayName: string;
  setRequestDisplayName: Dispatch<SetStateAction<string>>;
  privateRequestSent: boolean;
  setPrivateRequestSent: Dispatch<SetStateAction<boolean>>;
  handleSendRequest: () => Promise<void>;
  showWhoseContactAmI: boolean;
  setShowWhoseContactAmI: Dispatch<SetStateAction<boolean>>;
  loadingWhoseContactAmI: boolean;
  whoseContactAmI: MemberGroup[];
  fetchWhoseContactAmI: () => Promise<void>;
  showContactList: boolean;
  setShowContactList: Dispatch<SetStateAction<boolean>>;
}

export function useContactsFace({
  username, showAlert, onOpenChat, fetchChats,
}: UseContactsFaceOptions): UseContactsFaceReturn {
  const [userContacts, setUserContacts] = useState<ContactItem[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc');
  const [contactSearch, setContactSearch] = useState('');
  const [removingContactId, setRemovingContactId] = useState<number | null>(null);

  const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
  const [publicUserSearch, setPublicUserSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
  const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);

  const [showContactListGroups, setShowContactListGroups] = useState(false);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [contactGroupsError, setContactGroupsError] = useState<string | null>(null);
  const [loadingContactGroups, setLoadingContactGroups] = useState(false);
  const [groupChatTitleEdit, setGroupChatTitleEdit] = useState<{ groupId: number; value: string } | null>(null);
  const [removingGroupId, setRemovingGroupId] = useState<number | null>(null);
  const [groupChatCreating, setGroupChatCreating] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [createGroupName, setCreateGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupSelectedIds, setCreateGroupSelectedIds] = useState<number[]>([]);

  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ContactRequest[]>([]);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null);

  const [showRequestInput, setShowRequestInput] = useState(false);
  const [requestDisplayName, setRequestDisplayName] = useState('');
  const [privateRequestSent, setPrivateRequestSent] = useState(false);

  const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
  const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
  const [whoseContactAmI, setWhoseContactAmI] = useState<MemberGroup[]>([]);

  const [showContactList, setShowContactList] = useState(false);

  const sortedContacts = useMemo(() => {
    let filtered = userContacts;
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      filtered = filtered.filter((c) => c.displayName.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => {
      const cmp = a.displayName.localeCompare(b.displayName);
      return contactSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [userContacts, contactSearch, contactSortOrder]);

  const sortedPublicUsers = useMemo(() => {
    let filtered = publicUsers;
    if (publicUserSearch.trim()) {
      const q = publicUserSearch.toLowerCase();
      filtered = filtered.filter((u) => u.displayName.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => {
      const cmp = a.displayName.localeCompare(b.displayName);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [publicUsers, publicUserSearch, sortOrder]);

  const fetchUserContacts = useCallback(async () => {
    if (!username) return;
    try {
      const data = await getApi<ApiContactsResponse>('/contacts');
      setUserContacts(data.data || []);
    } catch (err) { setContactsError((err as Error).message); }
  }, [username]);

  const fetchPublicUsers = useCallback(async () => {
    if (!username) return;
    setLoadingPublicUsers(true);
    try {
      const data = await getApi<ApiPublicUsersResponse>('/contacts/public-users');
      setPublicUsers(data.data || []);
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setLoadingPublicUsers(false); }
  }, [username, showAlert]);

  const fetchContactGroups = useCallback(async () => {
    if (!username) return;
    setLoadingContactGroups(true); setContactGroupsError(null);
    try {
      const data = await getApi<ApiContactGroupsResponse>('/contacts/groups');
      setContactGroups(data.data || []);
    } catch (err) { setContactGroupsError((err as Error).message); }
    finally { setLoadingContactGroups(false); }
  }, [username]);

  const fetchRequests = useCallback(async () => {
    if (!username) return;
    setLoadingRequests(true);
    try {
      const data = await getApi<{ success: boolean; incoming?: ContactRequest[]; outgoing?: ContactRequest[] }>('/contacts/requests');
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setLoadingRequests(false); }
  }, [username, showAlert]);

  const fetchWhoseContactAmI = useCallback(async () => {
    if (!username) return;
    setLoadingWhoseContactAmI(true);
    try {
      const data = await getApi<ApiWhoseContactAmIResponse>('/contacts/whose-contact-am-i');
      setWhoseContactAmI(data.data || []);
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setLoadingWhoseContactAmI(false); }
  }, [username, showAlert]);

  useEffect(() => { if (username) fetchUserContacts(); }, [username, fetchUserContacts]);

  const handleRemoveContact = useCallback(async (id: number) => {
    setRemovingContactId(id);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/remove', { contactUserId: id });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setUserContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setRemovingContactId(null); }
  }, [showAlert]);

  const handleChatWithContact = useCallback(async (id: number) => {
    try {
      const data = await fetchApiCustom<{ success: boolean; data?: { conversationId: number; name: string; isGroup: boolean } }>('/chats', {
        method: 'POST', body: JSON.stringify({ participantIds: [id] }),
      });
      if (!data.data) { showAlert('Failed to open chat', 'Error'); return; }
      onOpenChat(data.data.conversationId, data.data.name, data.data.isGroup);
      fetchChats();
    } catch (err) { showAlert((err as Error).message, 'Error'); }
  }, [onOpenChat, fetchChats, showAlert]);

  const handleAddPublicUser = useCallback(async (id: number, displayName: string) => {
    setAddingPublicUserId(id);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/add-public', { contactUserId: id });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setPublicUsers((prev) => prev.map((u) => u.id === id ? { ...u, hasPendingRequest: true } : u));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setAddingPublicUserId(null); }
  }, [showAlert]);

  const handleRemovePublicUser = useCallback(async (id: number) => {
    setRemovingPublicUserId(id);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/remove', { contactUserId: id });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setPublicUsers((prev) => prev.map((u) => u.id === id ? { ...u, isAlreadyContact: false } : u));
      setUserContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setRemovingPublicUserId(null); }
  }, [showAlert]);

  const handleChatWithGroup = useCallback(async (g: ContactGroup, title: string) => {
    setGroupChatCreating(true);
    try {
      const data = await fetchApiCustom<{ success: boolean; data?: { conversationId: number } }>('/contacts/groups/' + g.id + '/chat', {
        method: 'POST', body: JSON.stringify({ chatName: title }),
      });
      if (!data.data) { showAlert('Failed', 'Error'); return; }
      onOpenChat(data.data.conversationId, title, true);
      fetchChats();
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setGroupChatCreating(false); }
  }, [onOpenChat, fetchChats, showAlert]);

  const handleCreateGroup = useCallback(async () => {
    if (createGroupSelectedIds.length === 0) return;
    const name = createGroupName.trim();
    if (!name) { setCreateGroupError('Group name required'); return; }
    setCreatingGroup(true); setCreateGroupError(null);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/groups', { name, memberIds: createGroupSelectedIds });
      if (!ok || !data.success) { setCreateGroupError(data.error || 'Failed'); return; }
      setCreateGroupName(''); setCreateGroupSelectedIds([]); setShowCreateGroup(false);
      fetchContactGroups();
    } catch (err) { setCreateGroupError((err as Error).message); }
    finally { setCreatingGroup(false); }
  }, [createGroupSelectedIds, createGroupName, fetchContactGroups]);

  const handleApproveRequest = useCallback(async (id: number) => {
    setApprovingRequestId(id);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/requests/approve', { requestId: id });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== id));
      fetchUserContacts();
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setApprovingRequestId(null); }
  }, [showAlert, fetchUserContacts]);

  const handleRejectRequest = useCallback(async (id: number) => {
    setRejectingRequestId(id);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/requests/reject', { requestId: id });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== id));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setRejectingRequestId(null); }
  }, [showAlert]);

  const handleCancelRequest = useCallback(async (requestId: number, targetId: number) => {
    setCancellingRequestId(requestId);
    try {
      const { ok, data } = await postApi<{ success: boolean; error?: string }>('/contacts/requests/cancel', { requestId });
      if (!ok || !data.success) { showAlert(data.error || 'Failed', 'Error'); return; }
      setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      setPublicUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, hasPendingRequest: false } : u));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
    finally { setCancellingRequestId(null); }
  }, [showAlert]);

  const handleSendRequest = useCallback(async () => {
    if (!requestDisplayName.trim()) return;
    try {
      await postApi<{ success: boolean; error?: string }>('/contacts/request', { displayName: requestDisplayName.trim() });
      if (showRequests) fetchRequests();
    } catch {}
    setRequestDisplayName(''); setPrivateRequestSent(true);
  }, [requestDisplayName, showRequests, fetchRequests]);

  return {
    userContacts, setUserContacts, contactsError, contactSortOrder, setContactSortOrder,
    contactSearch, setContactSearch, sortedContacts, removingContactId,
    handleRemoveContact, handleChatWithContact, fetchUserContacts,
    showPublicUserSelect, setShowPublicUserSelect, publicUsers, setPublicUsers,
    sortedPublicUsers, loadingPublicUsers, publicUserSearch, setPublicUserSearch,
    sortOrder, setSortOrder, removingPublicUserId, addingPublicUserId,
    handleRemovePublicUser, handleAddPublicUser, fetchPublicUsers,
    showContactListGroups, setShowContactListGroups, contactGroups, contactGroupsError,
    loadingContactGroups, groupChatTitleEdit, setGroupChatTitleEdit, removingGroupId,
    setRemovingGroupId, groupChatCreating, handleChatWithGroup, fetchContactGroups,
    showCreateGroup, setShowCreateGroup, createGroupError, createGroupName,
    setCreateGroupName, creatingGroup, handleCreateGroup, createGroupSelectedIds, setCreateGroupSelectedIds,
    showRequests, setShowRequests, loadingRequests, incomingRequests, setIncomingRequests,
    outgoingRequests, setOutgoingRequests, approvingRequestId, rejectingRequestId, cancellingRequestId,
    handleApproveRequest, handleRejectRequest, handleCancelRequest, fetchRequests,
    showRequestInput, setShowRequestInput, requestDisplayName, setRequestDisplayName,
    privateRequestSent, setPrivateRequestSent, handleSendRequest,
    showWhoseContactAmI, setShowWhoseContactAmI, loadingWhoseContactAmI, whoseContactAmI, fetchWhoseContactAmI,
    showContactList, setShowContactList,
  };
}
