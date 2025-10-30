import {
  Activity,
  Power,
  Clock,
} from "lucide-react";

type KeyMetricsProps = {
  totalEnergyKWh?: string;
  totalPower?: string;
  totalPowerKw?: string;
  activeDevices: number;
  totalDevices: number;
  readingsCount: number;
};

export function KeyMetrics({
  totalEnergyKWh,
  totalPower,
  totalPowerKw,
  activeDevices,
  totalDevices,
  readingsCount,
}: KeyMetricsProps) {
  // Decide primary metric to show
  const primaryLabel = totalEnergyKWh
    ? "Total Energy"
    : "Total Power";
  const primaryValue = totalEnergyKWh
    ? `${totalEnergyKWh} kWh`
    : totalPower
    ? totalPower
    : totalPowerKw
    ? `${totalPowerKw} kW`
    : "-";
  const primarySubtitle = totalEnergyKWh
    ? "Total over selected window"
    : "Current window";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 24,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              color: "#4b5563",
            }}
          >
            {primaryLabel}
          </h3>
          <Activity color="#3b82f6" />
        </div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {primaryValue}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          {primarySubtitle}
        </p>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              color: "#4b5563",
            }}
          >
            Active Devices
          </h3>
          <Power color="#22c55e" />
        </div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {activeDevices}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          of {totalDevices} total devices
        </p>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              color: "#4b5563",
            }}
          >
            Readings
          </h3>
          <Clock color="#8b5cf6" />
        </div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {readingsCount}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          Data points collected
        </p>
      </div>
    </div>
  );
}
