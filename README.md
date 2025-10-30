# 🏠 Smart Home Energy Monitor

An event-driven system to collect and visualize telemetry data from smart home devices such as plugs, lights, and thermostats.

---

## 🚀 Tech Stack

- **Backend:** NestJS (TypeScript)
- **Frontend:** React.js (TypeScript)
- **Database:** MongoDB (NoSQL)
- **Containerization:** Docker
- **Testing:** Jest & React Testing Library

---

## 🎯 Objective

Build an end-to-end system to:

- Receive telemetry data from smart devices
- Store it in a database
- Visualize it on a real-time dashboard

---

## 🧱 Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Smart Devices │───▶│   Backend API   │───▶│   MongoDB DB    │
│   (IoT Sensors) │    │   (NestJS)      │    │   (Telemetry)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Frontend UI   │
                       │   (React.js)    │
                       └─────────────────┘
```

### Data Flow

1. **Ingestion**: Smart devices send telemetry data via HTTP POST
2. **Processing**: NestJS backend validates and stores data in MongoDB
3. **Retrieval**: Frontend queries API for real-time visualization
4. **Analytics**: Backend provides aggregated statistics and insights

---

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose

### Run with Docker (no local installs needed)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-home-energy-monitor
   ```

2. **Create environment files**

   Create `backend/.env` with:

   ```bash
   MONGO_URI=mongodb://mongo:27017/smart-home
   PORT=3000
   NODE_ENV=production
   CORS_ORIGINS=http://localhost:8080
   ```

   Create `frontend/.env` with:

   ```bash
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_WS_BASE_URL=http://localhost:3000
   ```

3. **Build and start all services**

   ```bash
   docker compose up --build -d
   ```

4. **Access the apps**

   - Backend API: http://localhost:3000
   - Frontend UI: http://localhost:8080

Docker will build images and install all dependencies for you. No local Node.js, npm, or MongoDB installation is required.

---

## 📡 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Core Endpoints

#### Device Management

- `POST /devices` - Create a new device
- `GET /devices` - List all devices
- `GET /devices/:id` - Get device details
- `PATCH /devices/:id` - Update device
- `DELETE /devices/:id` - Remove device

#### Telemetry Data

- `POST /telemetry/ingest` - Single telemetry ingestion
- `POST /telemetry/ingest/batch` - Batch telemetry ingestion
- `GET /telemetry/devices/:id/readings` - Get device readings
- `GET /telemetry/devices/:id/stats` - Get device statistics
- `POST /telemetry/cleanup` - Cleanup old data

#### System Health

- `GET /health` - System health check

### Rate Limiting

The API implements tiered rate limiting:

- **Short-term**: 10 requests/second
- **Medium-term**: 50 requests/10 seconds
- **Long-term**: 200 requests/minute

---

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Postman Collections

Comprehensive API testing collections are available in `backend/postman/`:

- Device APIs collection
- Telemetry APIs collection

See `backend/postman/README.md` for detailed testing instructions.

---

## 📊 Data Models

### Device Schema

```typescript
{
  deviceId: string;      // Unique identifier
  name: string;         // Human-readable name
  type: string;         // Device type (plug, light, thermostat)
  category: string;      // Category (power, lighting, heating)
  room?: string;        // Location
  ratedWattage?: number; // Power rating
}
```

### Telemetry Schema

```typescript
{
  deviceId: string; // Reference to device
  category: string; // Data category
  value: number; // Measured value (-1M to 1M)
  status: boolean; // Device status
  timestamp: Date; // Measurement time
}
```

---

## 🔧 Development

### Project Structure

```
smart-home-energy-monitor/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── devices/        # Device management module
│   │   ├── telemetry/      # Telemetry data module
│   │   ├── health/         # Health check module
│   │   └── common/         # Shared utilities
│   ├── postman/           # API test collections
│   └── test/              # Test files
├── frontend/              # React frontend (to be implemented)
└── docs/                  # Additional documentation
```

### Code Standards

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Jest** for unit testing
- **JSDoc** for code documentation
- **Conventional Commits** for git messages

---

## 🚀 Deployment

### Docker Support

```bash
# Build and run with Docker
docker compose up --build -d
```

### Environment Variables

Required environment variables:

- `MONGO_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

---

## 📈 Performance Considerations

- **Rate Limiting**: Prevents API abuse
- **Data Cleanup**: Automatic old data removal
- **Batch Processing**: Efficient bulk data ingestion
- **Indexing**: Optimized MongoDB queries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow code standards
4. Add tests for new features
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For questions or issues:

- Create an issue in the repository
- Check the API documentation in `backend/postman/README.md`
- Review test cases for usage examples
