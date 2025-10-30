import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry } from './schemas/telemetry.schema';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';
import { Device } from '../devices/schemas/device.schema';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<Telemetry>,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
  ) {}

  async ingestSingle(data: CreateTelemetryDto): Promise<Telemetry> {
    try {
      this.logger.log(
        `Ingesting single telemetry for device: ${data.deviceId}`,
      );

      this.validateBusinessRules(data);

      const exists = await this.deviceModel.exists({ deviceId: data.deviceId });
      if (!exists) {
        throw new NotFoundException(`Device '${data.deviceId}' not found`);
      }

      const telemetry = new this.telemetryModel(data);
      const savedTelemetry = await telemetry.save();

      this.logger.log(`Successfully ingested telemetry: ${savedTelemetry._id}`);
      return savedTelemetry;
    } catch (error) {
      this.logger.error(
        `Failed to ingest single telemetry: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new BadRequestException(error.message);
      }

      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to ingest telemetry. Please try again later.',
      );
    }
  }

  async ingestBatch(batch: BatchTelemetryDto): Promise<Telemetry[]> {
    try {
      this.logger.log(
        `Ingesting batch telemetry with ${batch.data.length} records`,
      );

      if (batch.data.length > 1000) {
        throw new BadRequestException('Batch size cannot exceed 1000 records');
      }

      batch.data.forEach((data, index) => {
        this.validateBusinessRules(data, index);
      });

      const uniqueIds = Array.from(new Set(batch.data.map((d) => d.deviceId)));
      const existing = await this.deviceModel
        .find({ deviceId: { $in: uniqueIds } })
        .select('deviceId')
        .lean();
      const existingSet = new Set(existing.map((d: any) => d.deviceId));
      const validRecords = batch.data.filter((d) => {
        const ok = existingSet.has(d.deviceId);
        if (!ok) {
          this.logger.warn(
            `Skipping telemetry for unknown device '${d.deviceId}'`,
          );
        }
        return ok;
      });

      if (validRecords.length === 0) {
        throw new BadRequestException(
          'No telemetry ingested: all records referenced unknown devices',
        );
      }

      const savedTelemetry = await this.telemetryModel.insertMany(
        validRecords,
        {
          ordered: false,
        },
      );

      this.logger.log(
        `Successfully ingested ${savedTelemetry.length} telemetry records`,
      );
      return savedTelemetry;
    } catch (error) {
      this.logger.error(
        `Failed to ingest batch telemetry: ${error.message}`,
        error.stack,
      );

      if (error.name === 'BulkWriteError') {
        const writeErrors = error.writeErrors || [];
        const errorMessages = writeErrors.map((err) => err.errmsg).join('; ');
        throw new BadRequestException(`Batch insert failed: ${errorMessages}`);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to ingest batch telemetry. Please try again later.',
      );
    }
  }

  async getDeviceStats(deviceId: string, hours: number = 24): Promise<any> {
    try {
      if (!deviceId?.trim()) {
        throw new BadRequestException('Device ID is required');
      }

      if (hours <= 0 || hours > 168) {
        throw new BadRequestException('Hours must be between 1 and 168');
      }

      this.logger.log(
        `Retrieving device stats for ${deviceId} over ${hours} hours`,
      );

      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const endTime = new Date();

      const stats = await this.telemetryModel.aggregate([
        {
          $match: {
            deviceId: deviceId.trim(),
            timestamp: { $gte: startTime, $lte: endTime },
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            lastReading: { $max: '$timestamp' },
          },
        },
      ]);

      this.logger.log(`Successfully retrieved stats for device ${deviceId}`);
      return {
        deviceId,
        period: { startTime, endTime, hours },
        categories: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve device stats: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to retrieve device stats. Please try again later.',
      );
    }
  }

  async deleteOldTelemetry(daysToKeep: number = 30): Promise<number> {
    try {
      if (daysToKeep <= 0 || daysToKeep > 365) {
        throw new BadRequestException('Days to keep must be between 1 and 365');
      }

      this.logger.log(`Deleting telemetry older than ${daysToKeep} days`);

      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
      );
      const result = await this.telemetryModel.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      this.logger.log(
        `Successfully deleted ${result.deletedCount} old telemetry records`,
      );
      return result.deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete old telemetry: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to delete old telemetry. Please try again later.',
      );
    }
  }

  /**
   * Only validate business-critical rules, not basic data types
   */
  private validateBusinessRules(
    data: CreateTelemetryDto,
    index?: number,
  ): void {
    const prefix = index !== undefined ? `Record ${index + 1}: ` : '';

    // Only validate extreme values that could cause issues
    if (data.value < -1000000 || data.value > 1000000) {
      throw new BadRequestException(
        `${prefix}Value must be between -1,000,000 and 1,000,000`,
      );
    }

    // Only validate if timestamp is extremely unreasonable (more than 1 year off)
    const timestamp = new Date(data.timestamp);
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (timestamp < oneYearAgo || timestamp > oneYearFromNow) {
      throw new BadRequestException(`${prefix}Timestamp appears to be invalid`);
    }

    // Only validate device ID format for security
    const deviceIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!deviceIdRegex.test(data.deviceId)) {
      throw new BadRequestException(
        `${prefix}Device ID contains invalid characters`,
      );
    }
  }

  async findTelemetry(filters: {
    deviceId?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<any[]> {
    try {
      const { deviceId, startTime, endTime } = filters;

      this.logger.debug(
        `findTelemetry called with filters: ${JSON.stringify({ deviceId, startTime, endTime })}`,
      );

      // Build timestamp criteria (robust to invalid or swapped dates)
      let startDate: Date | undefined =
        startTime instanceof Date && !isNaN(startTime.getTime())
          ? startTime
          : undefined;
      let endDate: Date | undefined =
        endTime instanceof Date && !isNaN(endTime.getTime())
          ? endTime
          : undefined;

      // If both exist and are inverted, swap
      if (startDate && endDate && startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
      }

      const timeCriteria: any = {};
      if (startDate) {
        timeCriteria.$gte = startDate;
      }
      if (endDate) {
        timeCriteria.$lte = endDate;
      }

      if (Object.keys(timeCriteria).length === 0 && (startTime || endTime)) {
        this.logger.debug(
          `findTelemetry received invalid dates; startTime=${startTime} endTime=${endTime}`,
        );
      }
      // Simple find by deviceId and time range
      const criteria: any = {};
      if (deviceId?.trim()) {
        criteria.deviceId = deviceId.trim();
      }
      if (Object.keys(timeCriteria).length > 0) {
        criteria.$or = [
          { timestamp: timeCriteria },
          { createdAt: timeCriteria },
        ];
      }

      this.logger.debug(
        `findTelemetry find criteria: ${JSON.stringify(criteria)}`,
      );
      const results = await this.telemetryModel
        .find(criteria)
        .sort({ timestamp: -1 })
        .lean()
        .exec();

      this.logger.debug(
        `findTelemetry find result count: ${results?.length ?? 0}`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to find telemetry: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to retrieve telemetry. Please try again later.',
      );
    }
  }
}
