/**
 * WebSocket client service for real-time telemetry updates
 */
import { io, Socket } from "socket.io-client";
import {
  WS_BASE_URL,
  WS_NAMESPACE,
} from "../config";
import type {
  TelemetryUpdate,
  SocketConnectionState,
} from "../types";

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: SocketConnectionState =
    "disconnected";
  private stateSubscribers = new Set<
    (state: SocketConnectionState) => void
  >();

  connect(): void {
    if (this.socket) return;

    const socketUrl = `${WS_BASE_URL}${WS_NAMESPACE}`;
    this.setConnectionState("connecting");
    this.socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      withCredentials: true,
    });

    this.socket.on("connect", () => {
      this.setConnectionState("connected");
      console.log(
        "[WebSocket] Connected:",
        this.socket?.id
      );
    });

    this.socket.on("disconnect", (reason) => {
      this.setConnectionState("disconnected");
      console.log(
        "[WebSocket] Disconnected:",
        reason
      );
    });

    this.socket.on("connect_error", (err) => {
      this.setConnectionState("error");
      console.error("[WebSocket] Error:", err);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setConnectionState("disconnected");
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

  getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(
    subscriber: (
      state: SocketConnectionState
    ) => void
  ): () => void {
    this.stateSubscribers.add(subscriber);
    return () => {
      this.stateSubscribers.delete(subscriber);
    };
  }

  private setConnectionState(
    state: SocketConnectionState
  ): void {
    this.connectionState = state;
    this.stateSubscribers.forEach((cb) =>
      cb(state)
    );
  }
}

export const socketService =
  new WebSocketService();
