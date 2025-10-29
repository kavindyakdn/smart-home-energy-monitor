# 🏠 Smart Home Energy Monitor - Backend API

A robust NestJS-based REST API for managing smart home devices and collecting telemetry data from IoT sensors.

## 🚀 Features

- **Device Management**: CRUD operations for smart home devices
- **Telemetry Ingestion**: Single and batch data collection
- **Real-time Analytics**: Device statistics and readings
- **Rate Limiting**: Multi-tier request throttling
- **Data Cleanup**: Automated old data removal
- **Health Monitoring**: System health checks
- **Comprehensive Testing**: Unit and E2E test coverage

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure MongoDB connection in .env
MONGO_URI=mongodb://localhost:27017/smart-home-energy
```

## 🚀 Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

## 📡 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Device Management

- `POST /devices` - Create a new device
- `GET /devices` - List all devices
- `GET /devices/:deviceId` - Get device by ID
- `PATCH /devices/:deviceId` - Update device
- `DELETE /devices/:deviceId` - Delete device

### Telemetry Data

- `POST /telemetry/ingest` - Single telemetry ingestion
- `POST /telemetry/ingest/batch` - Batch telemetry ingestion
- `GET /telemetry/devices/:deviceId/readings` - Get device readings
- `GET /telemetry/devices/:deviceId/stats` - Get device statistics
- `POST /telemetry/cleanup` - Cleanup old data
- `POST /telemetry/ingest/legacy` - Legacy compatibility endpoint

### System Health

- `GET /health` - System health check

## 🔧 Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application bootstrap
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators
│   └── middleware/           # Request middleware
├── devices/                   # Device management module
│   ├── devices.controller.ts # Device endpoints
│   ├── devices.service.ts    # Device business logic
│   ├── devices.module.ts     # Device module
│   ├── dto/                  # Data transfer objects
│   └── schemas/              # MongoDB schemas
├── telemetry/                 # Telemetry data module
│   ├── telemetry.controller.ts # Telemetry endpoints
│   ├── telemetry.service.ts  # Telemetry business logic
│   ├── telemetry.module.ts   # Telemetry module
│   ├── dto/                  # Data transfer objects
│   └── schemas/              # MongoDB schemas
└── health/                    # Health check module
    ├── health.controller.ts  # Health endpoints
    ├── health.service.ts     # Health logic
    └── health.module.ts       # Health module
```

## 📊 Data Models

### Device Schema

```typescript
{
  deviceId: string;      // Unique identifier (required)
  name: string;         // Human-readable name (required)
  type: string;         // Device type: plug, light, thermostat (required)
  category: string;     // Category: power, lighting, heating (required)
  room?: string;        // Location (optional)
  ratedWattage?: number; // Power rating in watts (optional)
}
```

### Telemetry Schema

```typescript
{
  deviceId: string; // Reference to device (required)
  category: string; // Data category (required)
  value: number; // Measured value -1M to 1M (required)
  status: boolean; // Device status (required)
  timestamp: Date; // Measurement time (required)
}
```

## ⚡ Rate Limiting

The API implements three-tier rate limiting:

- **Short-term**: 10 requests/second
- **Medium-term**: 50 requests/10 seconds
- **Long-term**: 200 requests/minute

Different endpoints have customized limits based on usage patterns.

## 🔒 Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/smart-home-energy

# Application
NODE_ENV=development
PORT=3000

# Optional: Custom rate limiting
THROTTLE_TTL=1000
THROTTLE_LIMIT=10
```

## 📝 API Testing

Comprehensive Postman collections are available in the `postman/` directory:

- **Device APIs**: Complete CRUD operations testing
- **Telemetry APIs**: Data ingestion and retrieval testing

See `postman/README.md` for detailed testing instructions.

## 🏗️ Architecture Decisions

### Technology Choices

- **NestJS**: Enterprise-grade Node.js framework
- **MongoDB**: Flexible NoSQL for IoT data
- **Mongoose**: Elegant MongoDB object modeling
- **Jest**: Comprehensive testing framework
- **Class Validator**: DTO validation

### Design Patterns

- **Module-based Architecture**: Clear separation of concerns
- **Dependency Injection**: Testable and maintainable code
- **DTO Pattern**: Type-safe data transfer
- **Repository Pattern**: Data access abstraction

## 🚀 Performance Optimizations

- **Connection Pooling**: Efficient database connections
- **Indexing**: Optimized MongoDB queries
- **Batch Processing**: Efficient bulk operations
- **Rate Limiting**: Prevents system overload
- **Data Cleanup**: Automatic old data removal

## 🔍 Monitoring & Logging

- **Request Logging**: All API requests logged
- **Error Tracking**: Comprehensive error handling
- **Health Checks**: System status monitoring
- **Performance Metrics**: Response time tracking

## 📚 Documentation Standards

- **JSDoc Comments**: All public methods documented
- **Type Definitions**: Comprehensive TypeScript types
- **API Documentation**: Detailed endpoint descriptions
- **Test Coverage**: Extensive unit and integration tests

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add JSDoc comments for new methods
3. Write tests for new features
4. Update documentation as needed
5. Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License.
