"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

export function useSocket(username: string | null | undefined): { socket: Socket | null; connected: boolean } {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!username) return;

    const socket = io(WS_URL, {
      auth: { username },
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      if (err.message === "unauthorized") {
        socket.disconnect();
      }
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [username]);

  return { socket: socketRef.current, connected };
}
