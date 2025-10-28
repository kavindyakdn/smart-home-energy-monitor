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
   */
  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  async ingestSingle(@Body() createTelemetryDto: CreateTelemetryDto) {
    this.logger.log(
      `Received single telemetry ingestion request for device: ${createTelemetryDto.deviceId}`,
    );
    return this.telemetryService.ingestSingle(createTelemetryDto);
  }

  /**
   * Ingest batch telemetry records
   * POST /telemetry/ingest/batch
   */
  @Post('ingest/batch')
  @HttpCode(HttpStatus.CREATED)
  async ingestBatch(@Body() batchTelemetryDto: BatchTelemetryDto) {
    this.logger.log(
      `Received batch telemetry ingestion request with ${batchTelemetryDto.data.length} records`,
    );
    return this.telemetryService.ingestBatch(batchTelemetryDto);
  }

  /**
   * Get telemetry readings with optional filtering
   * GET /telemetry/readings?deviceId=&startTime=&endTime=&limit=
   */
  @Get('readings')
  async getReadings(
    @Query('deviceId') deviceId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    this.logger.log(
      `Retrieving telemetry readings for device: ${deviceId || 'all'}`,
    );
    return this.telemetryService.getReadings(
      deviceId,
      startTime,
      endTime,
      limitNumber,
    );
  }

  /**
   * Get device statistics
   * GET /telemetry/devices/:deviceId/stats?hours=
   */
  @Get('devices/:deviceId/stats')
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
   */
  @Get('devices/:deviceId/readings')
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
   * DELETE /telemetry/cleanup?daysToKeep=
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
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
   */
  @Post('ingest/legacy')
  @HttpCode(HttpStatus.CREATED)
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
