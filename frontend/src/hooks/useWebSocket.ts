/**
 * React hooks for WebSocket real-time updates
 */

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { socketService } from "../lib/socket";
import type {
  TelemetryUpdate,
  SocketConnectionState,
} from "../types";
export type { SocketConnectionState } from "../types";

/**
 * Hook to get WebSocket connection state
 * @returns Current connection state
 */
export function useWebSocketConnection(): SocketConnectionState {
  const [state, setState] =
    useState<SocketConnectionState>(
      socketService.getConnectionState()
    );

  useEffect(() => {
    const unsubscribe =
      socketService.onConnectionStateChange(
        setState
      );
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook to subscribe to real-time telemetry updates
 * @param onUpdate Callback function called when a telemetry update is received
 * @param options Configuration options
 */
export function useTelemetryUpdates(
  onUpdate: (update: TelemetryUpdate) => void,
  options?: {
    /**
     * Filter updates by device ID (optional)
     * If provided, only updates for this device will trigger the callback
     */
    deviceId?: string;
    /**
     * Filter updates by category (optional)
     * If provided, only updates for this category will trigger the callback
     */
    category?: string;
    /**
     * Auto-connect to WebSocket on mount (default: true)
     */
    autoConnect?: boolean;
  }
): void {
  const {
    deviceId,
    category,
    autoConnect = true,
  } = options || {};
  const callbackRef = useRef(onUpdate);
  const filtersRef = useRef({
    deviceId,
    category,
  });

  // Keep callback and filters up to date
  useEffect(() => {
    callbackRef.current = onUpdate;
    filtersRef.current = { deviceId, category };
  }, [onUpdate, deviceId, category]);

  useEffect(() => {
    if (autoConnect) {
      socketService.connect();
    }

    // Wrapped callback with filtering
    const wrappedCallback = (
      update: TelemetryUpdate
    ) => {
      const filters = filtersRef.current;

      // Apply filters if provided
      if (
        filters.deviceId &&
        update.deviceId !== filters.deviceId
      ) {
        return;
      }
      if (
        filters.category &&
        update.category !== filters.category
      ) {
        return;
      }

      // Call the actual callback
      callbackRef.current(update);
    };

    // Subscribe to telemetry updates
    const unsubscribe =
      socketService.subscribeToTelemetry(
        wrappedCallback
      );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [autoConnect]);
}

/**
 * Hook to manage pairs of real-time telemetry data
 * Automatically maintains a list of recent updates
 * @param options Configuration options
 * @returns Object with telemetry updates array and connection state
 */
export function useTelemetryData(options?: {
  /**
   * Maximum number of updates to keep in memory (default: 100)
   */
  maxUpdates?: number;
  /**
   * Filter by device ID
   */
  deviceId?: string;
  /**
   * Filter by category
   */
  category?: string;
  /**
   * Auto-connect to WebSocket on mount (default: true)
   */
  autoConnect?: boolean;
}): {
  updates: TelemetryUpdate[];
  connectionState: SocketConnectionState;
  clearUpdates: () => void;
} {
  const {
    maxUpdates = 100,
    deviceId,
    category,
    autoConnect = true,
  } = options || {};

  const [updates, setUpdates] = useState<
    TelemetryUpdate[]
  >([]);
  const connectionState =
    useWebSocketConnection();

  const handleUpdate = useCallback(
    (update: TelemetryUpdate) => {
      setUpdates((prev) => {
        // Filter by device ID or category if specified
        if (
          deviceId &&
          update.deviceId !== deviceId
        ) {
          return prev;
        }
        if (
          category &&
          update.category !== category
        ) {
          return prev;
        }

        // Add new update at the beginning, remove old ones if exceeding max
        const newUpdates = [update, ...prev];
        return newUpdates.slice(0, maxUpdates);
      });
    },
    [deviceId, category, maxUpdates]
  );

  useTelemetryUpdates(handleUpdate, {
    deviceId,
    category,
    autoConnect,
  });

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return {
    updates,
    connectionState,
    clearUpdates,
  };
}
