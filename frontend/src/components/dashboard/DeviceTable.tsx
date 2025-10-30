import React, { useMemo, useState } from "react";
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
  const [currentPage, setCurrentPage] =
    useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = rows.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / pageSize)
  );

  const pagedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;
    return rows.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [rows, currentPage, pageSize]);

  const startItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(
    currentPage * pageSize,
    totalItems
  );

  function goToPrev() {
    setCurrentPage((p) => Math.max(1, p - 1));
  }

  function goToNext() {
    setCurrentPage((p) =>
      Math.min(totalPages, p + 1)
    );
  }

  function onPageSizeChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
  }
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
            {pagedRows.map((d) => {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Rows per page:
          </span>
          <select
            value={pageSize}
            onChange={onPageSizeChange}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 12,
              color: "#111827",
              background: "#fff",
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {startItem}-{endItem} of {totalItems}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background:
                currentPage === 1
                  ? "#f9fafb"
                  : "#fff",
              color:
                currentPage === 1
                  ? "#9ca3af"
                  : "#111827",
              cursor:
                currentPage === 1
                  ? "not-allowed"
                  : "pointer",
              fontSize: 12,
            }}
          >
            Prev
          </button>
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background:
                currentPage === totalPages
                  ? "#f9fafb"
                  : "#fff",
              color:
                currentPage === totalPages
                  ? "#9ca3af"
                  : "#111827",
              cursor:
                currentPage === totalPages
                  ? "not-allowed"
                  : "pointer",
              fontSize: 12,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
