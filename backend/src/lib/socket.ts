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

  console.log('[socket] allowed origins:', allowedOrigins);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      console.warn(`[socket] rejected ${socket.id}: no token provided`);
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
    } catch (err) {
      console.warn(
        `[socket] rejected ${socket.id}: invalid/expired token`,
        err instanceof Error ? err.message : err,
      );
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as {
      userId: string;
      email: string;
      role: Role;
    };

    console.log(
      `[socket] connected: ${socket.id} (user: ${user.userId}, role: ${user.role})`,
    );

    socket.join(`user:${user.userId}`);

    if (user.role === Role.ADMIN) {
      socket.join('admin');
    }

    // Log every room this socket ends up in, useful for debugging emits
    console.log(`[socket] ${socket.id} rooms:`, Array.from(socket.rooms));

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[socket] error on ${socket.id}:`, err);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error('[socket] engine connection_error:', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
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
    console.warn(`[socket] emitTaskEvent('${event}') skipped: io not initialized`);
    return;
  }

  console.log(
    `[socket] emitting '${event}' to user:${task.ownerId} and admin room`,
  );

  io.to(`user:${task.ownerId}`).emit(event, { task });
  io.to('admin').emit(event, { task });
}