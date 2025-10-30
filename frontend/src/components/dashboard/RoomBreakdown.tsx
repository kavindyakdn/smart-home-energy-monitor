import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

type RoomBreakdownItem = {
  room: string;
  power: number;
};

type RoomBreakdownProps = {
  data: RoomBreakdownItem[];
  colors: string[];
};

export function RoomBreakdownChart({
  data,
  colors,
}: RoomBreakdownProps) {
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
        Room Breakdown
      </h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ room, percent }: any) =>
                `${room} ${(
                  percent * 100
                ).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="power"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    colors[index % colors.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
