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

type TrendChartProps = {
  data: Array<{
    time: string;
    power: number;
    device: string;
  }>;
};

export function TrendChart({
  data,
}: TrendChartProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#111827",
          marginBottom: 12,
        }}
      >
        Power Usage Trend
      </h3>
      <div style={{ width: "100%", height: 300 }}>
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
              dataKey="time"
              stroke="#6b7280"
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: 12 }}
              label={{
                value: "Power (W)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="power"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Power (W)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
