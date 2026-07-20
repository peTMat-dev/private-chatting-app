import { useCallback, useState, Dispatch, SetStateAction } from "react";
import { buildApiUrl } from "../lib/api";
import type { ContactSummary, ContactItem, ApiChatsResponse } from "../lib/formTypes";

interface UseChatsFaceOptions {
  username: string;
  userContacts: ContactItem[];
  onOpenChat: (id: number, name: string, isGroup: boolean) => void;
  showAlert: (message: string, title?: string) => void;
}

interface UseChatsFaceReturn {
  contacts: ContactSummary[];
  setContacts: Dispatch<SetStateAction<ContactSummary[]>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  showNewChat: boolean;
  setShowNewChat: Dispatch<SetStateAction<boolean>>;
  newChatSelectedIds: number[];
  setNewChatSelectedIds: Dispatch<SetStateAction<number[]>>;
  newChatTitle: string;
  setNewChatTitle: Dispatch<SetStateAction<string>>;
  creatingChat: boolean;
  setCreatingChat: Dispatch<SetStateAction<boolean>>;
  newChatError: string | null;
  setNewChatError: Dispatch<SetStateAction<string | null>>;
  handleCreateChat: () => Promise<void>;
  fetchChats: () => Promise<void>;
}

export function useChatsFace({
  username,
  userContacts,
  onOpenChat,
  showAlert,
}: UseChatsFaceOptions): UseChatsFaceReturn {
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSelectedIds, setNewChatSelectedIds] = useState<number[]>([]);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);

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

  const handleCreateChat = useCallback(async () => {
    if (newChatSelectedIds.length === 0) return;
    setCreatingChat(true);
    setNewChatError(null);
    try {
      const isGroup = newChatSelectedIds.length > 1;
      const title = isGroup ? newChatTitle.trim().slice(0, 32) : undefined;

      if (isGroup && !title) {
        setNewChatError("Group title required");
        return;
      }

      const url = buildApiUrl("/chats");
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          participantIds: newChatSelectedIds,
          title,
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { conversationId: number; name: string; isGroup: boolean };
        error?: string;
      };

      if (!res.ok || !data.success || !data.data) {
        setNewChatError(data.error || "Failed to create chat");
        return;
      }

      onOpenChat(data.data.conversationId, data.data.name, data.data.isGroup);

      setShowNewChat(false);
      setNewChatSelectedIds([]);
      setNewChatTitle("");
      setNewChatError(null);

      fetchChats();
    } catch (err) {
      setNewChatError((err as Error).message);
    } finally {
      setCreatingChat(false);
    }
  }, [newChatSelectedIds, newChatTitle, onOpenChat, fetchChats]);

  return {
    contacts,
    setContacts,
    error,
    setError,
    showNewChat,
    setShowNewChat,
    newChatSelectedIds,
    setNewChatSelectedIds,
    newChatTitle,
    setNewChatTitle,
    creatingChat,
    setCreatingChat,
    newChatError,
    setNewChatError,
    handleCreateChat,
    fetchChats,
  };
}