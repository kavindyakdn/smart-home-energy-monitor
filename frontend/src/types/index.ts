/**
 * Core TypeScript types for the Smart Home Energy Monitor frontend
 * These types mirror the backend DTOs and schemas to ensure type safety
 */

/**
 * Telemetry data point from smart home devices
 */
export interface Telemetry {
  _id?: string;
  deviceId: string;
  category: string;
  value: number;
  status: boolean;
  timestamp: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Smart home device information
 */
export interface Device {
  _id?: string;
  deviceId: string;
  name: string;
  type: string;
  category: string;
  room?: string;
  ratedWattage?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Device statistics aggregated over a time period
 */
export interface DeviceStats {
  deviceId: string;
  period: {
    start: Date;
    end: Date;
    hours: number;
  };
  totalReadings: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    averageValue: number;
  }>;
}

/**
 * Query parameters for fetching telemetry readings
 */
export interface ReadingsQueryParams {
  deviceId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * WebSocket telemetry update payload
 * Matches the payload structure from TelemetryGateway
 */
export interface TelemetryUpdate {
  deviceId: string;
  timestamp: Date | string;
  value: number;
  category: string;
}

/**
 * WebSocket connection state for UI and hooks
 */
export type SocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Filter state for the dashboard
 */
export interface DashboardFilters {
  deviceId?: string;
  category?: string;
  room?: string;
  startTime?: string;
  endTime?: string;
  timeWindow?: number; // hours
}

/**
 * Energy usage trend data point
 */
export interface EnergyTrendPoint {
  timestamp: Date | string;
  value: number;
  deviceId: string;
  category: string;
}

/**
 * Room or category breakdown data
 */
export interface BreakdownData {
  name: string; // room name or category name
  totalEnergy: number;
  deviceCount: number;
  averageValue: number;
}
