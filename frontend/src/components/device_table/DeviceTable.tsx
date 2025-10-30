import React from "react";
import {
  Power,
  Lightbulb,
  Thermometer,
} from "lucide-react";
import "./DeviceTable.css";

type DeviceRow = {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  room: string;
  status: string;
  currentPower: number;
  lastUpdate: string;
};

const DEVICE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  plug: Power,
  light: Lightbulb,
  thermostat: Thermometer,
};

function getStatusColor(status: string) {
  switch (status) {
    case "on":
      return "#22c55e";
    case "off":
      return "#9ca3af";
    default:
      return "#f59e0b";
  }
}

type DeviceTableProps = {
  rows: DeviceRow[];
};

export function DeviceStatusTable({
  rows,
}: DeviceTableProps) {
  return (
    <div className="dt-card">
      <div className="dt-header">
        <h3 className="dt-title">
          Device Status
        </h3>
      </div>
      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead className="dt-thead">
            <tr>
              <th className="dt-th">Device</th>
              <th className="dt-th">Type</th>
              <th className="dt-th">Room</th>
              <th className="dt-th">Status</th>
              <th className="dt-th">
                Current Power
              </th>
              <th className="dt-th">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const Icon =
                DEVICE_ICONS[d.deviceType] ||
                Power;
              return (
                <tr
                  key={d.deviceId}
                  className="dt-row"
                >
                  <td className="dt-td">
                    <div className="dt-device">
                      <Icon />
                      <span className="dt-device-name">
                        {d.deviceName}
                      </span>
                    </div>
                  </td>
                  <td className="dt-td dt-muted">
                    {d.deviceType
                      .charAt(0)
                      .toUpperCase() +
                      d.deviceType.slice(1)}
                  </td>
                  <td className="dt-td dt-muted">
                    {d.room}
                  </td>
                  <td className="dt-td">
                    <span
                      className="dt-status"
                      style={{
                        color: getStatusColor(
                          d.status
                        ),
                      }}
                    >
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="dt-td dt-strong">
                    {Math.round(d.currentPower)} W
                  </td>
                  <td className="dt-td dt-faded">
                    {d.lastUpdate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
