import { Filter as FilterIcon } from "lucide-react";

type FiltersProps = {
  deviceType: string;
  deviceId: string;
  room: string;
  dateRange: { start: string; end: string };
  deviceTypes: string[];
  rooms: string[];
  devices: Array<{
    deviceId: string;
    name: string;
  }>; // minimal shape
  onChange: (next: {
    deviceType?: string;
    deviceId?: string;
    room?: string;
    dateRange?: { start: string; end: string };
  }) => void;
};

export function FiltersPanel({
  deviceType,
  deviceId,
  room,
  dateRange,
  deviceTypes,
  rooms,
  devices,
  onChange,
}: FiltersProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <FilterIcon />
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Filters
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1.5fr 2fr",
          gap: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Device Type
          </label>
          <select
            value={deviceType}
            onChange={(e) =>
              onChange({
                deviceType: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          >
            {deviceTypes.map((t) => (
              <option key={t} value={t}>
                {t === "all"
                  ? "All Devices"
                  : t.charAt(0).toUpperCase() +
                    t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Room
          </label>
          <select
            value={room}
            onChange={(e) =>
              onChange({ room: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          >
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Rooms" : r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Device
          </label>
          <select
            value={deviceId}
            onChange={(e) =>
              onChange({
                deviceId: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          >
            <option value="all">
              All Devices
            </option>
            {devices.map((d) => (
              <option
                key={d.deviceId}
                value={d.deviceId}
              >
                {d.name || d.deviceId}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            gridColumn: "span 1 / span 1",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Time Range
          </label>
          {/* Single visual input that holds a start and end date selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                onChange({
                  dateRange: {
                    start: e.target.value,
                    end: dateRange.end,
                  },
                })
              }
              style={{
                border: "none",
                outline: "none",
                padding: 0,
                fontSize: 14,
              }}
            />
            <span
              style={{
                color: "#6b7280",
                fontSize: 12,
              }}
            >
              to
            </span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                onChange({
                  dateRange: {
                    start: dateRange.start,
                    end: e.target.value,
                  },
                })
              }
              style={{
                border: "none",
                outline: "none",
                padding: 0,
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
