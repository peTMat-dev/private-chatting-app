import { useCallback, useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";
import { useSocket } from "../lib/useSocket";
import { useChatsFace } from "./useChatsFace";
import { useContactsFace } from "./useContactsFace";
import { useMessagesFace } from "./useMessagesFace";
import { useSettingsFace } from "./useSettingsFace";
import { useInfoFace } from "./useInfoFace";
import { useLogoutFace } from "./useLogoutFace";
import type { AlertDialog, ApiSettingsResponse, ContactApprovedPayload, NewMessagePayload } from "../lib/formTypes";

export interface UseHomeCubeReturn {
  // Cube navigation
  cubeNav: ReturnType<typeof useCubeNavigation>;
  
  // Auth state
  username: string;
  authChecked: boolean;
  
  // Face hooks
  chats: ReturnType<typeof useChatsFace>;
  contacts: ReturnType<typeof useContactsFace>;
  messages: ReturnType<typeof useMessagesFace>;
  settings: ReturnType<typeof useSettingsFace>;
  info: ReturnType<typeof useInfoFace>;
  logout: ReturnType<typeof useLogoutFace>;
  
  // Alert dialog
  alertDialog: AlertDialog | null;
  setAlertDialog: (dialog: AlertDialog | null) => void;
  showAlert: (message: string, title?: string) => void;
  
  // Current user display name
  currentUserDisplayName: string;
}

export function useHomeCube(): UseHomeCubeReturn {
  // Cube navigation (web-only)
  const cubeNav = useCubeNavigation("front");
  
  // Auth state
  const [username, setUsername] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("");
  
  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState<AlertDialog | null>(null);
  
  const showAlert = useCallback((message: string, title?: string) => {
    setAlertDialog({ show: true, message, title });
  }, []);
  
  // Auth check effect (web-only)
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
  
  // Socket connection (web-only)
  const { socket } = useSocket(username);
  
  // Fetch own display name once username is available
  useEffect(() => {
    if (!username) return;
    fetch(buildApiUrl("/settings"), { credentials: "include", headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d: ApiSettingsResponse) => { 
        if (d.success && d.data?.display_name) {
          setCurrentUserDisplayName(d.data.display_name);
        }
      })
      .catch(() => {});
  }, [username]);
  
  // Initialize face hooks
  const messages = useMessagesFace({
    username,
    currentUserDisplayName,
    activeFace: cubeNav.activeFace,
    showAlert,
  });
  
  const chats = useChatsFace({
    username,
    userContacts: [], // Will be populated from contacts hook
    onOpenChat: (id, name, isGroup) => {
      messages.handleOpenChat(id, name, isGroup);
      cubeNav.setFace("right");
    },
    showAlert,
  });
  
  const contacts = useContactsFace({
    username,
    showAlert,
    onOpenChat: (id, name, isGroup) => {
      messages.handleOpenChat(id, name, isGroup);
      cubeNav.setFace("right");
    },
    fetchChats: chats.fetchChats,
  });
  
  // Update chats hook with user contacts
  useEffect(() => {
    // This is handled by passing contacts.userContacts directly in the component
  }, [contacts.userContacts]);
  
  const settings = useSettingsFace({
    username,
    activeFace: cubeNav.activeFace,
    showAlert,
  });
  
  const info = useInfoFace(cubeNav.activeFace);
  
  // Logout handler (web-only behavior injected)
  const logout = useLogoutFace({
    goUp: cubeNav.goUp,
    goLeft: cubeNav.goLeft,
    onLoggedOut: async () => {
      // Clear session on server and redirect (web-only)
      try {
        await fetch(buildApiUrl("/auth/logout"), { method: "POST", credentials: "include" });
      } catch {
        // Ignore errors — redirect regardless
      }
      window.location.href = "/";
    },
  });
  
  // Socket event handlers (web-only)
  useEffect(() => {
    if (!socket) return;
    
    // contact_approved → update contacts, requests, public users
    const handleContactApproved = (payload: ContactApprovedPayload) => {
      contacts.fetchUserContacts();
      contacts.setOutgoingRequests((prev) => prev.filter((r) => r.userId !== payload.userId));
      contacts.setPublicUsers((prev) =>
        prev.map((u) => u.id === payload.userId 
          ? { ...u, isAlreadyContact: true, hasPendingRequest: false } 
          : u)
      );
    };
    
    // new_message → update messages, chats list
    const handleNewMessage = (payload: NewMessagePayload) => {
      // Append to the open chat (dedup against optimistic messages)
      if (messages.activeChatId === payload.conversationId) {
        messages.setActiveChatMessages((prev) => {
          if (prev.some((m) => m.messageId === payload.messageId)) return prev;
          return [...prev, { ...payload, isOwn: false }];
        });
      }
      // Update chats list
      chats.setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) {
          chats.fetchChats();
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], lastMessage: payload.text };
        return next;
      });
    };
    
    socket.on("contact_approved", handleContactApproved);
    socket.on("new_message", handleNewMessage);
    
    return () => {
      socket.off("contact_approved", handleContactApproved);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, contacts, messages, chats]);
  
  // Fetch chats on initial load
  useEffect(() => {
    if (username) {
      chats.fetchChats();
    }
  }, [username, chats.fetchChats]);
  
  return {
    cubeNav,
    username,
    authChecked,
    chats,
    contacts,
    messages,
    settings,
    info,
    logout,
    alertDialog,
    setAlertDialog,
    showAlert,
    currentUserDisplayName,
  };
}