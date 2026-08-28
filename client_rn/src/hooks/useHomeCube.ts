import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getApi } from '../services/api.service';
import { useCubeNavigation, type CubeFace } from '../lib/useCubeNavigation';
import { useSocket } from '../lib/useSocket';
import { useChatsFace } from './useChatsFace';
import { useContactsFace } from './useContactsFace';
import { useMessagesFace } from './useMessagesFace';
import { useSettingsFace } from './useSettingsFace';
import { useInfoFace } from './useInfoFace';
import { useLogoutFace } from './useLogoutFace';
import { logout } from '../services/auth.service';
import { clearToken } from '../lib/api';
import type { AlertDialog, ApiSettingsResponse, ContactApprovedPayload, NewMessagePayload } from '../lib/formTypes';

export interface UseHomeCubeReturn {
  cubeNav: ReturnType<typeof useCubeNavigation>;
  username: string;
  authChecked: boolean;
  chats: ReturnType<typeof useChatsFace>;
  contacts: ReturnType<typeof useContactsFace>;
  messages: ReturnType<typeof useMessagesFace>;
  settings: ReturnType<typeof useSettingsFace>;
  info: ReturnType<typeof useInfoFace>;
  logout: ReturnType<typeof useLogoutFace>;
  alertDialog: AlertDialog | null;
  setAlertDialog: (dialog: AlertDialog | null) => void;
  showAlert: (message: string, title?: string) => void;
  currentUserDisplayName: string;
}

export function useHomeCube(): UseHomeCubeReturn {
  const cubeNav = useCubeNavigation('front');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('');
  const [alertDialog, setAlertDialog] = useState<AlertDialog | null>(null);

  const showAlert = useCallback((message: string, title?: string) => {
    setAlertDialog({ show: true, message, title });
  }, []);

  useEffect(() => {
    getApi<{ success: boolean; username?: string }>('/auth/me')
      .then((d) => {
        if (d?.username) { setUsername(d.username); setAuthChecked(true); }
        else { router.replace('/'); }
      })
      .catch(() => { router.replace('/'); });
  }, [router]);

  const { socket } = useSocket(username);

  useEffect(() => {
    if (!username) return;
    getApi<ApiSettingsResponse>('/settings')
      .then((d) => { if (d.data?.display_name) setCurrentUserDisplayName(d.data.display_name); })
      .catch(() => {});
  }, [username]);

  const messages = useMessagesFace({
    username, currentUserDisplayName, activeFace: cubeNav.activeFace, showAlert,
  });

  const chats = useChatsFace({
    username, userContacts: [],
    onOpenChat: (id, name, isGroup) => { messages.handleOpenChat(id, name, isGroup); cubeNav.setFace('right'); },
    showAlert,
  });

  const contacts = useContactsFace({
    username, showAlert,
    onOpenChat: (id, name, isGroup) => { messages.handleOpenChat(id, name, isGroup); cubeNav.setFace('right'); },
    fetchChats: chats.fetchChats,
  });

  const settings = useSettingsFace({ username, activeFace: cubeNav.activeFace, showAlert });
  const info = useInfoFace(cubeNav.activeFace);

  const logoutHook = useLogoutFace({
    goUp: cubeNav.goUp, goLeft: cubeNav.goLeft,
    onLoggedOut: async () => {
      await clearToken();
      try { await logout(); } catch {}
      router.replace('/');
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handleContactApproved = (payload: ContactApprovedPayload) => {
      contacts.fetchUserContacts();
      contacts.setOutgoingRequests((prev) => prev.filter((r) => r.userId !== payload.userId));
      contacts.setPublicUsers((prev) =>
        prev.map((u) => u.id === payload.userId ? { ...u, isAlreadyContact: true, hasPendingRequest: false } : u)
      );
    };
    const handleNewMessage = (payload: NewMessagePayload) => {
      if (messages.activeChatId === payload.conversationId) {
        messages.setActiveChatMessages((prev) => {
          if (prev.some((m) => m.messageId === payload.messageId)) return prev;
          return [...prev, { ...payload, isOwn: false }];
        });
      }
      chats.setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) { chats.fetchChats(); return prev; }
        const next = [...prev];
        next[idx] = { ...next[idx], lastMessage: payload.text };
        return next;
      });
    };
    socket.on('contact_approved', handleContactApproved);
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('contact_approved', handleContactApproved);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, contacts, messages, chats]);

  useEffect(() => {
    if (username) chats.fetchChats();
  }, [username, chats.fetchChats]);

  return {
    cubeNav, username, authChecked, chats, contacts, messages, settings, info,
    logout: logoutHook, alertDialog, setAlertDialog, showAlert, currentUserDisplayName,
  };
}
