import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export const PerformanceChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        {/* Grid tipis agar tidak mengganggu pandangan */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e293b"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(str) => str.split("-").slice(1).join("/")} // Format MM/DD
          dy={10}
        />

        <YAxis
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => `${val}%`}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          itemStyle={{ padding: "2px 0" }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          wrapperStyle={{
            paddingBottom: "20px",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        />

        {/* Garis Utama: System (Oracle) */}
        <Line
          type="monotone"
          dataKey="system_roi"
          name="Oracle Quant"
          stroke="#22d3ee"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />

        {/* Garis Benchmark 1: BTC */}
        <Line
          type="monotone"
          dataKey="btc_roi"
          name="BTC Benchmark"
          stroke="#fb923c"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />

        {/* Garis Benchmark 2: S&P 500 */}
        <Line
          type="monotone"
          dataKey="spx_roi"
          name="S&P 500"
          stroke="#64748b"
          strokeWidth={1}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
