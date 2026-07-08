import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import type { TaskWithOwner } from '../services/task.service';

export type TaskSocketEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  const allowedOrigins = [
    'http://localhost:3000',
    env.frontendUrl,
  ].filter(Boolean) as string[];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as {
      userId: string;
      role: Role;
    };

    socket.join(`user:${user.userId}`);

    if (user.role === Role.ADMIN) {
      socket.join('admin');
    }
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

export function emitTaskEvent(
  event: TaskSocketEvent,
  task: TaskWithOwner,
): void {
  if (!io) {
    return;
  }

  io.to(`user:${task.ownerId}`).emit(event, { task });
  io.to('admin').emit(event, { task });
}
