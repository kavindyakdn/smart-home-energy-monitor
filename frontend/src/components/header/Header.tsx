import { Activity, Clock } from "lucide-react";
import "./Header.css";

type HeaderProps = {
  lastUpdatedLabel: string;
};

export function DashboardHeader({
  lastUpdatedLabel,
}: HeaderProps) {
  return (
    <header className="dh-header">
      <div className="dh-container">
        <div className="dh-row">
          <div className="dh-left">
            <Activity />
            <div>
              <h1 className="dh-title">
                Smart Home Energy Monitor
              </h1>
              <p className="dh-subtitle">
                Real-time power usage tracking
              </p>
            </div>
          </div>
          <div className="dh-right">
            <div className="dh-updated">
              <Clock />
              <span>{lastUpdatedLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
