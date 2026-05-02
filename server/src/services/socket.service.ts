import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

import { env } from "../config/env";
import { query } from "./db";

let io: Server;

export function initSocketService(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: {
      origin: env.app.clientOrigins,
      credentials: true,
    },
  });

  // Auth middleware — resolve username → user_id
  io.use(async (socket, next) => {
    const username = socket.handshake.auth?.username as string | undefined;
    if (!username) {
      return next(new Error("unauthorized"));
    }

    try {
      type Row = { user_id: number; display_name: string };
      const rows = await query<Row>(
        "SELECT user_id, display_name FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
        [username]
      );
      if (rows.length === 0) {
        return next(new Error("unauthorized"));
      }
      socket.data.userId = rows[0].user_id;
      socket.data.username = username;
      socket.data.displayName = rows[0].display_name;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId: number = socket.data.userId;
    socket.join(`user:${userId}`);
    console.log(`[socket] connected uid=${userId} socketId=${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected uid=${userId} socketId=${socket.id}`);
    });
  });
}

export function emitToUser(userId: number, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export { io };
