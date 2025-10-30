import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import "./RoomBreakdown.css";

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
    <div className="rb-card">
      <h3 className="rb-title">Room Breakdown</h3>
      <div className="rb-chart">
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
