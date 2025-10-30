import {
  Activity,
  Power,
  Clock,
} from "lucide-react";
import "./KeyMetrics.css";

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
    <div className="km-grid">
      <div className="km-card">
        <div className="km-card-header">
          <h3 className="km-card-title">
            {primaryLabel}
          </h3>
          <Activity color="#3b82f6" />
        </div>
        <p className="km-primary">
          {primaryValue}
        </p>
        <p className="km-subtitle">
          {primarySubtitle}
        </p>
      </div>
      <div className="km-card">
        <div className="km-card-header">
          <h3 className="km-card-title">
            Active Devices
          </h3>
          <Power color="#22c55e" />
        </div>
        <p className="km-primary">
          {totalDevices}
        </p>
        <p className="km-subtitle">
          total devices
        </p>
      </div>
      <div className="km-card">
        <div className="km-card-header">
          <h3 className="km-card-title">
            Readings
          </h3>
          <Clock color="#8b5cf6" />
        </div>
        <p className="km-primary">
          {readingsCount}
        </p>
        <p className="km-subtitle">
          Data points collected
        </p>
      </div>
    </div>
  );
}
