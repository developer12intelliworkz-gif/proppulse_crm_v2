import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import ReportPieChart from "@/components/crm/ReportPieChart";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import { groupLeadsBySource, leadsCreatedByDay } from "@/utils/dashboardHelpers";
import type { LocalLead } from "@/store/types/leads";
import { cn } from "@/lib/utils";

type Period = 7 | 30 | 90;

interface DashboardChartsProps {
  leads: LocalLead[];
  loading?: boolean;
}

const lineChartConfig = {
  count: {
    label: "Leads",
    color: "var(--theme-color)",
  },
} satisfies ChartConfig;

const DashboardCharts = ({ leads, loading = false }: DashboardChartsProps) => {
  const [period, setPeriod] = useState<Period>(30);

  const sourceData = useMemo(() => {
    const grouped = groupLeadsBySource(leads);
    const total = grouped.reduce((sum, item) => sum + item.value, 0);
    return grouped.map((item) => ({
      name: formatPascalCaseDisplayName(item.name),
      value: item.value,
      percentage: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [leads]);

  const lineData = useMemo(
    () => leadsCreatedByDay(leads, period),
    [leads, period],
  );

  const pieDataWithLegend = useMemo(
    () =>
      sourceData.map((item) => ({
        name: `${item.name} (${item.percentage}%)`,
        value: item.value,
      })),
    [sourceData],
  );

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{background:"hsl(var(--card))",borderRadius:14,padding:"18px 20px",border:"1px solid hsl(var(--border))"}}>
        <div style={{fontSize:13,fontWeight:700,color:"hsl(var(--foreground))",marginBottom:16}}>Leads by Source</div>
        <div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[240px] w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : sourceData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No lead source data yet
            </div>
          ) : (
            <ReportPieChart data={pieDataWithLegend} valueLabel="leads" />
          )}
        </div>
      </div>

      <div style={{background:"hsl(var(--card))",borderRadius:14,padding:"18px 20px",border:"1px solid hsl(var(--border))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"hsl(var(--foreground))"}}>Leads Created Over Time</div>
          <div style={{display:"flex",gap:4}}>
            {([7,30,90] as Period[]).map((days) => (
              <button key={days} type="button" onClick={() => setPeriod(days)}
                style={{padding:"3px 10px",borderRadius:6,border:"1px solid",fontSize:11,fontWeight:600,cursor:"pointer",
                  background:period===days?"var(--theme-color)":"hsl(var(--card))",borderColor:period===days?"var(--theme-color)":"hsl(var(--border))",
                  color:period===days?"#fff":"hsl(var(--muted-foreground))"}}>
                {days}D
              </button>
            ))}
          </div>
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : lineData.every((row) => row.count === 0) ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No leads created in this period
            </div>
          ) : (
            <ChartContainer config={lineChartConfig} className="h-[320px] w-full">
              <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? new Date(payload[0].payload.date).toLocaleDateString(
                              "en-IN",
                              { weekday: "short", month: "short", day: "numeric" },
                            )
                          : ""
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-count)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
