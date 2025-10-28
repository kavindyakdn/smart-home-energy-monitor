# Smart Home Energy Monitor - Postman Test Collections

This directory contains comprehensive Postman test collections for the Smart Home Energy Monitor APIs.

## Available Collections

### 1. Device APIs (`Device-APIs.postman_collection.json`)

Test cases for device management operations:

- **Create Device** - POST `/devices`
- **Get All Devices** - GET `/devices`
- **Get Device by ID** - GET `/devices/:deviceId`
- **Update Device** - PATCH `/devices/:deviceId`
- **Delete Device** - DELETE `/devices/:deviceId`

### 2. Telemetry APIs (`Telemetry-APIs.postman_collection.json`)

Test cases for telemetry data operations:

- **Single Telemetry Ingestion** - POST `/telemetry/ingest`
- **Batch Telemetry Ingestion** - POST `/telemetry/ingest/batch`
- **Get Telemetry Readings** - GET `/telemetry/readings`
- **Get Device Statistics** - GET `/telemetry/devices/:deviceId/stats`
- **Data Cleanup** - POST `/telemetry/cleanup`
- **Legacy Endpoints** - POST `/telemetry/ingest/legacy`

## Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Device-APIs.postman_collection.json` file
4. The collection will be imported with all test cases

### 2. Configure Environment Variables

The collection uses the following variables:

- `baseUrl`: Set to `http://localhost:3000` (default)
- `deviceId`: Automatically set when creating devices (used for subsequent tests)

### 3. Start the Backend Server

Make sure your NestJS backend is running on port 3000:

```bash
cd backend
npm run start:dev
```

## Test Categories

### 1. Device Management

Basic CRUD operations with comprehensive test cases:

- **Create Device**: Tests with full data, minimal data, and validation
- **Get All Devices**: Verifies array response and data structure
- **Get Device by ID**: Tests successful retrieval and 404 handling
- **Update Device**: Tests full updates, partial updates, and validation
- **Delete Device**: Tests successful deletion and 404 handling

### 2. Device Types & Categories

Tests for different device categories:

- **Power Category**: Appliances, plugs, etc.
- **Lighting Category**: Lights, LED strips, etc.
- **Heating Category**: Thermostats, heaters, etc.

### 3. Edge Cases & Error Handling

Comprehensive error testing:

- Empty request bodies
- Invalid JSON
- Very long device IDs
- Special characters in names
- Negative wattage values
- Duplicate device IDs
- Non-existent device operations

## Test Features

### Automated Test Scripts

Each request includes automated test scripts that verify:

- **Status Codes**: Correct HTTP response codes
- **Response Structure**: Required fields and data types
- **Data Validation**: Field values match expectations
- **Error Handling**: Proper error messages for invalid requests

### Variable Management

- Device IDs are automatically captured and reused across tests
- Base URL is configurable via collection variables
- Tests can be run independently or as part of the full collection

## Running Tests

### Individual Tests

1. Select any request in the collection
2. Click "Send" to run the test
3. View test results in the "Test Results" tab

### Collection Runner

1. Click the collection name
2. Click "Run" to open the Collection Runner
3. Select which tests to run
4. Click "Start Test" to run all selected tests

### Newman (Command Line)

You can also run the collection using Newman:

```bash
# Install Newman globally
npm install -g newman

# Run the collection
newman run Device-APIs.postman_collection.json

# Run with environment variables
newman run Device-APIs.postman_collection.json -e environment.json
```

## Expected Test Results

### Successful Tests

- **201**: Device created successfully
- **200**: Device retrieved, updated, or deleted successfully

### Error Tests

- **400**: Bad request (validation errors, malformed JSON)
- **404**: Device not found
- **409**: Conflict (duplicate device ID)

## Device Schema

The API expects devices with the following structure:

```json
{
  "deviceId": "string (required, unique)",
  "name": "string (required)",
  "type": "string (required)",
  "category": "string (required)",
  "room": "string (optional)",
  "ratedWattage": "number (optional)"
}
```

### Valid Categories

- `power`: For power-consuming devices
- `lighting`: For lighting devices
- `heating`: For heating/cooling devices

### Valid Types

- `plug`: Smart plugs
- `light`: Lighting devices
- `thermostat`: Temperature control
- `appliance`: General appliances

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the backend server is running on port 3000
2. **404 Errors**: Check that the device ID exists in the database
3. **Validation Errors**: Verify request body matches the expected schema
4. **Test Failures**: Check the Test Results tab for specific failure reasons

### Database Reset

If you need to reset the database between test runs:

1. Stop the backend server
2. Clear your MongoDB database
3. Restart the backend server
4. Run the tests again

## Contributing

To add new test cases:

1. Follow the existing naming convention
2. Include comprehensive test scripts
3. Test both success and error scenarios
4. Update this README if adding new test categories

## Telemetry API Documentation

### Endpoints Overview

#### Single Telemetry Ingestion

- **POST** `/telemetry/ingest`
- **Purpose**: Ingest a single telemetry record
- **Body**: `CreateTelemetryDto`
- **Response**: Created telemetry record with `_id`

#### Batch Telemetry Ingestion

- **POST** `/telemetry/ingest/batch`
- **Purpose**: Ingest multiple telemetry records
- **Body**: `BatchTelemetryDto` with array of telemetry data
- **Response**: Array of created telemetry records
- **Limit**: Maximum 1000 records per batch

#### Get Telemetry Readings

- **GET** `/telemetry/devices/:deviceId/readings`
- **Purpose**: Retrieve telemetry data for a specific device with optional filtering
- **Path Parameters**: `deviceId` (required)
- **Query Parameters**:
  - `startTime` (optional): Start of time range (ISO string)
  - `endTime` (optional): End of time range (ISO string)
  - `limit` (optional): Maximum records to return (default: 100, max: 1000)

#### Get Device Statistics

- **GET** `/telemetry/devices/:deviceId/stats`
- **Purpose**: Get aggregated statistics for a device
- **Path Parameters**: `deviceId` (required)
- **Query Parameters**:
  - `hours` (optional): Time range in hours (default: 24, max: 168)
- **Response**: Statistics grouped by category with count, average, min, max, and last reading

#### Data Cleanup

- **POST** `/telemetry/cleanup`
- **Purpose**: Delete old telemetry data (admin endpoint)
- **Query Parameters**:
  - `daysToKeep` (optional): Days of data to retain (default: 30, max: 365)
- **Response**: Cleanup summary with deleted count

#### Legacy Endpoints

- **POST** `/telemetry/ingest/legacy`
- **Purpose**: Backward compatibility for existing clients
- **Body**: Auto-detects single vs batch requests
- **Response**: Same as respective single/batch endpoints

### Telemetry Schema

```json
{
  "deviceId": "string (required, alphanumeric + underscore/hyphen)",
  "category": "string (required, valid categories)",
  "value": "number (required, -1M to 1M range)",
  "status": "boolean (required)",
  "timestamp": "string (required, ISO date string)"
}
```

### Valid Categories

- `power`: Power consumption data
- `lighting`: Light intensity/brightness
- `temperature`: Temperature readings
- `humidity`: Humidity levels
- `motion`: Motion detection
- `door`: Door/window sensors
- `window`: Window sensors

### Validation Rules

#### Device ID

- Must be alphanumeric with underscores and hyphens only
- No special characters or spaces allowed
- Examples: `LIVING_ROOM_PLUG_01`, `BEDROOM-SENSOR-01`

#### Value Range

- Must be between -1,000,000 and 1,000,000
- Supports negative values for certain metrics
- Examples: Power consumption (watts), temperature (°C), humidity (%)

#### Timestamp

- Must be valid ISO date string
- Cannot be more than 1 year in the past or future
- Examples: `2024-01-15T10:30:00Z`, `2024-01-15T10:30:00.000Z`

#### Batch Limits

- Maximum 1000 records per batch
- Empty batches are rejected
- Each record validated individually

### Error Responses

#### 400 Bad Request

- Invalid telemetry data
- Validation failures
- Business rule violations
- Parameter range errors

#### 500 Internal Server Error

- Database connection issues
- Unexpected system errors
- Network timeouts

### Example Requests

#### Single Telemetry Ingestion

```bash
POST /telemetry/ingest
Content-Type: application/json

{
  "deviceId": "LIVING_ROOM_PLUG_01",
  "category": "power",
  "value": 150.5,
  "status": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Batch Telemetry Ingestion

```bash
POST /telemetry/ingest/batch
Content-Type: application/json

{
  "data": [
    {
      "deviceId": "DEVICE_01",
      "category": "power",
      "value": 100,
      "status": true,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "deviceId": "DEVICE_02",
      "category": "temperature",
      "value": 22.5,
      "status": true,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Device Statistics

```bash
GET /telemetry/devices/LIVING_ROOM_PLUG_01/stats?hours=24
```

#### Get Filtered Readings

```bash
GET /telemetry/devices/LIVING_ROOM_PLUG_01/readings?startTime=2025-01-29T00:00:00Z&endTime=2025-01-29T23:59:59Z&limit=50
```

## API Documentation

For more detailed API documentation, refer to the backend source code:

### Device APIs

- `backend/src/devices/devices.controller.ts`
- `backend/src/devices/dto/create-device.dto.ts`
- `backend/src/devices/schemas/device.schema.ts`

### Telemetry APIs

- `backend/src/telemetry/telemetry.controller.ts`
- `backend/src/telemetry/dto/create-telemetry.dto.ts`
- `backend/src/telemetry/dto/batch-telemetry.dto.ts`
- `backend/src/telemetry/schemas/telemetry.schema.ts`
