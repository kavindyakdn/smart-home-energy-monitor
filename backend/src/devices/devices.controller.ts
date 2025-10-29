import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

/**
 * Controller for managing smart home devices
 * Provides CRUD operations for device management
 */
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Create a new smart home device
   */
  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  /**
   * Retrieve all registered devices
   */
  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  /**
   * Retrieve a specific device by its ID
   */
  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId);
  }

  /**
   * Update an existing device
   */
  @Patch(':deviceId')
  update(
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(deviceId, updateDeviceDto);
  }

  /**
   * Remove a device from the system
   */
  @Delete(':deviceId')
  remove(@Param('deviceId') deviceId: string) {
    return this.devicesService.remove(deviceId);
  }
}
