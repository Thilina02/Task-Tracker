"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { TOKEN_KEY } from "@/lib/api/client";
import type { TaskSocketEvent, TaskSocketPayload } from "@/types/task.types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface UseTaskSocketOptions {
  enabled: boolean;
  onEvent: (event: TaskSocketEvent, payload: TaskSocketPayload) => void;
}

export function useTaskSocket({ enabled, onEvent }: UseTaskSocketOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEY)
        : null;

    if (!token) {
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const events: TaskSocketEvent[] = [
      "task:created",
      "task:updated",
      "task:deleted",
    ];

    events.forEach((event) => {
      socket.on(event, (payload: TaskSocketPayload) => {
        onEventRef.current(event, payload);
      });
    });

    return () => {
      events.forEach((event) => socket.off(event));
      socket.disconnect();
    };
  }, [enabled]);
}
