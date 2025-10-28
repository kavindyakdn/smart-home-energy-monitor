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
import { Throttle } from '@nestjs/throttler';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Ingest single telemetry record
   * POST /telemetry/ingest
   * Higher limits for single telemetry ingestion
   */
  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 50, ttl: 1000 } }) // 50 requests per second
  async ingestSingle(@Body() createTelemetryDto: CreateTelemetryDto) {
    this.logger.log(
      `Received single telemetry ingestion request for device: ${createTelemetryDto.deviceId}`,
    );
    return this.telemetryService.ingestSingle(createTelemetryDto);
  }

  /**
   * Ingest batch telemetry records
   * POST /telemetry/ingest/batch
   * Lower limits for batch ingestion to prevent abuse
   */
  @Post('ingest/batch')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ medium: { limit: 20, ttl: 10000 } }) // 20 requests per 10 seconds
  async ingestBatch(@Body() batchTelemetryDto: BatchTelemetryDto) {
    this.logger.log(
      `Received batch telemetry ingestion request with ${batchTelemetryDto.data.length} records`,
    );
    return this.telemetryService.ingestBatch(batchTelemetryDto);
  }

  /**
   * Get device statistics
   * GET /telemetry/devices/:deviceId/stats?hours=
   * Moderate limits for stats queries
   */
  @Get('devices/:deviceId/stats')
  @Throttle({ medium: { limit: 30, ttl: 10000 } }) // 30 requests per 10 seconds
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
   * Get telemetry readings for a specific device
   * GET /telemetry/devices/:deviceId/readings?startTime=&endTime=&limit=
   * Moderate limits for reading queries
   */
  @Get('devices/:deviceId/readings')
  @Throttle({ medium: { limit: 40, ttl: 10000 } }) // 40 requests per 10 seconds
  async getDeviceReadings(
    @Param('deviceId') deviceId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    this.logger.log(`Retrieving telemetry readings for device: ${deviceId}`);
    return this.telemetryService.getReadings(
      deviceId,
      startTime,
      endTime,
      limitNumber,
    );
  }

  /**
   * Delete old telemetry data (admin endpoint)
   * POST /telemetry/cleanup?daysToKeep=
   * Very restrictive limits for admin operations
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
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
   * POST /telemetry/ingest/legacy
   * Moderate limits for legacy endpoint
   */
  @Post('ingest/legacy')
  @HttpCode(HttpStatus.CREATED)
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
}
