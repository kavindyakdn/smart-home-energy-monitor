import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import "./TrendChart.css";

type TrendChartProps = {
  data: Array<{
    date: string; // day of month label, e.g., "28"
    energyKWh: number; // total energy per day
  }>;
};

export function TrendChart({
  data,
}: TrendChartProps) {
  return (
    <div className="tc-card">
      <h3 className="tc-title">
        Power Usage Trend
      </h3>
      <div className="tc-chart">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
              label={{
                value: "Energy (kWh)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="energyKWh"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={true}
              name="Energy (kWh)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
