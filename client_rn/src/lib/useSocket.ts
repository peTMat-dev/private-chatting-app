import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getToken } from './api';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_BASE_URL || '';

export function useSocket(username: string | null | undefined): { socket: Socket | null; connected: boolean } {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!username) return;
    let mounted = true;

    const connect = async () => {
      const token = await getToken();
      if (!mounted) return;

      const socket = io(WS_URL, {
        auth: { username, ...(token ? { token } : {}) },
        autoConnect: true,
      });

      socketRef.current = socket;

      socket.on('connect', () => { if (mounted) setConnected(true); });
      socket.on('disconnect', () => { if (mounted) setConnected(false); });
      socket.on('connect_error', (err) => {
        if (err.message === 'unauthorized') socket.disconnect();
      });
    };

    connect();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [username]);

  return { socket: socketRef.current, connected };
}
