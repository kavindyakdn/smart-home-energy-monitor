import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getDevices,
  getTelemetry,
} from "../lib/api";
import type { Device, Telemetry } from "../types";
import { DashboardHeader } from "../components/header/Header";
import { FiltersPanel } from "../components/filters/Filters";
import { KeyMetrics } from "../components/key_metrics/KeyMetrics";
import { TrendChart } from "../components/trend_chart/TrendChart";
import { RoomBreakdownChart } from "../components/room_breakdown/RoomBreakdown";
import { DeviceStatusTable } from "../components/device_table/DeviceTable";
import "./RichDashboard.css";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

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
  const [lastUpdate, setLastUpdate] =
    useState<Date>(new Date());

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
      // Sort asc by timestamp for integration
      merged.sort(
        (a, b) =>
          new Date(a.timestamp as any).getTime() -
          new Date(b.timestamp as any).getTime()
      );
      setReadings(merged);
      setLastUpdate(new Date());
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

  // WebSocket: subscribe to real-time telemetry updates
  useEffect(() => {
    const socket = io(
      "http://localhost:3000/telemetry",
      {
        withCredentials: true,
      }
    );

    const onNewTelemetry = (payload: any) => {
      const next = {
        deviceId: String(
          payload?.deviceId ?? "unknown"
        ),
        timestamp:
          payload?.timestamp ??
          new Date().toISOString(),
        value: Number(payload?.value ?? 0),
        status: payload?.status,
      } as Telemetry;
      setReadings((prev) => [...prev, next]);
      setLastUpdate(new Date());
    };

    socket.on("connect", () => {
      // Optional: console.log("WS connected", socket.id);
    });
    socket.on("telemetry:new", onNewTelemetry);

    return () => {
      socket.off("telemetry:new", onNewTelemetry);
      socket.disconnect();
    };
  }, []);

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

  // Compute total energy (kWh) over window by integrating per device
  const totalEnergyKWh = useMemo(() => {
    const { startTime, endTime } =
      getWindowRange();
    const windowStart = new Date(
      startTime
    ).getTime();
    const windowEnd = new Date(endTime).getTime();

    const computeEnergyWh = (
      startMs: number,
      endMs: number
    ) => {
      const byDevice = new Map<
        string,
        { t: number; v: number }[]
      >();
      enriched.forEach((r) => {
        const t = new Date(r.timestamp).getTime();
        if (t < startMs || t > endMs) return;
        const arr =
          byDevice.get(r.deviceId) || [];
        arr.push({ t, v: r.value });
        byDevice.set(r.deviceId, arr);
      });
      let totalWhLocal = 0;
      byDevice.forEach((arr) => {
        if (arr.length === 0) return;
        arr.sort((a, b) => a.t - b.t);
        for (let i = 0; i < arr.length; i++) {
          const current = arr[i];
          const nextT =
            i < arr.length - 1
              ? arr[i + 1].t
              : endMs;
          const fromT = Math.max(
            current.t,
            startMs
          );
          const toT = Math.min(nextT, endMs);
          if (toT > fromT) {
            const hours =
              (toT - fromT) / (1000 * 60 * 60);
            totalWhLocal += current.v * hours;
          }
        }
      });
      return totalWhLocal;
    };

    const totalWh = computeEnergyWh(
      windowStart,
      windowEnd
    );
    return (totalWh / 1000).toFixed(2);
  }, [enriched, getWindowRange]);

  // (removed legacy per-reading chart data)

  // Daily energy aggregation (kWh) over selected date range
  const dailyEnergyData = useMemo(() => {
    if (!enriched.length) {
      // Build empty range based on selected dates so x-axis still shows days
      const buildEmpty = () => {
        const result: {
          date: string;
          energyKWh: number;
        }[] = [];
        const [ys, ms, ds] = dateRange.start
          .split("-")
          .map((x) => parseInt(x, 10));
        const [ye, me, de] = dateRange.end
          .split("-")
          .map((x) => parseInt(x, 10));
        const cur = new Date(
          ys,
          ms - 1,
          ds,
          0,
          0,
          0,
          0
        );
        const end = new Date(
          ye,
          me - 1,
          de,
          0,
          0,
          0,
          0
        );
        while (cur.getTime() <= end.getTime()) {
          result.push({
            date: String(cur.getDate()),
            energyKWh: 0,
          });
          cur.setDate(cur.getDate() + 1);
        }
        return result;
      };
      return buildEmpty();
    }

    // Shared integrator to ensure identical logic with total
    const computeEnergyWh = (
      startMs: number,
      endMs: number
    ) => {
      const byDevice = new Map<
        string,
        { t: number; v: number }[]
      >();
      enriched.forEach((r) => {
        const t = new Date(r.timestamp).getTime();
        if (t < startMs || t > endMs) return;
        const arr =
          byDevice.get(r.deviceId) || [];
        arr.push({ t, v: r.value });
        byDevice.set(r.deviceId, arr);
      });
      let totalWhLocal = 0;
      byDevice.forEach((arr) => {
        if (arr.length === 0) return;
        arr.sort((a, b) => a.t - b.t);
        for (let i = 0; i < arr.length; i++) {
          const current = arr[i];
          const nextT =
            i < arr.length - 1
              ? arr[i + 1].t
              : endMs;
          const fromT = Math.max(
            current.t,
            startMs
          );
          const toT = Math.min(nextT, endMs);
          if (toT > fromT) {
            const hours =
              (toT - fromT) / (1000 * 60 * 60);
            totalWhLocal += current.v * hours;
          }
        }
      });
      return totalWhLocal;
    };

    const startParts = dateRange.start
      .split("-")
      .map((x) => parseInt(x, 10));
    const endParts = dateRange.end
      .split("-")
      .map((x) => parseInt(x, 10));
    const current = new Date(
      startParts[0],
      startParts[1] - 1,
      startParts[2],
      0,
      0,
      0,
      0
    );
    const last = new Date(
      endParts[0],
      endParts[1] - 1,
      endParts[2],
      0,
      0,
      0,
      0
    );

    const out: {
      date: string;
      energyKWh: number;
    }[] = [];

    while (current.getTime() <= last.getTime()) {
      const dayStart = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        0,
        0,
        0,
        0
      ).getTime();
      const dayEnd = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        23,
        59,
        59,
        999
      ).getTime();

      const totalWh = computeEnergyWh(
        dayStart,
        dayEnd
      );
      out.push({
        date: String(current.getDate()),
        energyKWh: totalWh / 1000,
      });
      current.setDate(current.getDate() + 1);
    }

    return out;
  }, [enriched, dateRange]);

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

    console.log(map);
    console.log(Array.from(map.values()));

    return Array.from(map.values());
  }, [enriched]);

  // Room breakdown
  const roomBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    enriched.forEach((r) => {
      map.set(
        r.room,
        (map.get(r.room) || 0) + (r.value || 0)
      );
    });
    return Array.from(map.entries()).map(
      ([room, power]) => ({ room, power })
    );
  }, [enriched]);

  // (removed unused totalPower aggregation)

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

  const rooms = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          devices.map((d) => d.room || "Unknown")
        )
      ),
    ],
    [devices]
  );
  const deviceTypes = [
    "all",
    "plug",
    "light",
    "thermostat",
  ];

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
      <div className="rd-loading">
        <div className="rd-loading-inner">
          <RefreshCw className="w-12 h-12" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-dashboard">
      <DashboardHeader
        lastUpdatedLabel={`Updated ${formatRelativeTime(
          lastUpdate.toISOString()
        )}`}
      />

      {error && (
        <div className="rd-error-container">
          <div className="rd-error-box">
            <AlertCircle color="#ef4444" />
            <p className="rd-error-text">
              {error}
            </p>
          </div>
        </div>
      )}

      <main className="rd-main">
        <FiltersPanel
          deviceType={deviceTypeFilter}
          deviceId={deviceIdFilter}
          room={roomFilter}
          dateRange={dateRange}
          deviceTypes={deviceTypes}
          rooms={rooms}
          devices={devices.map((d) => ({
            deviceId: d.deviceId,
            name: d.name || d.deviceId,
          }))}
          onChange={(next) => {
            if (next.deviceType !== undefined)
              setDeviceTypeFilter(
                next.deviceType
              );
            if (next.room !== undefined)
              setRoomFilter(next.room);
            if (next.deviceId !== undefined)
              setDeviceIdFilter(next.deviceId);
            if (next.dateRange !== undefined)
              setDateRange(next.dateRange);
          }}
        />

        <KeyMetrics
          totalEnergyKWh={totalEnergyKWh}
          activeDevices={devices.length}
          totalDevices={deviceStats.length}
          readingsCount={enriched.length}
        />

        <div className="rd-grid">
          <TrendChart data={dailyEnergyData} />
        </div>
        <div className="rd-grid">
          <RoomBreakdownChart
            data={roomBreakdown}
            colors={COLORS}
          />
        </div>

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
