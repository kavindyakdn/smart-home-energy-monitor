import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Device } from './schemas/device.schema';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

describe('DevicesService', () => {
  let service: DevicesService;
  let mockDeviceModel: any;

  const mockDevice = {
    _id: '507f1f77bcf86cd799439011',
    deviceId: 'DEVICE_001',
    name: 'Test Device',
    type: 'plug',
    category: 'power',
    room: 'Living Room',
    ratedWattage: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  const mockCreateDeviceDto: CreateDeviceDto = {
    deviceId: 'DEVICE_001',
    name: 'Test Device',
    type: 'plug',
    category: 'power',
    room: 'Living Room',
    ratedWattage: 1500,
  };

  const mockUpdateDeviceDto: UpdateDeviceDto = {
    name: 'Updated Device',
    room: 'Bedroom',
  };

  beforeEach(async () => {
    const mockModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      constructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getModelToken(Device.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    mockDeviceModel = module.get(getModelToken(Device.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a device successfully', async () => {
      mockDeviceModel.findOne.mockResolvedValue(null);
      mockDeviceModel.constructor.mockReturnValue(mockDevice);
      mockDevice.save.mockResolvedValue(mockDevice);

      const result = await service.create(mockCreateDeviceDto);

      expect(mockDeviceModel.findOne).toHaveBeenCalledWith({
        deviceId: mockCreateDeviceDto.deviceId,
      });
      expect(mockDeviceModel.constructor).toHaveBeenCalledWith(
        mockCreateDeviceDto,
      );
      expect(mockDevice.save).toHaveBeenCalled();
      expect(result).toEqual(mockDevice);
    });

    it('should throw ConflictException when device already exists', async () => {
      mockDeviceModel.findOne.mockResolvedValue(mockDevice);

      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        `Device with ID '${mockCreateDeviceDto.deviceId}' already exists`,
      );
    });

    it('should throw BadRequestException for negative wattage', async () => {
      const invalidDto = { ...mockCreateDeviceDto, ratedWattage: -100 };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Rated wattage must be a positive number',
      );
    });

    it('should throw BadRequestException for empty device ID', async () => {
      const invalidDto = { ...mockCreateDeviceDto, deviceId: '' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Device ID is required and cannot be empty',
      );
    });

    it('should throw BadRequestException for invalid device ID format', async () => {
      const invalidDto = { ...mockCreateDeviceDto, deviceId: 'invalid@id!' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Device ID can only contain letters, numbers, underscores, and hyphens',
      );
    });

    it('should throw BadRequestException for device ID too long', async () => {
      const invalidDto = {
        ...mockCreateDeviceDto,
        deviceId: 'a'.repeat(51),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Device ID cannot exceed 50 characters',
      );
    });

    it('should throw BadRequestException for empty name', async () => {
      const invalidDto = { ...mockCreateDeviceDto, name: '' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Device name is required and cannot be empty',
      );
    });

    it('should throw BadRequestException for name too long', async () => {
      const invalidDto = {
        ...mockCreateDeviceDto,
        name: 'a'.repeat(101),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Device name cannot exceed 100 characters',
      );
    });

    it('should throw BadRequestException for wattage too high', async () => {
      const invalidDto = { ...mockCreateDeviceDto, ratedWattage: 100001 };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Rated wattage cannot exceed 100,000 watts',
      );
    });

    it('should handle database validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockDeviceModel.findOne.mockResolvedValue(null);
      mockDeviceModel.constructor.mockReturnValue(mockDevice);
      mockDevice.save.mockRejectedValue(validationError);

      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        'Validation failed: Validation failed',
      );
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockDeviceModel.findOne.mockRejectedValue(connectionError);

      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockDeviceModel.findOne.mockRejectedValue(genericError);

      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(mockCreateDeviceDto)).rejects.toThrow(
        'Failed to create device. Please try again later.',
      );
    });
  });

  describe('findAll', () => {
    it('should return all devices', async () => {
      const mockDevices = [
        mockDevice,
        { ...mockDevice, deviceId: 'DEVICE_002' },
      ];
      mockDeviceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDevices),
      });

      const result = await service.findAll();

      expect(mockDeviceModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockDevices);
    });

    it('should return empty array when no devices exist', async () => {
      mockDeviceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockDeviceModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(connectionError),
      });

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findAll()).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockDeviceModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(genericError),
      });

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findAll()).rejects.toThrow(
        'Failed to retrieve devices. Please try again later.',
      );
    });
  });

  describe('findOne', () => {
    it('should return a device by ID', async () => {
      mockDeviceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDevice),
      });

      const result = await service.findOne('DEVICE_001');

      expect(mockDeviceModel.findOne).toHaveBeenCalledWith({
        deviceId: 'DEVICE_001',
      });
      expect(result).toEqual(mockDevice);
    });

    it('should throw NotFoundException when device not found', async () => {
      mockDeviceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('NONEXISTENT')).rejects.toThrow(
        "Device with ID 'NONEXISTENT' not found",
      );
    });

    it('should throw BadRequestException for empty device ID', async () => {
      await expect(service.findOne('')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('')).rejects.toThrow(
        'Device ID is required and cannot be empty',
      );
    });

    it('should throw BadRequestException for whitespace-only device ID', async () => {
      await expect(service.findOne('   ')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('   ')).rejects.toThrow(
        'Device ID is required and cannot be empty',
      );
    });

    it('should trim whitespace from device ID', async () => {
      mockDeviceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDevice),
      });

      await service.findOne('  DEVICE_001  ');

      expect(mockDeviceModel.findOne).toHaveBeenCalledWith({
        deviceId: 'DEVICE_001',
      });
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockDeviceModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(connectionError),
      });

      await expect(service.findOne('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findOne('DEVICE_001')).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockDeviceModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(genericError),
      });

      await expect(service.findOne('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findOne('DEVICE_001')).rejects.toThrow(
        'Failed to retrieve device. Please try again later.',
      );
    });
  });

  describe('update', () => {
    it('should update a device successfully', async () => {
      const updatedDevice = { ...mockDevice, ...mockUpdateDeviceDto };
      mockDeviceModel.findOneAndUpdate.mockResolvedValue(updatedDevice);

      const result = await service.update('DEVICE_001', mockUpdateDeviceDto);

      expect(mockDeviceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { deviceId: 'DEVICE_001' },
        mockUpdateDeviceDto,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedDevice);
    });

    it('should throw NotFoundException when device not found', async () => {
      mockDeviceModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('NONEXISTENT', mockUpdateDeviceDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('NONEXISTENT', mockUpdateDeviceDto),
      ).rejects.toThrow("Device with ID 'NONEXISTENT' not found");
    });

    it('should throw BadRequestException for empty device ID', async () => {
      await expect(service.update('', mockUpdateDeviceDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('', mockUpdateDeviceDto)).rejects.toThrow(
        'Device ID is required and cannot be empty',
      );
    });

    it('should throw BadRequestException for negative wattage', async () => {
      const invalidDto = { ...mockUpdateDeviceDto, ratedWattage: -50 };

      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        'Rated wattage must be a positive number',
      );
    });

    it('should throw BadRequestException for empty name in update', async () => {
      const invalidDto = { ...mockUpdateDeviceDto, name: '' };

      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        'Device name cannot be empty',
      );
    });

    it('should throw BadRequestException for name too long in update', async () => {
      const invalidDto = {
        ...mockUpdateDeviceDto,
        name: 'a'.repeat(101),
      };

      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('DEVICE_001', invalidDto)).rejects.toThrow(
        'Device name cannot exceed 100 characters',
      );
    });

    it('should trim whitespace from device ID', async () => {
      const updatedDevice = { ...mockDevice, ...mockUpdateDeviceDto };
      mockDeviceModel.findOneAndUpdate.mockResolvedValue(updatedDevice);

      await service.update('  DEVICE_001  ', mockUpdateDeviceDto);

      expect(mockDeviceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { deviceId: 'DEVICE_001' },
        mockUpdateDeviceDto,
        { new: true, runValidators: true },
      );
    });

    it('should handle database validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockDeviceModel.findOneAndUpdate.mockRejectedValue(validationError);

      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow('Validation failed: Validation failed');
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockDeviceModel.findOneAndUpdate.mockRejectedValue(connectionError);

      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow('Database connection error. Please try again later.');
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockDeviceModel.findOneAndUpdate.mockRejectedValue(genericError);

      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow('Failed to update device. Please try again later.');
    });
  });

  describe('remove', () => {
    it('should remove a device successfully', async () => {
      mockDeviceModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.remove('DEVICE_001');

      expect(mockDeviceModel.deleteOne).toHaveBeenCalledWith({
        deviceId: 'DEVICE_001',
      });
    });

    it('should throw NotFoundException when device not found', async () => {
      mockDeviceModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      await expect(service.remove('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('NONEXISTENT')).rejects.toThrow(
        "Device with ID 'NONEXISTENT' not found",
      );
    });

    it('should throw BadRequestException for empty device ID', async () => {
      await expect(service.remove('')).rejects.toThrow(BadRequestException);
      await expect(service.remove('')).rejects.toThrow(
        'Device ID is required and cannot be empty',
      );
    });

    it('should trim whitespace from device ID', async () => {
      mockDeviceModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.remove('  DEVICE_001  ');

      expect(mockDeviceModel.deleteOne).toHaveBeenCalledWith({
        deviceId: 'DEVICE_001',
      });
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockDeviceModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(connectionError),
      });

      await expect(service.remove('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.remove('DEVICE_001')).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockDeviceModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(genericError),
      });

      await expect(service.remove('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.remove('DEVICE_001')).rejects.toThrow(
        'Failed to remove device. Please try again later.',
      );
    });
  });

  describe('validation methods', () => {
    describe('validateCreateDeviceInput', () => {
      it('should throw BadRequestException for null input', () => {
        expect(() => {
          (service as any).validateCreateDeviceInput(null);
        }).toThrow(BadRequestException);
      });

      it('should throw BadRequestException for undefined input', () => {
        expect(() => {
          (service as any).validateCreateDeviceInput(undefined);
        }).toThrow(BadRequestException);
      });

      it('should validate room length', () => {
        const invalidDto = {
          ...mockCreateDeviceDto,
          room: 'a'.repeat(51),
        };

        expect(() => {
          (service as any).validateCreateDeviceInput(invalidDto);
        }).toThrow(BadRequestException);
        expect(() => {
          (service as any).validateCreateDeviceInput(invalidDto);
        }).toThrow('Room name cannot exceed 50 characters');
      });
    });

    describe('validateUpdateDeviceInput', () => {
      it('should throw BadRequestException for null input', () => {
        expect(() => {
          (service as any).validateUpdateDeviceInput(null);
        }).toThrow(BadRequestException);
      });

      it('should throw BadRequestException for undefined input', () => {
        expect(() => {
          (service as any).validateUpdateDeviceInput(undefined);
        }).toThrow(BadRequestException);
      });

      it('should validate room length in update', () => {
        const invalidDto = {
          room: 'a'.repeat(51),
        };

        expect(() => {
          (service as any).validateUpdateDeviceInput(invalidDto);
        }).toThrow(BadRequestException);
        expect(() => {
          (service as any).validateUpdateDeviceInput(invalidDto);
        }).toThrow('Room name cannot exceed 50 characters');
      });

      it('should validate device ID format in update', () => {
        const invalidDto = {
          deviceId: 'invalid@id!',
        };

        expect(() => {
          (service as any).validateUpdateDeviceInput(invalidDto);
        }).toThrow(BadRequestException);
        expect(() => {
          (service as any).validateUpdateDeviceInput(invalidDto);
        }).toThrow(
          'Device ID can only contain letters, numbers, underscores, and hyphens',
        );
      });
    });
  });
});
