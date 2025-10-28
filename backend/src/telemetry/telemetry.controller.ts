import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

@Controller('api/v1/devices')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // POST /api/v1/devices/ingest
  @Post('ingest')
  async ingest(@Body() body: CreateTelemetryDto | BatchTelemetryDto) {
    if ((body as BatchTelemetryDto).data) {
      return this.telemetryService.ingestBatch(body as BatchTelemetryDto);
    }
    return this.telemetryService.ingestSingle(body as CreateTelemetryDto);
  }

  // GET /api/v1/devices/readings?deviceId=&startTime=&endTime=
  @Get('readings')
  async getReadings(
    @Query('deviceId') deviceId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.telemetryService.getReadings(deviceId, startTime, endTime);
  }
}
