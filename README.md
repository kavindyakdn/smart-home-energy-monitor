# 🏠 Smart Home Energy Monitor

An event-driven system to collect and visualize telemetry data from smart home devices (plugs, lights, thermostats) with a NestJS backend, React frontend, and MongoDB storage.

---

## 🚀 Tech Stack

- **Backend**: NestJS (TypeScript), Socket.IO (WebSocket)
- **Frontend**: React (TypeScript), Vite, Recharts
- **Database**: MongoDB
- **Containerization**: Docker (optional)
- **Testing**: Jest (backend)

---

## 🎯 Scenario Context & Objectives

This project demonstrates an end-to-end telemetry pipeline:

- Ingest device telemetry via REST
- Persist to MongoDB
- Stream updates over WebSocket
- Visualize in a frontend dashboard (device table and trends)

---

## 🧱 Architecture Notes

### High-level design

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Smart Devices │───▶│  Backend API (Nest)  │───▶│     MongoDB     │
│  (HTTP → REST)  │    │  + Socket.IO Gateway │    │  (Telemetry)    │
└─────────────────┘    └──────────┬───────────┘    └─────────────────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │ Frontend (UI) │
                           │  React + Vite │
                           └───────────────┘
```

### Data flow

1. Device → Backend: POST telemetry to REST endpoints
2. Backend → DB: Validate, write to MongoDB
3. Backend → Frontend: Emit `telemetry:new` via Socket.IO
4. Frontend: Fetch devices/stats via REST and subscribe to WebSocket

### Key decisions & trade-offs

- Simple REST ingest with throttling for safety over complex streaming ingestion
- Socket.IO for broad browser compatibility vs native WebSocket
- MongoDB chosen for schemaless telemetry flexibility; indexing recommended for scale

---

## 🚀 Setup & Run

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm

### Environment variables

- Backend (`backend/.env`):
  - `MONGO_URI` (e.g., `mongodb://localhost:27017/smart-home-energy`)
  - `PORT` (default 3000)
  - `NODE_ENV` (`development` | `production`)
- Frontend (Vite `frontend/.env.local`):
  - `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`)
  - `VITE_WS_BASE_URL` (default `http://localhost:3000`)

### Non-Docker (local)

```bash
# 1) Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2) Start backend (http://localhost:3000, API under /api/v1)
cd ../backend
npm run start:dev

# 3) Start frontend (http://localhost:5173)
cd ../frontend
npm run dev
```

Ensure MongoDB is running and `MONGO_URI` is set.

### Docker (optional)

This repo does not include Docker files by default. Example `docker-compose.yml`:

```yaml
version: "3.8"
services:
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    environment:
      - MONGO_URI=mongodb://mongo:27017/smart-home-energy
      - NODE_ENV=production
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    environment:
      - VITE_API_BASE_URL=http://localhost:3000/api/v1
      - VITE_WS_BASE_URL=http://localhost:3000
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Run with:

```bash
docker compose up --build
```

---

## 📡 API Reference

### Base URL

```
http://localhost:3000/api/v1
```

### Devices

- `GET /devices` — list devices
- `GET /devices/:deviceId` — get device by id
- `POST /devices` — create device
- `PATCH /devices/:deviceId` — update device
- `DELETE /devices/:deviceId` — delete device

### Telemetry

- `GET /telemetry?deviceId&startTime&endTime` — query telemetry
- `GET /telemetry/devices/:deviceId/stats?hours=24` — aggregated stats
- `POST /telemetry/ingest` — single ingest
- `POST /telemetry/ingest/batch` — batch ingest
- `POST /telemetry/ingest/legacy` — accepts single or batch shape
- `POST /telemetry/cleanup?daysToKeep=30` — delete old records

### Health

- `GET /health` — health status

### WebSocket

- Namespace: `/telemetry`
- Event emitted by backend: `telemetry:new`

---

## 🧪 Testing

Backend tests (run in `backend/`):

```bash
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run test:cov    # coverage
```

Frontend does not include automated tests yet.

---

## 📊 Data Models (simplified)

```ts
// Device
{
  deviceId: string,
  name?: string,
  type?: string,
  category?: string,
  room?: string,
  ratedWattage?: number,
}

// Telemetry
{
  deviceId: string,
  category: string,
  value: number,
  status: string | boolean,
  timestamp: string | Date,
}
```

---

## 🔧 Development

### Project structure

```
smart-home-energy-monitor/
├─ backend/                 # NestJS API server (throttling, MongoDB)
│  ├─ src/
│  │  ├─ devices/
│  │  ├─ telemetry/         # REST + Socket.IO gateway (namespace /telemetry)
│  │  └─ health/
│  └─ test/
└─ frontend/                # React (Vite), charts & tables
   └─ src/
      ├─ lib/api.ts         # REST client
      ├─ lib/socket.ts      # WebSocket client
      └─ config.ts          # Vite envs
```

### Standards

- TypeScript, ESLint, Prettier, Jest (backend)

---

## ⚠️ Known Limitations

- No authentication/authorization.
- No persistence of device metadata beyond basic fields.

---

## 📝 Assumptions

- Single MongoDB instance is acceptable for demo purposes.
- Client and server run on localhost during development (`5173` for UI, `3000` for API/WS).
- Basic rate limiting profiles (short/medium/long) are sufficient for ingest protection.
- The smarhome devices send the energy consumption in Watts when ingesting telementry.

---
