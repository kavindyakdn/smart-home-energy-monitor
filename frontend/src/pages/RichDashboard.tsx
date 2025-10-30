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
import { TrendChart } from "../components/trend_chart/TrendChart";
import { DeviceStatusTable } from "../components/device_table/DeviceTable";
import "./RichDashboard.css";
import {
  WS_BASE_URL,
  WS_NAMESPACE,
} from "../config";

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

      const merged = await getTelemetry({
        deviceId:
          deviceIdFilter !== "all"
            ? deviceIdFilter
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
  }, [getWindowRange, deviceIdFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [dateRange, deviceIdFilter, fetchData]);

  useEffect(() => {
    const socket = io(
      `${WS_BASE_URL}${WS_NAMESPACE}`,
      {
        withCredentials: true,
        transports: ["websocket"],
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

    socket.on("connect", () => {});
    socket.on("telemetry:new", onNewTelemetry);

    return () => {
      socket.off("telemetry:new", onNewTelemetry);
      socket.disconnect();
    };
  }, []);

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
        deviceIdFilter === "all"
          ? true
          : x.deviceId === deviceIdFilter
      );
  }, [
    readings,
    deviceIdToDevice,
    deviceIdFilter,
  ]);

  // Daily energy aggregation (kWh) over selected date range
  const dailyEnergyData = useMemo(() => {
    if (!enriched.length) {
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

  // (removed unused totalPower aggregation)

  // Build table rows: one row per telemetry reading (already filtered via enriched)
  const deviceTableRows = useMemo(() => {
    const rows = enriched.map((r) => ({
      deviceId: r.deviceId,
      deviceName: r.deviceName,
      deviceType: r.deviceType,
      room: r.room,
      status: r.status,
      currentPower: r.value || 0,
      lastUpdate: r.timestamp,
    }));

    rows.sort(
      (a, b) =>
        new Date(b.lastUpdate).getTime() -
        new Date(a.lastUpdate).getTime()
    );

    return rows;
  }, [enriched]);

  // Removed unused rooms and deviceTypes lists

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
          deviceType={"all"}
          deviceId={deviceIdFilter}
          dateRange={dateRange}
          devices={devices.map((d) => ({
            deviceId: d.deviceId,
            name: d.name || d.deviceId,
          }))}
          onChange={(next) => {
            if (next.deviceId !== undefined)
              setDeviceIdFilter(next.deviceId);
            if (next.dateRange !== undefined)
              setDateRange(next.dateRange);
          }}
        />

        <div className="rd-grid">
          <TrendChart data={dailyEnergyData} />
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
