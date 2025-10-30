import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getDevices,
  getTelemetry,
} from "../lib/api";
import type { Device, Telemetry } from "../types";
import { DeviceStatusTable } from "../components/dashboard/DeviceTable";
import { useTelemetryUpdates } from "../hooks/useWebSocket";

export default function RichDashboard() {
  const [devices, setDevices] = useState<
    Device[]
  >([]);
  const [readings, setReadings] = useState<
    Telemetry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    string | null
  >(null);

  // Filters
  const [deviceTypeFilter, setDeviceTypeFilter] =
    useState<string>("all");
  const [roomFilter, setRoomFilter] =
    useState<string>("all");
  const [deviceIdFilter, setDeviceIdFilter] =
    useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>(() => {
    const now = new Date();
    const start = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );
    const toLocalDate = (d: Date) => {
      const pad = (n: number) =>
        String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      return `${yyyy}-${mm}-${dd}`;
    };
    return {
      start: toLocalDate(start),
      end: toLocalDate(now),
    };
  });

  const deviceIdToDevice = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach((d) =>
      map.set(d.deviceId, d)
    );
    return map;
  }, [devices]);

  const getWindowRange = useCallback(() => {
    const toIsoStartOfDay = (
      localDate: string
    ) => {
      const [y, m, d] = localDate
        .split("-")
        .map((x) => parseInt(x, 10));
      const dt = new Date(
        y,
        m - 1,
        d,
        0,
        0,
        0,
        0
      );
      return dt.toISOString();
    };
    const toIsoEndOfDay = (localDate: string) => {
      const [y, m, d] = localDate
        .split("-")
        .map((x) => parseInt(x, 10));
      const dt = new Date(
        y,
        m - 1,
        d,
        23,
        59,
        59,
        999
      );
      return dt.toISOString();
    };
    return {
      startTime: toIsoStartOfDay(dateRange.start),
      endTime: toIsoEndOfDay(dateRange.end),
    };
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const deviceList = await getDevices();
      setDevices(deviceList);

      const { startTime, endTime } =
        getWindowRange();

      // Fetch telemetry using new unified endpoint with optional filters
      const merged = await getTelemetry({
        deviceId:
          deviceIdFilter !== "all"
            ? deviceIdFilter
            : undefined,
        deviceType:
          deviceTypeFilter !== "all"
            ? deviceTypeFilter
            : undefined,
        room:
          roomFilter !== "all"
            ? roomFilter
            : undefined,
        startTime,
        endTime,
      }).catch(() => [] as Telemetry[]);
      merged.sort(
        (a, b) =>
          new Date(a.timestamp as any).getTime() -
          new Date(b.timestamp as any).getTime()
      );
      setReadings(merged);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  }, [
    getWindowRange,
    deviceIdFilter,
    deviceTypeFilter,
    roomFilter,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when date range or selected device changes
  useEffect(() => {
    fetchData();
  }, [dateRange, deviceIdFilter, fetchData]);

  // Live updates via WebSocket: append incoming telemetry updates
  useTelemetryUpdates(
    (update) => {
      // Normalize to Telemetry shape used here
      const newReading = {
        deviceId: update.deviceId,
        category: update.category,
        value: update.value,
        // Assume status on when value > 0 if not explicitly provided
        status:
          (update as any).status ??
          update.value > 0,
        timestamp: new Date(
          update.timestamp as any
        ).toISOString(),
      } as Telemetry;

      setReadings((prev) => [
        ...prev,
        newReading,
      ]);
    },
    { autoConnect: true }
  );

  // Derive enriched readings with device info and filters
  const enriched = useMemo(() => {
    return readings
      .map((r) => {
        const d = deviceIdToDevice.get(
          r.deviceId
        );
        return {
          deviceId: r.deviceId,
          timestamp: new Date(
            r.timestamp as any
          ).toISOString(),
          value: r.value ?? 0,
          status: r.status ? "on" : "off",
          deviceType: d?.type ?? "unknown",
          deviceName: d?.name ?? r.deviceId,
          room: d?.room ?? "Unknown",
        };
      })
      .filter((x) =>
        deviceTypeFilter === "all"
          ? true
          : x.deviceType === deviceTypeFilter
      )
      .filter((x) =>
        roomFilter === "all"
          ? true
          : x.room === roomFilter
      )
      .filter((x) =>
        deviceIdFilter === "all"
          ? true
          : x.deviceId === deviceIdFilter
      );
  }, [
    readings,
    deviceIdToDevice,
    deviceTypeFilter,
    roomFilter,
  ]);

  // Device stats (aggregate per device)
  const deviceStats = useMemo(() => {
    const map = new Map<
      string,
      {
        deviceId: string;
        deviceName: string;
        deviceType: string;
        room: string;
        status: string;
        lastUpdate: string;
        totalPower: number;
      }
    >();

    enriched.forEach((r) => {
      if (!map.has(r.deviceId)) {
        map.set(r.deviceId, {
          deviceId: r.deviceId,
          deviceName: r.deviceName,
          deviceType: r.deviceType,
          room: r.room,
          status: r.status,
          lastUpdate: r.timestamp,
          totalPower: 0,
        });
      }
      const stats = map.get(r.deviceId)!;
      stats.totalPower += r.value || 0;
      if (
        new Date(r.timestamp) >
        new Date(stats.lastUpdate)
      ) {
        stats.status = r.status;
        stats.lastUpdate = r.timestamp;
      }
    });

    return Array.from(map.values());
  }, [enriched]);

  // Build table rows: base from devices, overlay telemetry stats
  const deviceTableRows = useMemo(() => {
    const filteredDevices = devices.filter(
      (d) =>
        (deviceTypeFilter === "all" ||
          d.type === deviceTypeFilter) &&
        (roomFilter === "all" ||
          (d.room || "Unknown") === roomFilter) &&
        (deviceIdFilter === "all" ||
          d.deviceId === deviceIdFilter)
    );

    const statsById = new Map(
      deviceStats.map(
        (s) => [s.deviceId, s] as const
      )
    );

    return filteredDevices.map((d) => {
      const s = statsById.get(d.deviceId);
      return {
        deviceId: d.deviceId,
        deviceName: d.name || d.deviceId,
        deviceType: d.type,
        room: d.room || "Unknown",
        status: s?.status || "off",
        totalPower: s?.totalPower || 0,
        lastUpdate: s?.lastUpdate || "-",
      };
    });
  }, [
    devices,
    deviceStats,
    deviceTypeFilter,
    roomFilter,
  ]);

  const formatRelativeTime = (iso: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(iso).getTime()) /
        1000
    );
    if (!iso || iso === "-") return "-";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && readings.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#4b5563",
          }}
        >
          <RefreshCw className="w-12 h-12" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
      }}
    >
      {error && (
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle color="#ef4444" />
            <p style={{ color: "#991b1b" }}>
              {error}
            </p>
          </div>
        </div>
      )}

      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "24px 16px",
        }}
      >
        <DeviceStatusTable
          rows={deviceTableRows.map((r) => ({
            ...r,
            lastUpdate:
              r.lastUpdate === "-"
                ? r.lastUpdate
                : formatRelativeTime(
                    r.lastUpdate
                  ),
          }))}
        />
      </main>
    </div>
  );
}
