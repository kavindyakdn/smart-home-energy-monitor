import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from './schemas/device.schema';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(@InjectModel(Device.name) private deviceModel: Model<Device>) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    try {
      // Input validation
      this.validateCreateDeviceInput(createDeviceDto);

      // Validate wattage is not negative
      if (
        createDeviceDto.ratedWattage !== undefined &&
        createDeviceDto.ratedWattage < 0
      ) {
        throw new BadRequestException(
          'Rated wattage must be a positive number',
        );
      }

      this.logger.log(`Creating device with ID: ${createDeviceDto.deviceId}`);

      // Check if device already exists
      const existing = await this.deviceModel.findOne({
        deviceId: createDeviceDto.deviceId,
      });

      if (existing) {
        this.logger.warn(
          `Device with ID ${createDeviceDto.deviceId} already exists`,
        );
        throw new ConflictException(
          `Device with ID '${createDeviceDto.deviceId}' already exists`,
        );
      }

      // Create new device
      const newDevice = new this.deviceModel(createDeviceDto);
      const savedDevice = await newDevice.save();

      this.logger.log(`Successfully created device: ${savedDevice.deviceId}`);
      return savedDevice;
    } catch (error) {
      this.logger.error(
        `Failed to create device: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
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
        'Failed to create device. Please try again later.',
      );
    }
  }

  async findAll(): Promise<Device[]> {
    try {
      this.logger.log('Retrieving all devices');
      const devices = await this.deviceModel.find().exec();
      this.logger.log(`Successfully retrieved ${devices.length} devices`);
      return devices;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve devices: ${error.message}`,
        error.stack,
      );

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
        'Failed to retrieve devices. Please try again later.',
      );
    }
  }

  async findOne(deviceId: string): Promise<Device> {
    try {
      // Input validation
      if (!deviceId || deviceId.trim().length === 0) {
        throw new BadRequestException(
          'Device ID is required and cannot be empty',
        );
      }

      this.logger.log(`Retrieving device with ID: ${deviceId}`);
      const device = await this.deviceModel
        .findOne({ deviceId: deviceId.trim() })
        .exec();

      if (!device) {
        this.logger.warn(`Device with ID '${deviceId}' not found`);
        throw new NotFoundException(`Device with ID '${deviceId}' not found`);
      }

      this.logger.log(`Successfully retrieved device: ${device.deviceId}`);
      return device;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve device ${deviceId}: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
        'Failed to retrieve device. Please try again later.',
      );
    }
  }

  async update(deviceId: string, updateDto: UpdateDeviceDto): Promise<Device> {
    try {
      // Input validation
      if (!deviceId || deviceId.trim().length === 0) {
        throw new BadRequestException(
          'Device ID is required and cannot be empty',
        );
      }

      this.validateUpdateDeviceInput(updateDto);

      // Validate wattage is not negative
      if (updateDto.ratedWattage !== undefined && updateDto.ratedWattage < 0) {
        throw new BadRequestException(
          'Rated wattage must be a positive number',
        );
      }

      this.logger.log(`Updating device with ID: ${deviceId}`);

      const updated = await this.deviceModel.findOneAndUpdate(
        { deviceId: deviceId.trim() },
        updateDto,
        { new: true, runValidators: true },
      );

      if (!updated) {
        this.logger.warn(`Device with ID '${deviceId}' not found for update`);
        throw new NotFoundException(`Device with ID '${deviceId}' not found`);
      }

      this.logger.log(`Successfully updated device: ${updated.deviceId}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update device ${deviceId}: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
        'Failed to update device. Please try again later.',
      );
    }
  }

  async remove(deviceId: string): Promise<void> {
    try {
      // Input validation
      if (!deviceId || deviceId.trim().length === 0) {
        throw new BadRequestException(
          'Device ID is required and cannot be empty',
        );
      }

      this.logger.log(`Removing device with ID: ${deviceId}`);
      const result = await this.deviceModel
        .deleteOne({ deviceId: deviceId.trim() })
        .exec();

      if (result.deletedCount === 0) {
        this.logger.warn(`Device with ID '${deviceId}' not found for deletion`);
        throw new NotFoundException(`Device with ID '${deviceId}' not found`);
      }

      this.logger.log(`Successfully removed device: ${deviceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove device ${deviceId}: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
        'Failed to remove device. Please try again later.',
      );
    }
  }

  /**
   * Validates input for creating a device
   */
  private validateCreateDeviceInput(createDeviceDto: CreateDeviceDto): void {
    if (!createDeviceDto) {
      throw new BadRequestException('Device data is required');
    }

    if (
      !createDeviceDto.deviceId ||
      createDeviceDto.deviceId.trim().length === 0
    ) {
      throw new BadRequestException(
        'Device ID is required and cannot be empty',
      );
    }

    if (!createDeviceDto.name || createDeviceDto.name.trim().length === 0) {
      throw new BadRequestException(
        'Device name is required and cannot be empty',
      );
    }

    if (!createDeviceDto.type || createDeviceDto.type.trim().length === 0) {
      throw new BadRequestException(
        'Device type is required and cannot be empty',
      );
    }

    if (
      !createDeviceDto.category ||
      createDeviceDto.category.trim().length === 0
    ) {
      throw new BadRequestException(
        'Device category is required and cannot be empty',
      );
    }

    // Validate device ID format (alphanumeric, underscores, hyphens)
    const deviceIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!deviceIdRegex.test(createDeviceDto.deviceId)) {
      throw new BadRequestException(
        'Device ID can only contain letters, numbers, underscores, and hyphens',
      );
    }

    // Validate device ID length
    if (createDeviceDto.deviceId.length > 50) {
      throw new BadRequestException('Device ID cannot exceed 50 characters');
    }

    // Validate name length
    if (createDeviceDto.name.length > 100) {
      throw new BadRequestException('Device name cannot exceed 100 characters');
    }

    // Validate room length if provided
    if (createDeviceDto.room && createDeviceDto.room.length > 50) {
      throw new BadRequestException('Room name cannot exceed 50 characters');
    }

    // Validate wattage range if provided
    if (createDeviceDto.ratedWattage !== undefined) {
      if (createDeviceDto.ratedWattage > 100000) {
        throw new BadRequestException(
          'Rated wattage cannot exceed 100,000 watts',
        );
      }
    }
  }

  /**
   * Validates input for updating a device
   */
  private validateUpdateDeviceInput(updateDto: UpdateDeviceDto): void {
    if (!updateDto) {
      throw new BadRequestException('Update data is required');
    }

    // Validate device ID format if provided
    if (updateDto.deviceId !== undefined) {
      if (!updateDto.deviceId || updateDto.deviceId.trim().length === 0) {
        throw new BadRequestException('Device ID cannot be empty');
      }

      const deviceIdRegex = /^[a-zA-Z0-9_-]+$/;
      if (!deviceIdRegex.test(updateDto.deviceId)) {
        throw new BadRequestException(
          'Device ID can only contain letters, numbers, underscores, and hyphens',
        );
      }

      if (updateDto.deviceId.length > 50) {
        throw new BadRequestException('Device ID cannot exceed 50 characters');
      }
    }

    // Validate name if provided
    if (updateDto.name !== undefined) {
      if (!updateDto.name || updateDto.name.trim().length === 0) {
        throw new BadRequestException('Device name cannot be empty');
      }

      if (updateDto.name.length > 100) {
        throw new BadRequestException(
          'Device name cannot exceed 100 characters',
        );
      }
    }

    // Validate type if provided
    if (updateDto.type !== undefined) {
      if (!updateDto.type || updateDto.type.trim().length === 0) {
        throw new BadRequestException('Device type cannot be empty');
      }
    }

    // Validate category if provided
    if (updateDto.category !== undefined) {
      if (!updateDto.category || updateDto.category.trim().length === 0) {
        throw new BadRequestException('Device category cannot be empty');
      }
    }

    // Validate room length if provided
    if (updateDto.room !== undefined && updateDto.room !== null) {
      if (updateDto.room.length > 50) {
        throw new BadRequestException('Room name cannot exceed 50 characters');
      }
    }

    // Validate wattage range if provided
    if (updateDto.ratedWattage !== undefined) {
      if (updateDto.ratedWattage > 100000) {
        throw new BadRequestException(
          'Rated wattage cannot exceed 100,000 watts',
        );
      }
    }
  }
}
