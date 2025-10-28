import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  let service: TelemetryService;

  const mockTelemetry = {
    _id: '507f1f77bcf86cd799439011',
    deviceId: 'DEVICE_001',
    category: 'power',
    value: 150.5,
    status: true,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateTelemetryDto: CreateTelemetryDto = {
    deviceId: 'DEVICE_001',
    category: 'power',
    value: 150.5,
    status: true,
    timestamp: '2024-01-15T10:30:00Z',
  };

  const mockBatchTelemetryDto: BatchTelemetryDto = {
    data: [
      {
        deviceId: 'DEVICE_001',
        category: 'power',
        value: 100,
        status: true,
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        deviceId: 'DEVICE_002',
        category: 'temperature',
        value: 22.5,
        status: true,
        timestamp: '2024-01-15T10:30:00Z',
      },
    ],
  };

  const mockTelemetryService = {
    ingestSingle: jest.fn(),
    ingestBatch: jest.fn(),
    getDeviceReadings: jest.fn(),
    getDeviceStats: jest.fn(),
    deleteOldTelemetry: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
    service = module.get<TelemetryService>(TelemetryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ingestSingle', () => {
    it('should ingest single telemetry successfully', async () => {
      mockTelemetryService.ingestSingle.mockResolvedValue(mockTelemetry);

      const result = await controller.ingestSingle(mockCreateTelemetryDto);

      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
      expect(service.ingestSingle).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTelemetry);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Invalid telemetry data');
      mockTelemetryService.ingestSingle.mockRejectedValue(error);

      await expect(
        controller.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow('Invalid telemetry data');
      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockTelemetryService.ingestSingle.mockRejectedValue(error);

      await expect(
        controller.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow('Database error');
      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
    });

    it('should handle validation errors from service', async () => {
      const error = new BadRequestException(
        'Value must be between -1,000,000 and 1,000,000',
      );
      mockTelemetryService.ingestSingle.mockRejectedValue(error);

      const invalidDto = { ...mockCreateTelemetryDto, value: 2000000 };

      await expect(controller.ingestSingle(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.ingestSingle(invalidDto)).rejects.toThrow(
        'Value must be between -1,000,000 and 1,000,000',
      );
      expect(service.ingestSingle).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('ingestBatch', () => {
    it('should ingest batch telemetry successfully', async () => {
      const mockSavedTelemetry = [
        mockTelemetry,
        { ...mockTelemetry, _id: '507f1f77bcf86cd799439012' },
      ];
      mockTelemetryService.ingestBatch.mockResolvedValue(mockSavedTelemetry);

      const result = await controller.ingestBatch(mockBatchTelemetryDto);

      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);
      expect(service.ingestBatch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedTelemetry);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException(
        'Batch size cannot exceed 1000 records',
      );
      mockTelemetryService.ingestBatch.mockRejectedValue(error);

      await expect(
        controller.ingestBatch(mockBatchTelemetryDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.ingestBatch(mockBatchTelemetryDto),
      ).rejects.toThrow('Batch size cannot exceed 1000 records');
      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockTelemetryService.ingestBatch.mockRejectedValue(error);

      await expect(
        controller.ingestBatch(mockBatchTelemetryDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.ingestBatch(mockBatchTelemetryDto),
      ).rejects.toThrow('Database error');
      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);
    });

    it('should handle batch validation errors', async () => {
      const error = new BadRequestException(
        'Record 2: Value must be between -1,000,000 and 1,000,000',
      );
      mockTelemetryService.ingestBatch.mockRejectedValue(error);

      const invalidBatch = {
        data: [
          mockCreateTelemetryDto,
          { ...mockCreateTelemetryDto, value: 2000000 },
        ],
      };

      await expect(controller.ingestBatch(invalidBatch)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.ingestBatch(invalidBatch)).rejects.toThrow(
        'Record 2: Value must be between -1,000,000 and 1,000,000',
      );
      expect(service.ingestBatch).toHaveBeenCalledWith(invalidBatch);
    });
  });

  describe('getDeviceReadings', () => {
    it('should return telemetry readings', async () => {
      const mockReadings = [
        mockTelemetry,
        { ...mockTelemetry, deviceId: 'DEVICE_002' },
      ];
      mockTelemetryService.getDeviceReadings.mockResolvedValue(mockReadings);

      const result = await controller.getDeviceReadings(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        '50',
      );

      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        50,
      );
      expect(result).toEqual(mockReadings);
    });

    it('should handle string limit parameter conversion', async () => {
      const mockReadings = [mockTelemetry];
      mockTelemetryService.getDeviceReadings.mockResolvedValue(mockReadings);

      await controller.getDeviceReadings(
        'DEVICE_001',
        undefined,
        undefined,
        '200',
      );

      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        undefined,
        undefined,
        200,
      );
    });

    it('should use default limit when limit not provided', async () => {
      const mockReadings = [mockTelemetry];
      mockTelemetryService.getDeviceReadings.mockResolvedValue(mockReadings);

      await controller.getDeviceReadings('DEVICE_001');

      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        undefined,
        undefined,
        100,
      );
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException(
        'Database connection error',
      );
      mockTelemetryService.getDeviceReadings.mockRejectedValue(error);

      await expect(controller.getDeviceReadings('DEVICE_001')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getDeviceReadings('DEVICE_001')).rejects.toThrow(
        'Database connection error',
      );
      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        undefined,
        undefined,
        100,
      );
    });
  });

  describe('getDeviceStats', () => {
    it('should return device statistics', async () => {
      const mockStats = {
        deviceId: 'DEVICE_001',
        period: {
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          hours: 24,
        },
        categories: [
          {
            _id: 'power',
            count: 10,
            avgValue: 150.5,
            minValue: 100,
            maxValue: 200,
            lastReading: new Date('2024-01-15T10:30:00Z'),
          },
        ],
      };
      mockTelemetryService.getDeviceStats.mockResolvedValue(mockStats);

      const result = await controller.getDeviceStats('DEVICE_001', '24');

      expect(service.getDeviceStats).toHaveBeenCalledWith('DEVICE_001', 24);
      expect(result).toEqual(mockStats);
    });

    it('should use default hours when not provided', async () => {
      const mockStats = { deviceId: 'DEVICE_001', categories: [] };
      mockTelemetryService.getDeviceStats.mockResolvedValue(mockStats);

      await controller.getDeviceStats('DEVICE_001');

      expect(service.getDeviceStats).toHaveBeenCalledWith('DEVICE_001', 24);
    });

    it('should handle string hours parameter conversion', async () => {
      const mockStats = { deviceId: 'DEVICE_001', categories: [] };
      mockTelemetryService.getDeviceStats.mockResolvedValue(mockStats);

      await controller.getDeviceStats('DEVICE_001', '48');

      expect(service.getDeviceStats).toHaveBeenCalledWith('DEVICE_001', 48);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Device ID is required');
      mockTelemetryService.getDeviceStats.mockRejectedValue(error);

      await expect(controller.getDeviceStats('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getDeviceStats('')).rejects.toThrow(
        'Device ID is required',
      );
      expect(service.getDeviceStats).toHaveBeenCalledWith('', 24);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockTelemetryService.getDeviceStats.mockRejectedValue(error);

      await expect(
        controller.getDeviceStats('DEVICE_001', '24'),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.getDeviceStats('DEVICE_001', '24'),
      ).rejects.toThrow('Database error');
      expect(service.getDeviceStats).toHaveBeenCalledWith('DEVICE_001', 24);
    });
  });

  describe('deleteOldTelemetry', () => {
    it('should delete old telemetry successfully', async () => {
      mockTelemetryService.deleteOldTelemetry.mockResolvedValue(100);

      const result = await controller.deleteOldTelemetry('30');

      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(30);
      expect(result).toEqual({
        message: 'Successfully deleted 100 old telemetry records',
        deletedCount: 100,
        daysToKeep: 30,
      });
    });

    it('should use default daysToKeep when not provided', async () => {
      mockTelemetryService.deleteOldTelemetry.mockResolvedValue(50);

      const result = await controller.deleteOldTelemetry();

      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(30);
      expect(result).toEqual({
        message: 'Successfully deleted 50 old telemetry records',
        deletedCount: 50,
        daysToKeep: 30,
      });
    });

    it('should handle string daysToKeep parameter conversion', async () => {
      mockTelemetryService.deleteOldTelemetry.mockResolvedValue(75);

      const result = await controller.deleteOldTelemetry('60');

      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(60);
      expect(result).toEqual({
        message: 'Successfully deleted 75 old telemetry records',
        deletedCount: 75,
        daysToKeep: 60,
      });
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException(
        'Days to keep must be between 1 and 365',
      );
      mockTelemetryService.deleteOldTelemetry.mockRejectedValue(error);

      await expect(controller.deleteOldTelemetry('400')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.deleteOldTelemetry('400')).rejects.toThrow(
        'Days to keep must be between 1 and 365',
      );
      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(400);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockTelemetryService.deleteOldTelemetry.mockRejectedValue(error);

      await expect(controller.deleteOldTelemetry('30')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.deleteOldTelemetry('30')).rejects.toThrow(
        'Database error',
      );
      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(30);
    });
  });

  describe('ingestLegacy', () => {
    it('should handle single telemetry request', async () => {
      mockTelemetryService.ingestSingle.mockResolvedValue(mockTelemetry);

      const result = await controller.ingestLegacy(mockCreateTelemetryDto);

      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
      expect(service.ingestBatch).not.toHaveBeenCalled();
      expect(result).toEqual(mockTelemetry);
    });

    it('should handle batch telemetry request', async () => {
      const mockSavedTelemetry = [
        mockTelemetry,
        { ...mockTelemetry, _id: '507f1f77bcf86cd799439012' },
      ];
      mockTelemetryService.ingestBatch.mockResolvedValue(mockSavedTelemetry);

      const result = await controller.ingestLegacy(mockBatchTelemetryDto);

      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);
      expect(service.ingestSingle).not.toHaveBeenCalled();
      expect(result).toEqual(mockSavedTelemetry);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      const error = new BadRequestException('Invalid telemetry data');
      mockTelemetryService.ingestSingle.mockRejectedValue(error);

      await expect(
        controller.ingestLegacy(mockCreateTelemetryDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.ingestLegacy(mockCreateTelemetryDto),
      ).rejects.toThrow('Invalid telemetry data');
      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
    });

    it('should throw InternalServerErrorException when service throws InternalServerErrorException', async () => {
      const error = new InternalServerErrorException('Database error');
      mockTelemetryService.ingestBatch.mockRejectedValue(error);

      await expect(
        controller.ingestLegacy(mockBatchTelemetryDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.ingestLegacy(mockBatchTelemetryDto),
      ).rejects.toThrow('Database error');
      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);
    });
  });

  describe('error handling', () => {
    it('should propagate all service errors without modification', async () => {
      const testCases = [
        {
          method: 'ingestSingle',
          args: [mockCreateTelemetryDto],
          error: new BadRequestException('Test error'),
        },
        {
          method: 'ingestBatch',
          args: [mockBatchTelemetryDto],
          error: new InternalServerErrorException('Test error'),
        },
        {
          method: 'getDeviceReadings',
          args: ['DEVICE_001'],
          error: new BadRequestException('Test error'),
        },
        {
          method: 'getDeviceStats',
          args: ['DEVICE_001', '24'],
          error: new InternalServerErrorException('Test error'),
        },
        {
          method: 'deleteOldTelemetry',
          args: ['30'],
          error: new BadRequestException('Test error'),
        },
      ];

      for (const testCase of testCases) {
        mockTelemetryService[testCase.method].mockRejectedValue(testCase.error);

        await expect(
          controller[testCase.method](...testCase.args),
        ).rejects.toThrow(testCase.error);
        await expect(
          controller[testCase.method](...testCase.args),
        ).rejects.toThrow('Test error');

        mockTelemetryService[testCase.method].mockClear();
      }
    });

    it('should not modify service method calls', async () => {
      // Test that controller passes parameters exactly as received
      const testParams = {
        deviceId: 'TEST_DEVICE',
        createDto: { ...mockCreateTelemetryDto, deviceId: 'TEST_DEVICE' },
        batchDto: {
          ...mockBatchTelemetryDto,
          data: [{ ...mockCreateTelemetryDto, deviceId: 'TEST_DEVICE' }],
        },
        hours: '48',
        daysToKeep: '60',
      };

      mockTelemetryService.ingestSingle.mockResolvedValue(mockTelemetry);
      mockTelemetryService.ingestBatch.mockResolvedValue([mockTelemetry]);
      mockTelemetryService.getDeviceReadings.mockResolvedValue([mockTelemetry]);
      mockTelemetryService.getDeviceStats.mockResolvedValue({
        deviceId: 'TEST_DEVICE',
        categories: [],
      });
      mockTelemetryService.deleteOldTelemetry.mockResolvedValue(100);

      await controller.ingestSingle(testParams.createDto);
      await controller.ingestBatch(testParams.batchDto);
      await controller.getDeviceReadings(testParams.deviceId);
      await controller.getDeviceStats(testParams.deviceId, testParams.hours);
      await controller.deleteOldTelemetry(testParams.daysToKeep);

      expect(service.ingestSingle).toHaveBeenCalledWith(testParams.createDto);
      expect(service.ingestBatch).toHaveBeenCalledWith(testParams.batchDto);
      expect(service.getReadings).toHaveBeenCalledWith(
        testParams.deviceId,
        undefined,
        undefined,
        100,
      );
      expect(service.getDeviceStats).toHaveBeenCalledWith(
        testParams.deviceId,
        48,
      );
      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(60);
    });
  });

  describe('controller method signatures', () => {
    it('should have correct method signatures', () => {
      expect(typeof controller.ingestSingle).toBe('function');
      expect(typeof controller.ingestBatch).toBe('function');
      expect(typeof controller.getDeviceReadings).toBe('function');
      expect(typeof controller.getDeviceStats).toBe('function');
      expect(typeof controller.getDeviceReadings).toBe('function');
      expect(typeof controller.deleteOldTelemetry).toBe('function');
      expect(typeof controller.ingestLegacy).toBe('function');
    });

    it('should call service methods with correct parameters', async () => {
      mockTelemetryService.ingestSingle.mockResolvedValue(mockTelemetry);
      mockTelemetryService.ingestBatch.mockResolvedValue([mockTelemetry]);
      mockTelemetryService.getDeviceReadings.mockResolvedValue([mockTelemetry]);
      mockTelemetryService.getDeviceStats.mockResolvedValue({
        deviceId: 'DEVICE_001',
        categories: [],
      });
      mockTelemetryService.deleteOldTelemetry.mockResolvedValue(100);

      // Test ingestSingle
      await controller.ingestSingle(mockCreateTelemetryDto);
      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);

      // Test ingestBatch
      await controller.ingestBatch(mockBatchTelemetryDto);
      expect(service.ingestBatch).toHaveBeenCalledWith(mockBatchTelemetryDto);

      // Test getDeviceReadings
      await controller.getDeviceReadings(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        '50',
      );
      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        50,
      );

      // Test getDeviceStats
      await controller.getDeviceStats('DEVICE_001', '24');
      expect(service.getDeviceStats).toHaveBeenCalledWith('DEVICE_001', 24);

      // Test getDeviceReadings
      await controller.getDeviceReadings(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        '50',
      );
      expect(service.getReadings).toHaveBeenCalledWith(
        'DEVICE_001',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z',
        50,
      );

      // Test deleteOldTelemetry
      await controller.deleteOldTelemetry('30');
      expect(service.deleteOldTelemetry).toHaveBeenCalledWith(30);

      // Test ingestLegacy
      await controller.ingestLegacy(mockCreateTelemetryDto);
      expect(service.ingestSingle).toHaveBeenCalledWith(mockCreateTelemetryDto);
    });
  });
});
