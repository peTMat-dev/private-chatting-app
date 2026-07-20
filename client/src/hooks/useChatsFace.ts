import { useCallback, useState, Dispatch, SetStateAction } from "react";
import { getApi, fetchApiCustom } from "../services/api.service";
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
      const data = await getApi<ApiChatsResponse>("/chats");
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

      interface CreateChatResponse {
        success: boolean;
        data?: { conversationId: number; name: string; isGroup: boolean };
        error?: string;
      }

      const data = await fetchApiCustom<CreateChatResponse>("/chats", {
        method: "POST",
        body: JSON.stringify({
          participantIds: newChatSelectedIds,
          title,
        }),
      });

      if (!data.data) {
        setNewChatError("Failed to create chat");
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