import {
  Power,
  Lightbulb,
  Thermometer,
} from "lucide-react";

type DeviceRow = {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  room: string;
  status: string;
  totalPower: number; // in Watts
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
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Device Status
        </h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%" }}>
          <thead
            style={{ background: "#f9fafb" }}
          >
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Device
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Type
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Room
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Total Power
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 24px",
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
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
                  style={{
                    borderBottom:
                      "1px solid #f3f4f6",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Icon />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {d.deviceName}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      color: "#4b5563",
                      fontSize: 14,
                    }}
                  >
                    {d.deviceType
                      .charAt(0)
                      .toUpperCase() +
                      d.deviceType.slice(1)}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      color: "#4b5563",
                      fontSize: 14,
                    }}
                  >
                    {d.room}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: getStatusColor(
                          d.status
                        ),
                      }}
                    >
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      color: "#111827",
                      fontSize: 14,
                    }}
                  >
                    {(
                      d.totalPower / 1000
                    ).toFixed(2)}{" "}
                    kWh
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
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
