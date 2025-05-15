import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LanguageChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export default function LanguageChart({ data }: LanguageChartProps) {
  return (
    <ChartContainer
      config={{
        value: {
          label: "Lines of Code",
          theme: {
            light: "#3b82f6",
            dark: "#60a5fa",
          },
        },
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <defs>
            <linearGradient id="languageAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            stroke="#aaa" 
            tick={{ fill: '#aaa' }}
            axisLine={{ stroke: '#444' }}
          />
          <YAxis 
            stroke="#aaa" 
            tick={{ fill: '#aaa' }}
            axisLine={{ stroke: '#444' }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.3} />
          <Tooltip 
            content={<ChartTooltipContent />}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#languageAreaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
} 