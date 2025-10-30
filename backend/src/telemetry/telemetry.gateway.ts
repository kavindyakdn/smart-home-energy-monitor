import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  namespace: '/telemetry',
})
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TelemetryGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(socket: any): void {
    this.logger.log(`Client connected: ${socket.id}`);
  }

  handleDisconnect(socket: any): void {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  emitNewTelemetry(payload: unknown): void {
    try {
      const preview =
        typeof payload === 'object' && payload !== null
          ? JSON.stringify(payload).slice(0, 200)
          : String(payload);
      this.logger.log(`Emitting telemetry:new -> ${preview}`);
    } catch {
      this.logger.log('Emitting telemetry:new');
    }
    this.server.emit('telemetry:new', payload);
  }
}
