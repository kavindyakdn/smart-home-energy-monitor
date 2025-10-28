import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry } from './schemas/telemetry.schema';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<Telemetry>,
  ) {}

  async ingestSingle(data: CreateTelemetryDto): Promise<Telemetry> {
    try {
      this.logger.log(
        `Ingesting single telemetry for device: ${data.deviceId}`,
      );

      // DTO validation handles most validation, just add business logic validation
      this.validateBusinessRules(data);

      const telemetry = new this.telemetryModel(data);
      const savedTelemetry = await telemetry.save();

      this.logger.log(`Successfully ingested telemetry: ${savedTelemetry._id}`);
      return savedTelemetry;
    } catch (error) {
      this.logger.error(
        `Failed to ingest single telemetry: ${error.message}`,
        error.stack,
      );

      // Let MongoDB validation errors pass through naturally
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new BadRequestException(error.message);
      }

      // Only handle critical errors
      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      // Re-throw known exceptions
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

      // Validate batch size only
      if (batch.data.length > 1000) {
        throw new BadRequestException('Batch size cannot exceed 1000 records');
      }

      // Validate business rules for each record
      batch.data.forEach((data, index) => {
        this.validateBusinessRules(data, index);
      });

      const savedTelemetry = await this.telemetryModel.insertMany(batch.data, {
        ordered: false, // Continue inserting even if some fail
      });

      this.logger.log(
        `Successfully ingested ${savedTelemetry.length} telemetry records`,
      );
      return savedTelemetry;
    } catch (error) {
      this.logger.error(
        `Failed to ingest batch telemetry: ${error.message}`,
        error.stack,
      );

      // Handle bulk write errors
      if (error.name === 'BulkWriteError') {
        const writeErrors = error.writeErrors || [];
        const errorMessages = writeErrors.map((err) => err.errmsg).join('; ');
        throw new BadRequestException(`Batch insert failed: ${errorMessages}`);
      }

      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle connection errors
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

  async getReadings(
    deviceId: string,
    startTime?: string,
    endTime?: string,
    limit: number = 100,
  ): Promise<Telemetry[]> {
    try {
      this.logger.log(`Retrieving telemetry readings for device: ${deviceId}`);

      // Simple validation - let MongoDB handle the rest
      if (limit > 1000) {
        limit = 1000; // Cap silently instead of throwing
      }

      const filter: any = {
        deviceId: deviceId.trim(),
      };
      if (startTime || endTime) {
        filter.timestamp = {};
        if (startTime) {
          filter.timestamp.$gte = new Date(startTime);
        }
        if (endTime) {
          filter.timestamp.$lte = new Date(endTime);
        }
      }

      const readings = await this.telemetryModel
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();

      this.logger.log(
        `Successfully retrieved ${readings.length} telemetry readings`,
      );
      return readings;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve telemetry readings: ${error.message}`,
        error.stack,
      );

      // Only handle critical errors
      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError'
      ) {
        throw new InternalServerErrorException(
          'Database connection error. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to retrieve telemetry readings. Please try again later.',
      );
    }
  }

  async getDeviceStats(deviceId: string, hours: number = 24): Promise<any> {
    try {
      // Simple validation
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
}
