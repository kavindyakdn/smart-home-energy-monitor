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
      // Input validation
      this.validateTelemetryInput(data);

      this.logger.log(
        `Ingesting single telemetry for device: ${data.deviceId}`,
      );

      // Create telemetry document
      const telemetry = new this.telemetryModel(data);
      const savedTelemetry = await telemetry.save();

      this.logger.log(`Successfully ingested telemetry: ${savedTelemetry._id}`);
      return savedTelemetry;
    } catch (error) {
      this.logger.error(
        `Failed to ingest single telemetry: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle database errors
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }

      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid data format: ${error.message}`);
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

      // Generic error fallback
      throw new InternalServerErrorException(
        'Failed to ingest telemetry. Please try again later.',
      );
    }
  }

  async ingestBatch(batch: BatchTelemetryDto): Promise<Telemetry[]> {
    try {
      // Input validation
      this.validateBatchTelemetryInput(batch);

      this.logger.log(
        `Ingesting batch telemetry with ${batch.data.length} records`,
      );

      // Validate each telemetry record
      for (let i = 0; i < batch.data.length; i++) {
        this.validateTelemetryInput(batch.data[i], i);
      }

      // Insert batch data
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

      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle bulk write errors
      if (error.name === 'BulkWriteError') {
        const writeErrors = error.writeErrors || [];
        const errorMessages = writeErrors.map((err) => err.errmsg).join('; ');
        throw new BadRequestException(`Batch insert failed: ${errorMessages}`);
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

      // Generic error fallback
      throw new InternalServerErrorException(
        'Failed to ingest batch telemetry. Please try again later.',
      );
    }
  }

  async getReadings(
    deviceId?: string,
    startTime?: string,
    endTime?: string,
    limit: number = 100,
  ): Promise<Telemetry[]> {
    try {
      // Input validation
      this.validateQueryParameters(deviceId, startTime, endTime, limit);

      this.logger.log(
        `Retrieving telemetry readings for device: ${deviceId || 'all'}`,
      );

      // Build filter
      const filter: any = {};
      if (deviceId) {
        filter.deviceId = deviceId.trim();
      }
      if (startTime || endTime) {
        filter.timestamp = {};
        if (startTime) {
          filter.timestamp.$gte = new Date(startTime);
        }
        if (endTime) {
          filter.timestamp.$lte = new Date(endTime);
        }
      }

      // Execute query
      const readings = await this.telemetryModel
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 1000)) // Cap at 1000 records
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

      // Generic error fallback
      throw new InternalServerErrorException(
        'Failed to retrieve telemetry readings. Please try again later.',
      );
    }
  }

  async getDeviceStats(deviceId: string, hours: number = 24): Promise<any> {
    try {
      // Input validation
      if (!deviceId || deviceId.trim().length === 0) {
        throw new BadRequestException('Device ID is required');
      }

      if (hours <= 0 || hours > 168) {
        // Max 1 week
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

      // Generic error fallback
      throw new InternalServerErrorException(
        'Failed to retrieve device stats. Please try again later.',
      );
    }
  }

  async deleteOldTelemetry(daysToKeep: number = 30): Promise<number> {
    try {
      // Input validation
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

      // Generic error fallback
      throw new InternalServerErrorException(
        'Failed to delete old telemetry. Please try again later.',
      );
    }
  }

  /**
   * Validates single telemetry input
   */
  private validateTelemetryInput(
    data: CreateTelemetryDto,
    index?: number,
  ): void {
    if (!data) {
      throw new BadRequestException('Telemetry data is required');
    }

    const prefix = index !== undefined ? `Record ${index + 1}: ` : '';

    if (!data.deviceId || data.deviceId.trim().length === 0) {
      throw new BadRequestException(`${prefix}Device ID is required`);
    }

    if (!data.category || data.category.trim().length === 0) {
      throw new BadRequestException(`${prefix}Category is required`);
    }

    if (data.value === undefined || data.value === null) {
      throw new BadRequestException(`${prefix}Value is required`);
    }

    if (typeof data.value !== 'number' || isNaN(data.value)) {
      throw new BadRequestException(`${prefix}Value must be a valid number`);
    }

    if (data.value < -1000000 || data.value > 1000000) {
      throw new BadRequestException(
        `${prefix}Value must be between -1,000,000 and 1,000,000`,
      );
    }

    if (data.status === undefined || data.status === null) {
      throw new BadRequestException(`${prefix}Status is required`);
    }

    if (typeof data.status !== 'boolean') {
      throw new BadRequestException(`${prefix}Status must be a boolean`);
    }

    if (!data.timestamp) {
      throw new BadRequestException(`${prefix}Timestamp is required`);
    }

    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
      throw new BadRequestException(`${prefix}Timestamp must be a valid date`);
    }

    // Check if timestamp is not too far in the future (max 1 hour)
    const now = new Date();
    const maxFutureTime = new Date(now.getTime() + 60 * 60 * 1000);
    if (timestamp > maxFutureTime) {
      throw new BadRequestException(
        `${prefix}Timestamp cannot be more than 1 hour in the future`,
      );
    }

    // Check if timestamp is not too old (max 30 days)
    const maxPastTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (timestamp < maxPastTime) {
      throw new BadRequestException(
        `${prefix}Timestamp cannot be older than 30 days`,
      );
    }

    // Validate device ID format
    const deviceIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!deviceIdRegex.test(data.deviceId)) {
      throw new BadRequestException(
        `${prefix}Device ID can only contain letters, numbers, underscores, and hyphens`,
      );
    }

    // Validate category
    const validCategories = [
      'power',
      'lighting',
      'temperature',
      'humidity',
      'motion',
      'door',
      'window',
    ];
    if (!validCategories.includes(data.category.toLowerCase())) {
      throw new BadRequestException(
        `${prefix}Category must be one of: ${validCategories.join(', ')}`,
      );
    }
  }

  /**
   * Validates batch telemetry input
   */
  private validateBatchTelemetryInput(batch: BatchTelemetryDto): void {
    if (!batch) {
      throw new BadRequestException('Batch data is required');
    }

    if (!batch.data || !Array.isArray(batch.data)) {
      throw new BadRequestException('Batch data must be an array');
    }

    if (batch.data.length === 0) {
      throw new BadRequestException('Batch data cannot be empty');
    }

    if (batch.data.length > 1000) {
      throw new BadRequestException('Batch size cannot exceed 1000 records');
    }
  }

  /**
   * Validates query parameters
   */
  private validateQueryParameters(
    deviceId?: string,
    startTime?: string,
    endTime?: string,
    limit?: number,
  ): void {
    if (deviceId !== undefined && (!deviceId || deviceId.trim().length === 0)) {
      throw new BadRequestException('Device ID cannot be empty');
    }

    if (startTime) {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Start time must be a valid date');
      }
    }

    if (endTime) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('End time must be a valid date');
      }
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    if (limit !== undefined) {
      if (limit <= 0 || limit > 1000) {
        throw new BadRequestException('Limit must be between 1 and 1000');
      }
    }
  }
}
