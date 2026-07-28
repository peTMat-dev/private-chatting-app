import { useCallback, useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";
import { getApi } from "../services/api.service";
import { useCubeNavigation, type CubeFace } from "../lib/useCubeNavigation";
import { useSocket } from "../lib/useSocket";
import { useChatsFace } from "./useChatsFace";
import { useContactsFace } from "./useContactsFace";
import { useMessagesFace } from "./useMessagesFace";
import { useSettingsFace, DEFAULT_CUBE_COLOR, DEFAULT_CUBE_COLOR2 } from "./useSettingsFace";
import { useInfoFace } from "./useInfoFace";
import { useLogoutFace } from "./useLogoutFace";
import type { AlertDialog, ApiSettingsResponse, ContactApprovedPayload, NewMessagePayload } from "../lib/formTypes";

// Helper to convert hex color to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper to apply cube color to document
const applyCubeColor = (color: string) => {
  document.documentElement.style.setProperty('--color-green', color);
};

// Helper to apply cube color 2 to document
const applyCubeColor2 = (color: string) => {
  document.documentElement.style.setProperty('--color-cube2', color);
  
  // Convert hex to RGB for derived variables
  const rgb = hexToRgb(color);
  if (rgb) {
    const borderColor = `rgba(${Math.round(rgb.r * 0.2)}, ${Math.round(rgb.g * 0.63)}, ${Math.round(rgb.b * 0.63)}, 0.4)`;
    const labelColor = `rgb(${Math.round(rgb.r * 0.4 + 100)}, ${Math.round(rgb.g * 0.78 + 50)}, ${Math.round(rgb.b * 0.63 + 60)})`;
    
    document.documentElement.style.setProperty('--color-cube2-border', borderColor);
    document.documentElement.style.setProperty('--color-cube2-label', labelColor);
  }
};

// Helper to get stored cube color
const getStoredCubeColor = (): string => {
  const stored = localStorage.getItem('cubcha_cube_color');
  return stored && /^#[0-9A-Fa-f]{6}$/.test(stored) ? stored : DEFAULT_CUBE_COLOR;
};

// Helper to get stored cube color 2
const getStoredCubeColor2 = (): string => {
  const stored = localStorage.getItem('cubcha_cube_color2');
  return stored && /^#[0-9A-Fa-f]{6}$/.test(stored) ? stored : DEFAULT_CUBE_COLOR2;
};

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
  
  // Apply stored cube colors on mount
  useEffect(() => {
    applyCubeColor(getStoredCubeColor());
    applyCubeColor2(getStoredCubeColor2());
  }, []);
  
  // Socket connection (web-only)
  const { socket } = useSocket(username);
  
  // Fetch own display name once username is available
  useEffect(() => {
    if (!username) return;
    getApi<ApiSettingsResponse>("/settings")
      .then((d) => { 
        if (d.data?.display_name) {
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