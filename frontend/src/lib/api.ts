/**
 * API client for communicating with the backend
 * Provides type-safe functions for all REST endpoints
 */

import {
  API_BASE_URL,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "../config";
import type {
  Telemetry,
  Device,
  DeviceStats,
  ReadingsQueryParams,
  ApiError,
} from "../types";

/**
 * Custom API error class
 */
export class ApiClientError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(
    statusCode: number,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let apiError: ApiError | null = null;

      try {
        apiError = await response.json();
        if (apiError) {
          errorMessage =
            typeof apiError.message === "string"
              ? apiError.message
              : apiError.message?.join(", ") ||
                errorMessage;
        }
      } catch {
        // If JSON parsing fails, use default error message
      }

      throw new ApiClientError(
        response.status,
        errorMessage,
        apiError
      );
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new ApiClientError(
        0,
        "Network error: Could not connect to the server",
        error
      );
    }

    throw new ApiClientError(
      500,
      error instanceof Error
        ? error.message
        : "Unknown error occurred",
      error
    );
  }
}

/**
 * Build query string from parameters
 */
function buildQueryString(
  params: Record<string, unknown>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(key, String(value));
      }
    }
  );

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * DEVICES API
 */

/**
 * Get all registered devices
 */
export async function getDevices(): Promise<
  Device[]
> {
  return fetchApi<Device[]>("/devices");
}

/**
 * Get a specific device by ID
 */
export async function getDevice(
  deviceId: string
): Promise<Device> {
  return fetchApi<Device>(
    `/devices/${encodeURIComponent(deviceId)}`
  );
}

/**
 * Create a new device
 */
export async function createDevice(
  device: Omit<
    Device,
    "_id" | "createdAt" | "updatedAt"
  >
): Promise<Device> {
  return fetchApi<Device>("/devices", {
    method: "POST",
    body: JSON.stringify(device),
  });
}

/**
 * Update an existing device
 */
export async function updateDevice(
  deviceId: string,
  updates: Partial<
    Omit<
      Device,
      | "_id"
      | "deviceId"
      | "createdAt"
      | "updatedAt"
    >
  >
): Promise<Device> {
  return fetchApi<Device>(
    `/devices/${encodeURIComponent(deviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * Delete a device
 */
export async function deleteDevice(
  deviceId: string
): Promise<void> {
  return fetchApi<void>(
    `/devices/${encodeURIComponent(deviceId)}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * TELEMETRY API
 */

/**
 * Get aggregated statistics for a device over a time period
 */
export async function getDeviceStats(
  deviceId: string,
  hours: number = 24
): Promise<DeviceStats> {
  const queryString = buildQueryString({ hours });
  return fetchApi<DeviceStats>(
    `/telemetry/devices/${encodeURIComponent(
      deviceId
    )}/stats${queryString}`
  );
}

/**
 * Get telemetry with optional filters
 * Filters: deviceId, deviceType, room, startTime, endTime
 */
export async function getTelemetry(params?: {
  deviceId?: string;
  deviceType?: string;
  room?: string;
  startTime?: string | Date;
  endTime?: string | Date;
}): Promise<Telemetry[]> {
  const {
    deviceId,
    deviceType,
    room,
    startTime,
    endTime,
  } = params || {};

  const normalizedParams = {
    deviceId,
    deviceType,
    room,
    startTime:
      startTime instanceof Date
        ? startTime.toISOString()
        : startTime,
    endTime:
      endTime instanceof Date
        ? endTime.toISOString()
        : endTime,
  };

  const queryString = buildQueryString(
    normalizedParams
  );
  return fetchApi<Telemetry[]>(
    `/telemetry${queryString}`
  );
}
/**
 * HEALTH CHECK API
 */

/**
 * Check if the backend API is healthy
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
}> {
  return fetchApi("/health");
}
