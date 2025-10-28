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

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId);
  }

  @Patch(':deviceId')
  update(
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(deviceId, updateDeviceDto);
  }

  @Delete(':deviceId')
  remove(@Param('deviceId') deviceId: string) {
    return this.devicesService.remove(deviceId);
  }
}
