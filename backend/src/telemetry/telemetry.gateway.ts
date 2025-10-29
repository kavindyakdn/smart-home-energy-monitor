import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket gateway for broadcasting telemetry updates in real-time
 * Clients can connect to the /telemetry namespace to receive live updates
 */
@WebSocketGateway({
  namespace: '/telemetry',
  cors: {
    origin: [
      'http://localhost:5173', // Vite default port
      'http://localhost:3000', // React default port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TelemetryGateway.name);

  @WebSocketServer()
  server: Server;

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast telemetry update to all connected clients
   */
  broadcastTelemetry(payload: {
    deviceId: string;
    timestamp: Date | string;
    value: number;
    category: string;
  }): void {
    try {
      this.server.emit('telemetry:update', payload);
      this.logger.debug(
        `Broadcasted telemetry update for device: ${payload.deviceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast telemetry update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast batch telemetry updates
   * Sends individual events for each telemetry record
   */
  broadcastBatchTelemetry(
    telemetryRecords: Array<{
      deviceId: string;
      timestamp: Date | string;
      value: number;
      category: string;
    }>,
  ): void {
    try {
      telemetryRecords.forEach((record) => {
        this.server.emit('telemetry:update', record);
      });
      this.logger.debug(
        `Broadcasted ${telemetryRecords.length} telemetry updates`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast batch telemetry updates: ${error.message}`,
        error.stack,
      );
    }
  }
}
