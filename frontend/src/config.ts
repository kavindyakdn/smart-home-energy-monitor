/**
 * Application configuration
 * Loads environment variables with fallback defaults
 */

const getEnvVar = (
  key: string,
  defaultValue: string
): string => {
  return import.meta.env[key] || defaultValue;
};

/**
 * API base URL for REST endpoints
 * Defaults to backend running on port 3000
 */
export const API_BASE_URL = getEnvVar(
  "VITE_API_BASE_URL",
  "http://localhost:3000/api/v1"
);

/**
 * WebSocket server URL for real-time updates
 * Defaults to backend running nested WebSocket server
 */
export const WS_BASE_URL = getEnvVar(
  "VITE_WS_BASE_URL",
  "http://localhost:3000"
);

/**
 * WebSocket namespace for telemetry updates
 */
export const WS_NAMESPACE = "/telemetry";

/**
 * Default pagination limit for API requests
 */
export const DEFAULT_PAGE_LIMIT = 100;

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 1000;

/**
 * Default time window for energy trends (in hours)
 */
export const DEFAULT_TIME_WINDOW_HOURS = 24;
