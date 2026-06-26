import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";

export interface ReportPieChartDatum {
  name: string;
  value: number;
}

const DEFAULT_COLORS = [
  "var(--theme-color)", // PropPulse brand vermillion
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
];

interface ReportPieChartProps {
  data: ReportPieChartDatum[];
  colors?: string[];
  valueLabel?: string;
}

const formatLegendLabel = (name: string) => formatPascalCaseDisplayName(name);

const ReportPieChart = ({
  data,
  colors = DEFAULT_COLORS,
  valueLabel = "leads",
}: ReportPieChartProps) => {
  const displayData = data.map((item) => ({
    ...item,
    displayName: formatLegendLabel(item.name),
  }));

  if (!data.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No chart data available
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="h-[240px] w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={96}
              paddingAngle={2}
              dataKey="value"
              nameKey="displayName"
              isAnimationActive={data.length <= 12}
            >
              {displayData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} ${valueLabel}`,
                name,
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              wrapperStyle={{ zIndex: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-lg border bg-muted/30 px-3 py-2">
        <ul className="flex flex-col gap-2.5">
          {displayData.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-start gap-2.5 text-sm"
            >
              <span
                className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden
              />
              <span
                className="min-w-0 flex-1 break-words leading-snug text-foreground"
                title={item.displayName}
              >
                {item.displayName}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportPieChart;
