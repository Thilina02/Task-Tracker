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
      console.log("[socket] hook disabled, skipping connection");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEY)
        : null;

    if (!token) {
      console.warn("[socket] no token found in localStorage, skipping connection");
      return;
    }

    console.log("[socket] connecting to", SOCKET_URL);

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id, "transport:", socket.io.engine.transport.name);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });

    const events: TaskSocketEvent[] = [
      "task:created",
      "task:updated",
      "task:deleted",
    ];

    events.forEach((event) => {
      socket.on(event, (payload: TaskSocketPayload) => {
        console.log(`[socket] received '${event}'`, payload);
        onEventRef.current(event, payload);
      });
    });

    return () => {
      console.log("[socket] cleaning up connection");
      events.forEach((event) => socket.off(event));
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [enabled]);
}