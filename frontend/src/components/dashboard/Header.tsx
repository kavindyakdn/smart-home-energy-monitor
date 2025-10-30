import { Activity, Clock } from "lucide-react";

type HeaderProps = {
  lastUpdatedLabel: string;
};

export function DashboardHeader({
  lastUpdatedLabel,
}: HeaderProps) {
  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Activity />
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Smart Home Energy Monitor
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                Real-time power usage tracking
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#4b5563",
              }}
            >
              <Clock />
              <span>{lastUpdatedLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
