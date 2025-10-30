import React, { useMemo, useState } from "react";
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
    <div className="dt-card">
      <div className="dt-header">
        <h3 className="dt-title">Device Status</h3>
      </div>
      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead className="dt-thead">
            <tr>
              <th className="dt-th">
                Device
              </th>
              <th className="dt-th">
                Type
              </th>
              <th className="dt-th">
                Room
              </th>
              <th className="dt-th">
                Status
              </th>
              <th className="dt-th">
                Total Power
              </th>
              <th className="dt-th">
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
                <tr key={d.deviceId} className="dt-row">
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
                    <span className="dt-status" style={{ color: getStatusColor(d.status) }}>
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="dt-td dt-strong">
                    {(
                      d.totalPower / 1000
                    ).toFixed(2)}{" "}
                    kWh
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
      <div className="dt-footer">
        <div className="dt-rows">
          <span className="dt-rows-label">Rows per page:</span>
          <select
            value={pageSize}
            onChange={onPageSizeChange}
            className="dt-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="dt-range">
          {startItem}-{endItem} of {totalItems}
        </div>
        <div className="dt-pager">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className="dt-btn"
          >
            Prev
          </button>
          <span className="dt-page">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="dt-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
