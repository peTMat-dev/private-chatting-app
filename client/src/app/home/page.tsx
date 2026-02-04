"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Contact from "../components/Contact";

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
};

type ApiChatsResponse = {
  success: boolean;
  count?: number;
  data?: Array<{ id: number; name: string; lastMessage: string }>;
  error?: string;
};

// Cube faces: front=Chats, left=Contacts, right=Chat view (placeholder), back=Workspace
type CubeFace = "front" | "left" | "right" | "back";

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const resolveApiBaseUrl = (): string => {
  if (ENV_API_BASE) return ENV_API_BASE.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  return "";
};
const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

export default function HomeCube() {
  const [activeFace, setActiveFace] = useState<CubeFace>("front");
  const [yTicks, setYTicks] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const username = useMemo(() => {
    try {
      return localStorage.getItem("cubcha_username") || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let aborted = false;
    const fetchChats = async () => {
      if (!username) {
        return;
      }
      try {
        const url = buildApiUrl(`/chats?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as ApiChatsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setError(data.error || "Unable to load chats");
          return;
        }
        const list: ContactSummary[] = (data.data || []).map((d) => ({
          id: d.id,
          name: d.name,
          lastMessage: d.lastMessage || "",
        }));
        if (!aborted) setContacts(list);
      } catch (err) {
        if (!aborted) setError((err as Error).message);
      }
    };
    fetchChats();
    return () => {
      aborted = true;
    };
  }, [username]);

  const facesByTicks: CubeFace[] = ["front", "left", "back", "right"];
  const rotation = useMemo(() => {
    const baseX = -5;
    const baseY = -15;
    const x = baseX;
    const y = baseY + yTicks * 90;
    return { x, y };
  }, [yTicks]);

  const goLeft = () => {
    setYTicks((t) => {
      const next = t + 1;
      setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
      return next;
    });
  };
  const goRight = () => {
    setYTicks((t) => {
      const next = t - 1;
      setActiveFace(facesByTicks[((next % 4) + 4) % 4]);
      return next;
    });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 40;
    if (absDx < threshold && absDy < threshold) return;
    if (absDx > absDy) {
      if (dx < 0) goLeft(); else goRight();
    }
    touchStartRef.current = null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goLeft();
        break;
      case "ArrowRight":
        event.preventDefault();
        goRight();
        break;
      default:
        break;
    }
  };

  const openChat = (_id: number | string) => {
    // Rotation-only for now: move to the right face
    setActiveFace("right");
    setYTicks((t) => t - 1);
  };

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
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          {/* Front: Chats list */}
          <section className="cube-face cube-face-front">
            <section className="auth-stack">
              <article className="auth-card cube-face-panel">
                <div className="cube-face-content">
                  <div className="cube-face-header">
                    <h2>List of chats</h2>
                    <button className="ghost-btn" type="button" onClick={goLeft}>Contacts</button>
                  </div>
                  {error ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>Could not load chats</h2>
                      <p>{error}</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true" />
                      <h2>No active chats yet</h2>
                      <p>When users message you, they’ll appear here.</p>
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush chats-list">
                      {contacts.map((c) => (
                        <Contact key={c.id} contact_name={c.name} onClick={() => openChat(c.id)}>
                          {c.lastMessage}
                        </Contact>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </section>
          </section>

          {/* Left: Contacts placeholder */}
          <section className="cube-face cube-face-left">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Contacts</h2>
                  <button className="ghost-btn" type="button" onClick={goRight}>Back to Chats</button>
                </div>
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true" />
                  <h2>Contacts coming soon</h2>
                  <p>This page will list your saved contacts.</p>
                </div>
              </div>
            </article>
          </section>

          {/* Back: Workspace placeholder */}
          <section className="cube-face cube-face-back">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Workspace</h2>
                  <button className="ghost-btn" type="button" onClick={goRight}>Back to Chats</button>
                </div>
                <p className="hero-copy">Reserved for future features.</p>
              </div>
            </article>
          </section>

          {/* Right: Chat view placeholder */}
          <section className="cube-face cube-face-right">
            <article className="auth-card cube-face-panel">
              <div className="cube-face-content">
                <div className="cube-face-header">
                  <h2>Chat</h2>
                  <button className="ghost-btn" type="button" onClick={goLeft}>Contacts</button>
                </div>
                <p className="hero-copy">Open a conversation from the Chats face.</p>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
