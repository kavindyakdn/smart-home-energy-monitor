import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { Telemetry } from './schemas/telemetry.schema';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockTelemetryModel: any;

  const mockTelemetry = {
    _id: '507f1f77bcf86cd799439011',
    deviceId: 'DEVICE_001',
    category: 'power',
    value: 150.5,
    status: true,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
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

  beforeEach(async () => {
    const mockModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
      constructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: getModelToken(Telemetry.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    mockTelemetryModel = module.get(getModelToken(Telemetry.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestSingle', () => {
    it('should ingest single telemetry successfully', async () => {
      mockTelemetryModel.constructor.mockReturnValue(mockTelemetry);
      mockTelemetry.save.mockResolvedValue(mockTelemetry);

      const result = await service.ingestSingle(mockCreateTelemetryDto);

      expect(mockTelemetryModel.constructor).toHaveBeenCalledWith(
        mockCreateTelemetryDto,
      );
      expect(mockTelemetry.save).toHaveBeenCalled();
      expect(result).toEqual(mockTelemetry);
    });

    it('should throw BadRequestException for extreme values', async () => {
      const invalidDto = { ...mockCreateTelemetryDto, value: 2000000 };

      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        'Value must be between -1,000,000 and 1,000,000',
      );
    });

    it('should throw BadRequestException for invalid device ID format', async () => {
      const invalidDto = { ...mockCreateTelemetryDto, deviceId: 'invalid@id!' };

      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        'Device ID contains invalid characters',
      );
    });

    it('should throw BadRequestException for invalid timestamp', async () => {
      const invalidDto = {
        ...mockCreateTelemetryDto,
        timestamp: '2020-01-01T00:00:00Z', // Too old
      };

      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestSingle(invalidDto)).rejects.toThrow(
        'Timestamp appears to be invalid',
      );
    });

    it('should handle database validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockTelemetryModel.constructor.mockReturnValue(mockTelemetry);
      mockTelemetry.save.mockRejectedValue(validationError);

      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow('Validation failed');
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockTelemetryModel.constructor.mockReturnValue(mockTelemetry);
      mockTelemetry.save.mockRejectedValue(connectionError);

      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow('Database connection error. Please try again later.');
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Generic error');
      mockTelemetryModel.constructor.mockReturnValue(mockTelemetry);
      mockTelemetry.save.mockRejectedValue(genericError);

      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.ingestSingle(mockCreateTelemetryDto),
      ).rejects.toThrow('Failed to ingest telemetry. Please try again later.');
    });
  });

  describe('ingestBatch', () => {
    it('should ingest batch telemetry successfully', async () => {
      const mockSavedTelemetry = [
        mockTelemetry,
        { ...mockTelemetry, _id: '507f1f77bcf86cd799439012' },
      ];
      mockTelemetryModel.insertMany.mockResolvedValue(mockSavedTelemetry);

      const result = await service.ingestBatch(mockBatchTelemetryDto);

      expect(mockTelemetryModel.insertMany).toHaveBeenCalledWith(
        mockBatchTelemetryDto.data,
        {
          ordered: false,
        },
      );
      expect(result).toEqual(mockSavedTelemetry);
    });

    it('should throw BadRequestException for batch size too large', async () => {
      const largeBatch = {
        data: Array(1001).fill(mockCreateTelemetryDto),
      };

      await expect(service.ingestBatch(largeBatch)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestBatch(largeBatch)).rejects.toThrow(
        'Batch size cannot exceed 1000 records',
      );
    });

    it('should throw BadRequestException for empty batch', async () => {
      const emptyBatch = { data: [] };

      await expect(service.ingestBatch(emptyBatch)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestBatch(emptyBatch)).rejects.toThrow(
        'Batch data cannot be empty',
      );
    });

    it('should validate each record in batch', async () => {
      const invalidBatch = {
        data: [
          mockCreateTelemetryDto,
          { ...mockCreateTelemetryDto, value: 2000000 }, // Invalid value
        ],
      };

      await expect(service.ingestBatch(invalidBatch)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestBatch(invalidBatch)).rejects.toThrow(
        'Record 2: Value must be between -1,000,000 and 1,000,000',
      );
    });

    it('should handle bulk write errors', async () => {
      const bulkWriteError = new Error('Bulk write failed') as any;
      bulkWriteError.name = 'BulkWriteError';
      bulkWriteError.writeErrors = [
        { errmsg: 'Duplicate key error' },
        { errmsg: 'Validation error' },
      ];
      mockTelemetryModel.insertMany.mockRejectedValue(bulkWriteError);

      await expect(service.ingestBatch(mockBatchTelemetryDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestBatch(mockBatchTelemetryDto)).rejects.toThrow(
        'Batch insert failed: Duplicate key error; Validation error',
      );
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockTelemetryModel.insertMany.mockRejectedValue(connectionError);

      await expect(service.ingestBatch(mockBatchTelemetryDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.ingestBatch(mockBatchTelemetryDto)).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });
  });

  // describe('getReadings', () => {
  //   it('should return telemetry readings', async () => {
  //     const mockReadings = [
  //       mockTelemetry,
  //       { ...mockTelemetry, deviceId: 'DEVICE_002' },
  //     ];
  //     mockTelemetryModel.find.mockReturnValue({
  //       sort: jest.fn().mockReturnValue({
  //         limit: jest.fn().mockReturnValue({
  //           exec: jest.fn().mockResolvedValue(mockReadings),
  //         }),
  //       }),
  //     });

  //     // const result = await service.getReadings('DEVICE_001');

  //     expect(mockTelemetryModel.find).toHaveBeenCalledWith({
  //       deviceId: 'DEVICE_001',
  //     });
  //     expect(result).toEqual(mockReadings);
  //   });

  //   it('should apply time filters correctly', async () => {
  //     const mockReadings = [mockTelemetry];
  //     mockTelemetryModel.find.mockReturnValue({
  //       sort: jest.fn().mockReturnValue({
  //         limit: jest.fn().mockReturnValue({
  //           exec: jest.fn().mockResolvedValue(mockReadings),
  //         }),
  //       }),
  //     });

  //     // await service.getReadings(
  //     //   'DEVICE_001',
  //     //   '2024-01-15T00:00:00Z',
  //     //   '2024-01-15T23:59:59Z',
  //     // );

  //     expect(mockTelemetryModel.find).toHaveBeenCalledWith({
  //       deviceId: 'DEVICE_001',
  //       timestamp: {
  //         $gte: new Date('2024-01-15T00:00:00Z'),
  //         $lte: new Date('2024-01-15T23:59:59Z'),
  //       },
  //     });
  //   });

  //   it('should cap limit at 1000', async () => {
  //     const mockReadings = [mockTelemetry];
  //     mockTelemetryModel.find.mockReturnValue({
  //       sort: jest.fn().mockReturnValue({
  //         limit: jest.fn().mockReturnValue({
  //           exec: jest.fn().mockResolvedValue(mockReadings),
  //         }),
  //       }),
  //     });

  //     // await service.getReadings('DEVICE_001', undefined, undefined, 2000);

  //     expect(mockTelemetryModel.find).toHaveBeenCalledWith({
  //       deviceId: 'DEVICE_001',
  //     });
  //   });

  //   it('should handle database connection errors', async () => {
  //     const connectionError = new Error('Connection failed');
  //     connectionError.name = 'MongoNetworkError';
  //     mockTelemetryModel.find.mockReturnValue({
  //       sort: jest.fn().mockReturnValue({
  //         limit: jest.fn().mockReturnValue({
  //           exec: jest.fn().mockRejectedValue(connectionError),
  //         }),
  //       }),
  //     });

  //     // await expect(service.getReadings('DEVICE_001')).rejects.toThrow(
  //     //   InternalServerErrorException,
  //     // );
  //     // await expect(service.getReadings('DEVICE_001')).rejects.toThrow(
  //     //   'Database connection error. Please try again later.',
  //     // );
  //   });
  // });

  describe('getDeviceStats', () => {
    it('should return device statistics', async () => {
      const mockStats = [
        {
          _id: 'power',
          count: 10,
          avgValue: 150.5,
          minValue: 100,
          maxValue: 200,
          lastReading: new Date('2024-01-15T10:30:00Z'),
        },
      ];
      mockTelemetryModel.aggregate.mockResolvedValue(mockStats);

      const result = await service.getDeviceStats('DEVICE_001', 24);

      expect(mockTelemetryModel.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            deviceId: 'DEVICE_001',
            timestamp: expect.any(Object),
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
      expect(result).toEqual({
        deviceId: 'DEVICE_001',
        period: expect.any(Object),
        categories: mockStats,
      });
    });

    it('should throw BadRequestException for empty device ID', async () => {
      await expect(service.getDeviceStats('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getDeviceStats('')).rejects.toThrow(
        'Device ID is required',
      );
    });

    it('should throw BadRequestException for invalid hours', async () => {
      await expect(service.getDeviceStats('DEVICE_001', 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getDeviceStats('DEVICE_001', 0)).rejects.toThrow(
        'Hours must be between 1 and 168',
      );
    });

    it('should throw BadRequestException for hours too large', async () => {
      await expect(service.getDeviceStats('DEVICE_001', 200)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getDeviceStats('DEVICE_001', 200)).rejects.toThrow(
        'Hours must be between 1 and 168',
      );
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockTelemetryModel.aggregate.mockRejectedValue(connectionError);

      await expect(service.getDeviceStats('DEVICE_001', 24)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.getDeviceStats('DEVICE_001', 24)).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });
  });

  describe('deleteOldTelemetry', () => {
    it('should delete old telemetry successfully', async () => {
      mockTelemetryModel.deleteMany.mockResolvedValue({ deletedCount: 100 });

      const result = await service.deleteOldTelemetry(30);

      expect(mockTelemetryModel.deleteMany).toHaveBeenCalledWith({
        timestamp: { $lt: expect.any(Date) },
      });
      expect(result).toBe(100);
    });

    it('should throw BadRequestException for invalid days', async () => {
      await expect(service.deleteOldTelemetry(0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteOldTelemetry(0)).rejects.toThrow(
        'Days to keep must be between 1 and 365',
      );
    });

    it('should throw BadRequestException for days too large', async () => {
      await expect(service.deleteOldTelemetry(400)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteOldTelemetry(400)).rejects.toThrow(
        'Days to keep must be between 1 and 365',
      );
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      connectionError.name = 'MongoNetworkError';
      mockTelemetryModel.deleteMany.mockRejectedValue(connectionError);

      await expect(service.deleteOldTelemetry(30)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.deleteOldTelemetry(30)).rejects.toThrow(
        'Database connection error. Please try again later.',
      );
    });
  });

  describe('validateBusinessRules', () => {
    it('should validate extreme values', () => {
      const invalidDto = { ...mockCreateTelemetryDto, value: 2000000 };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow('Value must be between -1,000,000 and 1,000,000');
    });

    it('should validate negative extreme values', () => {
      const invalidDto = { ...mockCreateTelemetryDto, value: -2000000 };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow('Value must be between -1,000,000 and 1,000,000');
    });

    it('should validate device ID format', () => {
      const invalidDto = { ...mockCreateTelemetryDto, deviceId: 'invalid@id!' };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow('Device ID contains invalid characters');
    });

    it('should validate timestamp range', () => {
      const invalidDto = {
        ...mockCreateTelemetryDto,
        timestamp: '2020-01-01T00:00:00Z', // Too old
      };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow('Timestamp appears to be invalid');
    });

    it('should validate future timestamp', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const invalidDto = {
        ...mockCreateTelemetryDto,
        timestamp: futureDate.toISOString(),
      };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).validateBusinessRules(invalidDto);
      }).toThrow('Timestamp appears to be invalid');
    });

    it('should pass validation for valid data', () => {
      expect(() => {
        (service as any).validateBusinessRules(mockCreateTelemetryDto);
      }).not.toThrow();
    });

    it('should include record index in error message for batch validation', () => {
      const invalidDto = { ...mockCreateTelemetryDto, value: 2000000 };

      expect(() => {
        (service as any).validateBusinessRules(invalidDto, 2);
      }).toThrow('Record 3: Value must be between -1,000,000 and 1,000,000');
    });
  });
});
