/**
 * WebSocket client service for real-time telemetry updates
 */
import { io, Socket } from "socket.io-client";
import {
  WS_BASE_URL,
  WS_NAMESPACE,
} from "../config";
import type { TelemetryUpdate } from "../types";

class WebSocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket) return;

    const socketUrl = `${WS_BASE_URL}${WS_NAMESPACE}`;
    this.socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    this.socket.on("connect", () =>
      console.log(
        "[WebSocket] Connected:",
        this.socket?.id
      )
    );

    this.socket.on("disconnect", (reason) =>
      console.log(
        "[WebSocket] Disconnected:",
        reason
      )
    );

    this.socket.on("connect_error", (err) =>
      console.error("[WebSocket] Error:", err)
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToTelemetry(
    callback: (update: TelemetryUpdate) => void
  ): () => void {
    if (!this.socket) this.connect();
    this.socket!.on("telemetry:update", callback);
    return () =>
      this.socket!.off(
        "telemetry:update",
        callback
      );
  }
}

export const socketService =
  new WebSocketService();
