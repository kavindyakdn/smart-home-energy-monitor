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
 * Get telemetry readings for a specific device
 * Supports filtering by time range and pagination
 */
export async function getDeviceReadings(
  deviceId: string,
  params?: Omit<ReadingsQueryParams, "deviceId">
): Promise<Telemetry[]> {
  const queryParams = {
    startTime: params?.startTime,
    endTime: params?.endTime,
    limit: Math.min(
      params?.limit || DEFAULT_PAGE_LIMIT,
      MAX_PAGE_LIMIT
    ),
  };

  const queryString =
    buildQueryString(queryParams);
  return fetchApi<Telemetry[]>(
    `/telemetry/devices/${encodeURIComponent(
      deviceId
    )}/readings${queryString}`
  );
}

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
 * Get all recent telemetry readings across all devices
 * Note: This is a convenience function that may need backend support
 * For now, we'll fetch devices first, then readings
 */
export async function getAllReadings(
  params?: Omit<ReadingsQueryParams, "deviceId">
): Promise<Telemetry[]> {
  // First get all devices
  const devices = await getDevices();

  // Then fetch readings for each device (in parallel)
  const readingPromises = devices.map((device) =>
    getDeviceReadings(
      device.deviceId,
      params
    ).catch(() => [])
  );

  const allReadings = await Promise.all(
    readingPromises
  );

  // Flatten and sort by timestamp
  return allReadings.flat().sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending order
  });
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
