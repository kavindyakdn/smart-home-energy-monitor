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

/**
 * Service for managing telemetry data from smart home devices
 * Handles data ingestion, retrieval, analytics, and cleanup operations
 */
@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<Telemetry>,
  ) {}

  /**
   * Ingests a single telemetry record from a smart device
   */
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

  /**
   * Ingests multiple telemetry records in a single batch operation
   */
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

  /**
   * Retrieves aggregated statistics for a specific device over a time period
   */
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

  /**
   * Deletes old telemetry data to maintain database performance
   */
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

  /**
   * Finds telemetry records by optional filters. Supports filtering by:
   * - deviceId (exact)
   * - deviceType (via device lookup)
   * - room (via device lookup)
   * - time range (timestamp between startTime and endTime)
   */
  async findTelemetry(filters: {
    deviceId?: string;
    deviceType?: string;
    room?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<any[]> {
    try {
      const { deviceId, deviceType, room, startTime, endTime } = filters;

      this.logger.debug(
        `findTelemetry called with filters: ${JSON.stringify({ deviceId, deviceType, room, startTime, endTime })}`,
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

      // If we need deviceType or room, use aggregation with $lookup to devices
      const requiresDeviceJoin = Boolean(deviceType?.trim() || room?.trim());
      this.logger.debug(
        `findTelemetry branch: ${requiresDeviceJoin ? 'aggregate+$lookup' : 'simple find'}`,
      );

      if (requiresDeviceJoin) {
        const pipeline: any[] = [];

        const matchStage: any = {};
        if (deviceId?.trim()) {
          matchStage.deviceId = deviceId.trim();
        }
        // For aggregation, coalesce timestamp/createdAt for matching
        if (Object.keys(timeCriteria).length > 0) {
          pipeline.push({
            $addFields: {
              __ts: { $ifNull: ['$timestamp', '$createdAt'] },
            },
          });
          matchStage.__ts = timeCriteria;
        }
        if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
        }

        // Debug: count docs matching before lookup (use direct fields, not __ts)
        try {
          const countCriteria: any = {};
          if (deviceId?.trim()) {
            countCriteria.deviceId = deviceId.trim();
          }
          if (Object.keys(timeCriteria).length > 0) {
            countCriteria.$or = [
              { timestamp: timeCriteria },
              { createdAt: timeCriteria },
            ];
          }
          const preLookupCount =
            await this.telemetryModel.countDocuments(countCriteria);
          this.logger.debug(
            `findTelemetry pre-lookup match count: ${preLookupCount}`,
          );
        } catch (e) {
          this.logger.debug(
            `findTelemetry pre-lookup count failed: ${(e as Error).message}`,
          );
        }

        pipeline.push(
          {
            $lookup: {
              from: 'devices',
              localField: 'deviceId',
              foreignField: 'deviceId',
              as: 'device',
            },
          },
          { $unwind: '$device' },
        );

        const postLookupMatch: any = {};
        if (deviceType?.trim()) {
          postLookupMatch['device.type'] = deviceType.trim();
        }
        if (room?.trim()) {
          // Case-insensitive exact match on room
          const escapeRegex = (s: string) =>
            s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          postLookupMatch['device.room'] = {
            $regex: `^${escapeRegex(room.trim())}$`,
            $options: 'i',
          };
        }
        if (Object.keys(postLookupMatch).length > 0) {
          pipeline.push({ $match: postLookupMatch });
        }

        // Project only telemetry fields back
        pipeline.push({
          $project: {
            _id: 1,
            deviceId: 1,
            category: 1,
            value: 1,
            status: 1,
            timestamp: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        });

        this.logger.debug(
          `findTelemetry aggregate pipeline: ${JSON.stringify(pipeline)}`,
        );

        // Debug: post-lookup count via $count
        try {
          const countStage = await this.telemetryModel
            .aggregate([...pipeline, { $count: 'n' }])
            .exec();
          const postLookupCount = countStage?.[0]?.n || 0;
          this.logger.debug(
            `findTelemetry post-lookup match count: ${postLookupCount}`,
          );
        } catch (e) {
          this.logger.debug(
            `findTelemetry post-lookup count failed: ${(e as Error).message}`,
          );
        }

        const results = await this.telemetryModel.aggregate(pipeline).exec();
        this.logger.debug(
          `findTelemetry aggregate result count: ${results?.length ?? 0}`,
        );
        return results;
      }

      // Simple find when not filtering by device fields
      const criteria: any = {};
      if (deviceId?.trim()) {
        criteria.deviceId = deviceId.trim();
      }
      if (Object.keys(timeCriteria).length > 0) {
        // For simple find, match either timestamp or createdAt
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
