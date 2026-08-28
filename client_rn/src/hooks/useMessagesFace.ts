import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { getApi, postApi, fetchApiCustom } from '../services/api.service';
import type { ChatMessage, ConfirmDialog, ApiMessagesResponse } from '../lib/formTypes';

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
  handleOpenChat: (id: number, name: string, isGroup: boolean) => void;
  handleSendMessage: () => Promise<void>;
  handleDeleteMessage: (messageId: number) => void;
  handleMessageDoubleTap: (messageId: number) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  confirmDialog: ConfirmDialog | null;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialog | null>>;
}

export function useMessagesFace({
  username, currentUserDisplayName, activeFace, showAlert,
}: UseMessagesFaceOptions): UseMessagesFaceReturn {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [activeChatIsGroup, setActiveChatIsGroup] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const activeChatIdRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ messageId: number; time: number } | null>(null);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!username) return;
    setChatLoading(true); setChatError(null);
    try {
      const data = await getApi<ApiMessagesResponse>(`/chats/${conversationId}/messages`);
      setActiveChatMessages(data.data || []);
    } catch (err) { setChatError((err as Error).message); }
    finally { setChatLoading(false); }
  }, [username]);

  useEffect(() => {
    if (activeFace === 'right' && activeChatId !== null) fetchMessages(activeChatId);
  }, [activeFace, activeChatId, fetchMessages]);

  const handleOpenChat = useCallback((id: number, name: string, isGroup: boolean) => {
    setActiveChatId(id); setActiveChatName(name); setActiveChatIsGroup(isGroup);
    setActiveChatMessages([]); setChatError(null); setMessageInput('');
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeChatId || !username || sendingMessage) return;
    const text = messageInput.trim();
    setMessageInput(''); setSendingMessage(true);
    const optMsg: ChatMessage = {
      messageId: Date.now(), text, senderUserId: 0,
      senderDisplayName: currentUserDisplayName, sentAt: new Date().toISOString(), isOwn: true,
    };
    setActiveChatMessages((prev) => [...prev, optMsg]);
    try {
      interface SendResp { success: boolean; data?: { messageId: number }; error?: string; }
      const { ok, data } = await postApi<SendResp>(`/chats/${activeChatId}/messages`, { text });
      if (!ok || !data.success) {
        showAlert(data.error || 'Failed to send', 'Error');
        setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== optMsg.messageId));
        setMessageInput(text); return;
      }
      if (data.data?.messageId) {
        setActiveChatMessages((prev) =>
          prev.map((m) => m.messageId === optMsg.messageId ? { ...m, messageId: data.data!.messageId } : m)
        );
      }
    } catch (err) {
      showAlert((err as Error).message, 'Error');
      setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== optMsg.messageId));
      setMessageInput(text);
    } finally { setSendingMessage(false); }
  }, [messageInput, activeChatId, username, sendingMessage, currentUserDisplayName, showAlert]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    if (!activeChatId) return;
    try {
      interface DelResp { success: boolean; error?: string; }
      await fetchApiCustom<DelResp>(`/chats/${activeChatId}/messages/${messageId}`, { method: 'DELETE' });
      setActiveChatMessages((prev) => prev.filter((m) => m.messageId !== messageId));
    } catch (err) { showAlert((err as Error).message, 'Error'); }
  }, [activeChatId, showAlert]);

  const handleMessageDoubleTap = useCallback((messageId: number) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.messageId === messageId && now - lastTapRef.current.time < 400) {
      setConfirmDialog({ show: true, message: 'Delete this message?', onConfirm: () => { handleDeleteMessage(messageId); setConfirmDialog(null); } });
      lastTapRef.current = null;
    } else { lastTapRef.current = { messageId, time: now }; }
  }, [handleDeleteMessage]);

  return {
    activeChatId, setActiveChatId, activeChatName, setActiveChatName,
    activeChatIsGroup, setActiveChatIsGroup, activeChatMessages, setActiveChatMessages,
    messageInput, setMessageInput, chatLoading, chatError, sendingMessage,
    handleOpenChat, handleSendMessage, handleDeleteMessage, handleMessageDoubleTap,
    fetchMessages, confirmDialog, setConfirmDialog,
  };
}
