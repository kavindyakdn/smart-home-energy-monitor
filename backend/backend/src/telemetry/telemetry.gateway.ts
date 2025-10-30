import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:8080,http://127.0.0.1:8080')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsCredentials = String(process.env.CORS_CREDENTIALS ?? 'true').toLowerCase() !== 'false';

@WebSocketGateway({
  cors: {
    origin: corsOrigins,
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
