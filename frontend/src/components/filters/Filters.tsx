import { Filter as FilterIcon } from "lucide-react";
import "./Filters.css";

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
    type?: string; // optional type to support filtering by deviceType
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
    <div className="fp-panel">
      <div className="fp-header">
        <FilterIcon />
        <h2 className="fp-title">Filters</h2>
      </div>
      <div className="fp-grid">
        <div>
          <label className="fp-label">
            Device Type
          </label>
          <select
            value={deviceType}
            onChange={(e) =>
              onChange({
                deviceType: e.target.value,
              })
            }
            className="fp-select"
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
          <label className="fp-label">Room</label>
          <select
            value={room}
            onChange={(e) =>
              onChange({ room: e.target.value })
            }
            className="fp-select"
          >
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Rooms" : r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fp-label">
            Device
          </label>
          <select
            value={
              deviceId === "all"
                ? "all"
                : devices.find(
                    (d) =>
                      (d.type ?? "all") ===
                        deviceType &&
                      d.deviceId === deviceId
                  )
                ? deviceId
                : devices.find(
                    (d) =>
                      (d.type ?? "all") ===
                      deviceType
                  )?.deviceId ?? deviceId
            }
            onChange={(e) =>
              onChange({
                deviceId: e.target.value,
              })
            }
            className="fp-select"
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
        <div className="fp-time">
          <label className="fp-label">
            Date Range
          </label>
          {/* Single visual input that holds a start and end date selector */}
          <div className="fp-datewrap">
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
              className="fp-dateinput"
            />
            <span className="fp-date-sep">
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
              className="fp-dateinput"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
