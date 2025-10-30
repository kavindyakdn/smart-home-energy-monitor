import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  /**
   * Retrieve telemetry with optional filters
   * Query params: deviceId, deviceType, room, startTime, endTime
   */
  @Get()
  @SkipThrottle()
  async getTelemetry(
    @Query('deviceId') deviceId?: string,
    @Query('deviceType') deviceType?: string,
    @Query('room') room?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    this.logger.log(
      `Fetching telemetry with filters: deviceId=${deviceId || ''}, deviceType=${
        deviceType || ''
      }, room=${room || ''}, startTime=${startTime || ''}, endTime=${
        endTime || ''
      }`,
    );

    return this.telemetryService.findTelemetry({
      deviceId,
      deviceType,
      room,
      startTime: start,
      endTime: end,
    });
  }

  /**
   * Ingest single telemetry record
   */
  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 50, ttl: 1000 } }) // 50 requests per second
  async ingestSingle(@Body() createTelemetryDto: CreateTelemetryDto) {
    this.logger.log(
      `Received single telemetry ingestion request for device: ${createTelemetryDto.deviceId}`,
    );
    const saved = await this.telemetryService.ingestSingle(createTelemetryDto);
    // Broadcast to connected websocket clients
    this.telemetryGateway.emitNewTelemetry(saved);
    return saved;
  }

  /**
   * Ingest batch telemetry records
   */
  @Post('ingest/batch')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ medium: { limit: 20, ttl: 10000 } }) // 20 requests per 10 seconds
  async ingestBatch(@Body() batchTelemetryDto: BatchTelemetryDto) {
    this.logger.log(
      `Received batch telemetry ingestion request with ${batchTelemetryDto.data.length} records`,
    );
    const savedList =
      await this.telemetryService.ingestBatch(batchTelemetryDto);
    // Emit each saved reading to clients
    for (const item of savedList) {
      this.telemetryGateway.emitNewTelemetry(item);
    }
    return savedList;
  }

  /**
   * Get device statistics
   */
  @Get('devices/:deviceId/stats')
  @SkipThrottle()
  async getDeviceStats(
    @Param('deviceId') deviceId: string,
    @Query('hours') hours?: string,
  ) {
    const hoursNumber = hours ? parseInt(hours, 10) : 24;
    this.logger.log(
      `Retrieving device stats for ${deviceId} over ${hoursNumber} hours`,
    );
    return this.telemetryService.getDeviceStats(deviceId, hoursNumber);
  }

  /**
   * Delete old telemetry data (admin endpoint)
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ long: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async deleteOldTelemetry(@Query('daysToKeep') daysToKeep?: string) {
    const daysToKeepNumber = daysToKeep ? parseInt(daysToKeep, 10) : 30;
    this.logger.log(
      `Cleaning up telemetry data older than ${daysToKeepNumber} days`,
    );
    const deletedCount =
      await this.telemetryService.deleteOldTelemetry(daysToKeepNumber);
    return {
      message: `Successfully deleted ${deletedCount} old telemetry records`,
      deletedCount,
      daysToKeep: daysToKeepNumber,
    };
  }

  /**
   * Legacy endpoint for backward compatibility
   */
  @Post('ingest/legacy')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ medium: { limit: 25, ttl: 10000 } }) // 25 requests per 10 seconds
  async ingestLegacy(@Body() body: CreateTelemetryDto | BatchTelemetryDto) {
    this.logger.log('Received legacy telemetry ingestion request');

    // Check if it's a batch request
    if ((body as BatchTelemetryDto).data) {
      return this.telemetryService.ingestBatch(body as BatchTelemetryDto);
    }

    // Single record request
    return this.telemetryService.ingestSingle(body as CreateTelemetryDto);
  }

  /**
   * Emit a test telemetry event to WebSocket clients
   */
  @Post('test-broadcast')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async testBroadcast() {
    const payload = {
      _id: 'test-' + Date.now(),
      deviceId: 'demo-device',
      category: 'test',
      value: Math.round(Math.random() * 1000) / 10,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    this.logger.log('Test broadcasting telemetry payload');
    this.telemetryGateway.emitNewTelemetry(payload);
    return { message: 'Test telemetry broadcast emitted', payload };
  }
}
