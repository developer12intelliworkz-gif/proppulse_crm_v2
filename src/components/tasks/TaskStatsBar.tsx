import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";

interface Props {
  stats: {
    dueToday: number;
    overdue: number;
    thisWeek: number;
    completionRate: number;
  } | null;
  loading?: boolean;
}

const TaskStatsBar = ({ stats, loading }: Props) => {
  const items = [
    { label: "Due Today", value: stats?.dueToday ?? 0, icon: Calendar, color: "var(--theme-color)" },
    {
      label: "Overdue",
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      danger: true,
      color: "#EF4444",
    },
    { label: "This Week", value: stats?.thisWeek ?? 0, icon: Calendar, color: "#8B5CF6" },
    {
      label: "Completion Rate",
      value: `${stats?.completionRate ?? 0}%`,
      icon: CheckCircle2,
      color: "#10B981",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon, danger, color }) => {
        const bg = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.04)" : `${color}0d`;
        const border = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${color}25`;
        const glow = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${color}20`;

        return (
          <Card
            key={label}
            className={danger ? "border-red-200" : ""}
            style={{
              background: bg,
              borderColor: border,
              borderLeft: `4px solid ${color}`,
              borderRadius: "12px",
              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 12px 30px ${glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                  {label}
                </p>
                <p className="text-2xl font-black mt-2 text-foreground">
                  {loading ? "—" : value}
                </p>
              </div>
              <div
                style={{
                  background: color.startsWith("var")
                    ? "linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15), rgba(var(--theme-color-rgb), 0.03))"
                    : `linear-gradient(135deg, ${color}26, ${color}08)`,
                  boxShadow: `0 4px 10px ${color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.05)" : color + "12"}`
                }}
                className="p-2.5 rounded-xl flex-shrink-0"
              >
                <Icon
                  className="h-5 w-5"
                  style={{
                    color: color.startsWith("var") ? "var(--theme-color)" : color
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskStatsBar;
