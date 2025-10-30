import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

describe('DevicesController', () => {
  let controller: DevicesController;
  let service: DevicesService;

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

  const mockDevicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
    service = module.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a device successfully', async () => {
      mockDevicesService.create.mockResolvedValue(mockDevice);

      const result = await controller.create(mockCreateDeviceDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDeviceDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDevice);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Invalid device data');
      mockDevicesService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        'Invalid device data',
      );
      expect(service.create).toHaveBeenCalledWith(mockCreateDeviceDto);
    });

    it('should throw ConflictException when service throws ConflictException', async () => {
      const error = new ConflictException('Device already exists');
      mockDevicesService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        'Device already exists',
      );
      expect(service.create).toHaveBeenCalledWith(mockCreateDeviceDto);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockDevicesService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.create(mockCreateDeviceDto)).rejects.toThrow(
        'Database error',
      );
      expect(service.create).toHaveBeenCalledWith(mockCreateDeviceDto);
    });

    it('should pass through validation errors from service', async () => {
      const error = new BadRequestException(
        'Rated wattage must be a positive number',
      );
      mockDevicesService.create.mockRejectedValue(error);

      const invalidDto = { ...mockCreateDeviceDto, ratedWattage: -100 };

      await expect(controller.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(invalidDto)).rejects.toThrow(
        'Rated wattage must be a positive number',
      );
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle empty request body', async () => {
      const error = new BadRequestException('Device data is required');
      mockDevicesService.create.mockRejectedValue(error);

      await expect(controller.create({} as CreateDeviceDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledWith({});
    });
  });

  describe('findAll', () => {
    it('should return all devices', async () => {
      const mockDevices = [
        mockDevice,
        { ...mockDevice, deviceId: 'DEVICE_002' },
      ];
      mockDevicesService.findAll.mockResolvedValue(mockDevices);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDevices);
    });

    it('should return empty array when no devices exist', async () => {
      mockDevicesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException(
        'Database connection error',
      );
      mockDevicesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.findAll()).rejects.toThrow(
        'Database connection error',
      );
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should handle generic errors from service', async () => {
      const error = new Error('Generic error');
      mockDevicesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(Error);
      await expect(controller.findAll()).rejects.toThrow('Generic error');
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a device by ID', async () => {
      mockDevicesService.findOne.mockResolvedValue(mockDevice);

      const result = await controller.findOne('DEVICE_001');

      expect(service.findOne).toHaveBeenCalledWith('DEVICE_001');
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDevice);
    });

    it('should throw NotFoundException when device not found', async () => {
      const error = new NotFoundException('Device not found');
      mockDevicesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('NONEXISTENT')).rejects.toThrow(
        'Device not found',
      );
      expect(service.findOne).toHaveBeenCalledWith('NONEXISTENT');
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Device ID is required');
      mockDevicesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('')).rejects.toThrow(BadRequestException);
      await expect(controller.findOne('')).rejects.toThrow(
        'Device ID is required',
      );
      expect(service.findOne).toHaveBeenCalledWith('');
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockDevicesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.findOne('DEVICE_001')).rejects.toThrow(
        'Database error',
      );
      expect(service.findOne).toHaveBeenCalledWith('DEVICE_001');
    });

    it('should handle whitespace in device ID', async () => {
      mockDevicesService.findOne.mockResolvedValue(mockDevice);

      await controller.findOne('  DEVICE_001  ');

      expect(service.findOne).toHaveBeenCalledWith('  DEVICE_001  ');
    });

    it('should handle special characters in device ID', async () => {
      const error = new BadRequestException('Invalid device ID format');
      mockDevicesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('DEVICE@001')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.findOne).toHaveBeenCalledWith('DEVICE@001');
    });
  });

  describe('update', () => {
    it('should update a device successfully', async () => {
      const updatedDevice = { ...mockDevice, ...mockUpdateDeviceDto };
      mockDevicesService.update.mockResolvedValue(updatedDevice);

      const result = await controller.update('DEVICE_001', mockUpdateDeviceDto);

      expect(service.update).toHaveBeenCalledWith(
        'DEVICE_001',
        mockUpdateDeviceDto,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedDevice);
    });

    it('should throw NotFoundException when device not found', async () => {
      const error = new NotFoundException('Device not found');
      mockDevicesService.update.mockRejectedValue(error);

      await expect(
        controller.update('NONEXISTENT', mockUpdateDeviceDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('NONEXISTENT', mockUpdateDeviceDto),
      ).rejects.toThrow('Device not found');
      expect(service.update).toHaveBeenCalledWith(
        'NONEXISTENT',
        mockUpdateDeviceDto,
      );
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Invalid update data');
      mockDevicesService.update.mockRejectedValue(error);

      await expect(
        controller.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow('Invalid update data');
      expect(service.update).toHaveBeenCalledWith(
        'DEVICE_001',
        mockUpdateDeviceDto,
      );
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockDevicesService.update.mockRejectedValue(error);

      await expect(
        controller.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.update('DEVICE_001', mockUpdateDeviceDto),
      ).rejects.toThrow('Database error');
      expect(service.update).toHaveBeenCalledWith(
        'DEVICE_001',
        mockUpdateDeviceDto,
      );
    });

    it('should handle empty device ID', async () => {
      const error = new BadRequestException('Device ID is required');
      mockDevicesService.update.mockRejectedValue(error);

      await expect(controller.update('', mockUpdateDeviceDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith('', mockUpdateDeviceDto);
    });

    it('should handle empty update body', async () => {
      const error = new BadRequestException('Update data is required');
      mockDevicesService.update.mockRejectedValue(error);

      await expect(
        controller.update('DEVICE_001', {} as UpdateDeviceDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith('DEVICE_001', {});
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name' };
      const updatedDevice = { ...mockDevice, name: 'New Name' };
      mockDevicesService.update.mockResolvedValue(updatedDevice);

      const result = await controller.update('DEVICE_001', partialUpdate);

      expect(service.update).toHaveBeenCalledWith('DEVICE_001', partialUpdate);
      expect(result).toEqual(updatedDevice);
    });

    it('should handle negative wattage validation', async () => {
      const error = new BadRequestException(
        'Rated wattage must be a positive number',
      );
      mockDevicesService.update.mockRejectedValue(error);

      const invalidUpdate = { ...mockUpdateDeviceDto, ratedWattage: -50 };

      await expect(
        controller.update('DEVICE_001', invalidUpdate),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.update('DEVICE_001', invalidUpdate),
      ).rejects.toThrow('Rated wattage must be a positive number');
      expect(service.update).toHaveBeenCalledWith('DEVICE_001', invalidUpdate);
    });
  });

  describe('remove', () => {
    it('should remove a device successfully', async () => {
      mockDevicesService.remove.mockResolvedValue(undefined);

      await controller.remove('DEVICE_001');

      expect(service.remove).toHaveBeenCalledWith('DEVICE_001');
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when device not found', async () => {
      const error = new NotFoundException('Device not found');
      mockDevicesService.remove.mockRejectedValue(error);

      await expect(controller.remove('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove('NONEXISTENT')).rejects.toThrow(
        'Device not found',
      );
      expect(service.remove).toHaveBeenCalledWith('NONEXISTENT');
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Device ID is required');
      mockDevicesService.remove.mockRejectedValue(error);

      await expect(controller.remove('')).rejects.toThrow(BadRequestException);
      await expect(controller.remove('')).rejects.toThrow(
        'Device ID is required',
      );
      expect(service.remove).toHaveBeenCalledWith('');
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockDevicesService.remove.mockRejectedValue(error);

      await expect(controller.remove('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.remove('DEVICE_001')).rejects.toThrow(
        'Database error',
      );
      expect(service.remove).toHaveBeenCalledWith('DEVICE_001');
    });

    it('should handle whitespace in device ID', async () => {
      mockDevicesService.remove.mockResolvedValue(undefined);

      await controller.remove('  DEVICE_001  ');

      expect(service.remove).toHaveBeenCalledWith('  DEVICE_001  ');
    });

    it('should handle special characters in device ID', async () => {
      const error = new BadRequestException('Invalid device ID format');
      mockDevicesService.remove.mockRejectedValue(error);

      await expect(controller.remove('DEVICE@001')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.remove).toHaveBeenCalledWith('DEVICE@001');
    });
  });

  describe('error handling', () => {
    it('should propagate all service errors without modification', async () => {
      const testCases = [
        {
          method: 'create',
          args: [mockCreateDeviceDto],
          error: new BadRequestException('Test error'),
        },
        {
          method: 'findAll',
          args: [],
          error: new InternalServerErrorException('Test error'),
        },
        {
          method: 'findOne',
          args: ['DEVICE_001'],
          error: new NotFoundException('Test error'),
        },
        {
          method: 'update',
          args: ['DEVICE_001', mockUpdateDeviceDto],
          error: new ConflictException('Test error'),
        },
        {
          method: 'remove',
          args: ['DEVICE_001'],
          error: new Error('Test error'),
        },
      ];

      for (const testCase of testCases) {
        mockDevicesService[testCase.method].mockRejectedValue(testCase.error);

        await expect(
          controller[testCase.method](...testCase.args),
        ).rejects.toThrow(testCase.error);
        await expect(
          controller[testCase.method](...testCase.args),
        ).rejects.toThrow('Test error');

        mockDevicesService[testCase.method].mockClear();
      }
    });

    it('should not modify service method calls', async () => {
      // Test that controller passes parameters exactly as received
      const testParams = {
        deviceId: 'TEST_DEVICE',
        createDto: { ...mockCreateDeviceDto, deviceId: 'TEST_DEVICE' },
        updateDto: { ...mockUpdateDeviceDto, name: 'Test Update' },
      };

      mockDevicesService.create.mockResolvedValue(mockDevice);
      mockDevicesService.findOne.mockResolvedValue(mockDevice);
      mockDevicesService.update.mockResolvedValue(mockDevice);
      mockDevicesService.remove.mockResolvedValue(undefined);

      await controller.create(testParams.createDto);
      await controller.findOne(testParams.deviceId);
      await controller.update(testParams.deviceId, testParams.updateDto);
      await controller.remove(testParams.deviceId);

      expect(service.create).toHaveBeenCalledWith(testParams.createDto);
      expect(service.findOne).toHaveBeenCalledWith(testParams.deviceId);
      expect(service.update).toHaveBeenCalledWith(
        testParams.deviceId,
        testParams.updateDto,
      );
      expect(service.remove).toHaveBeenCalledWith(testParams.deviceId);
    });
  });

  describe('controller method signatures', () => {
    it('should have correct method signatures', () => {
      expect(typeof controller.create).toBe('function');
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.findOne).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.remove).toBe('function');
    });

    it('should call service methods with correct parameters', async () => {
      mockDevicesService.create.mockResolvedValue(mockDevice);
      mockDevicesService.findAll.mockResolvedValue([mockDevice]);
      mockDevicesService.findOne.mockResolvedValue(mockDevice);
      mockDevicesService.update.mockResolvedValue(mockDevice);
      mockDevicesService.remove.mockResolvedValue(undefined);

      // Test create
      await controller.create(mockCreateDeviceDto);
      expect(service.create).toHaveBeenCalledWith(mockCreateDeviceDto);

      // Test findAll
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith();

      // Test findOne
      await controller.findOne('DEVICE_001');
      expect(service.findOne).toHaveBeenCalledWith('DEVICE_001');

      // Test update
      await controller.update('DEVICE_001', mockUpdateDeviceDto);
      expect(service.update).toHaveBeenCalledWith(
        'DEVICE_001',
        mockUpdateDeviceDto,
      );

      // Test remove
      await controller.remove('DEVICE_001');
      expect(service.remove).toHaveBeenCalledWith('DEVICE_001');
    });
  });
});
