import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction, RefObject } from "react";
import { buildApiUrl, postJson } from "../lib/api";
import type { ChatMessage, ConfirmDialog, ApiMessagesResponse } from "../lib/formTypes";

interface UseMessagesFaceOptions {
  username: string;
  currentUserDisplayName: string;
  activeFace: string;
  showAlert: (message: string, title?: string) => void;
}

interface UseMessagesFaceReturn {
  activeChatId: number | null;
  setActiveChatId: Dispatch<SetStateAction<number | null>>;
  activeChatName: string;
  setActiveChatName: Dispatch<SetStateAction<string>>;
  activeChatIsGroup: boolean;
  setActiveChatIsGroup: Dispatch<SetStateAction<boolean>>;
  activeChatMessages: ChatMessage[];
  setActiveChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  chatLoading: boolean;
  chatError: string | null;
  sendingMessage: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleOpenChat: (id: number, name: string, isGroup: boolean) => void;
  handleSendMessage: () => Promise<void>;
  handleDeleteMessage: (messageId: number) => void;
  handleMessageDoubleTap: (messageId: number) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  confirmDialog: ConfirmDialog | null;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialog | null>>;
}

export function useMessagesFace({
  username,
  currentUserDisplayName,
  activeFace,
  showAlert,
}: UseMessagesFaceOptions): UseMessagesFaceReturn {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>("");
  const [activeChatIsGroup, setActiveChatIsGroup] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeChatIdRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ messageId: number; time: number } | null>(null);

  // Keep activeChatIdRef in sync so socket handler can read it without re-subscribing
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages]);

  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!username) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const url = buildApiUrl(`/chats/${conversationId}/messages`);
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      const data = (await res.json()) as ApiMessagesResponse;
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

  // Load messages whenever the right face becomes active with a selected chat
  useEffect(() => {
    if (activeFace === "right" && activeChatId !== null) {
      fetchMessages(activeChatId);
    }
  }, [activeFace, activeChatId, fetchMessages]);

  const handleOpenChat = useCallback((id: number, name: string, isGroup: boolean) => {
    setActiveChatId(id);
    setActiveChatName(name);
    setActiveChatIsGroup(isGroup);
    setActiveChatMessages([]);
    setChatError(null);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeChatId || !username || sendingMessage) return;

    const text = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      messageId: Date.now(), // temporary ID
      text,
      senderUserId: 0, // will be replaced
      senderDisplayName: currentUserDisplayName,
      sentAt: new Date().toISOString(),
      isOwn: true,
    };
    setActiveChatMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { ok, data } = await postJson<{ success: boolean; data?: { messageId: number }; error?: string }>(
        `/chats/${activeChatId}/messages`,
        { text }
      );

      if (!ok || !data.success) {
        showAlert(data.error || "Failed to send message", "Error");
        // Remove optimistic message on failure
        setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== optimisticMessage.messageId));
        setMessageInput(text); // Restore input
        return;
      }

      // Update optimistic message with real messageId
      if (data.data?.messageId) {
        setActiveChatMessages((prev) =>
          prev.map((m) =>
            m.messageId === optimisticMessage.messageId
              ? { ...m, messageId: data.data!.messageId }
              : m
          )
        );
      }
    } catch (err) {
      showAlert((err as Error).message, "Error");
      setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== optimisticMessage.messageId));
      setMessageInput(text);
    } finally {
      setSendingMessage(false);
    }
  }, [messageInput, activeChatId, username, sendingMessage, currentUserDisplayName, showAlert]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    if (!activeChatId) return;
    try {
      const res = await fetch(buildApiUrl(`/chats/${activeChatId}/messages/${messageId}`), {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        showAlert(data.error || "Failed to delete message", "Error");
        return;
      }
      setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== messageId));
    } catch (err) {
      showAlert((err as Error).message, "Error");
    }
  }, [activeChatId, showAlert]);

  const handleMessageDoubleTap = useCallback((messageId: number) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.messageId === messageId && now - lastTapRef.current.time < 400) {
      // Double tap detected
      setConfirmDialog({
        show: true,
        message: "Delete this message?",
        onConfirm: () => {
          handleDeleteMessage(messageId);
          setConfirmDialog(null);
        },
      });
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { messageId, time: now };
    }
  }, [handleDeleteMessage]);

  return {
    activeChatId,
    setActiveChatId,
    activeChatName,
    setActiveChatName,
    activeChatIsGroup,
    setActiveChatIsGroup,
    activeChatMessages,
    setActiveChatMessages,
    messageInput,
    setMessageInput,
    chatLoading,
    chatError,
    sendingMessage,
    messagesEndRef,
    handleOpenChat,
    handleSendMessage,
    handleDeleteMessage,
    handleMessageDoubleTap,
    fetchMessages,
    confirmDialog,
    setConfirmDialog,
  };
}