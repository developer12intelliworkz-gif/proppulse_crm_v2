import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Building,
  Calendar,
  CalendarClock,
  ClipboardList,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TrendResult } from "@/utils/dashboardHelpers";

export interface DashboardStatCard {
  id: string;
  title: string;
  value: number;
  icon: LucideIcon;
  trend: TrendResult;
  href: string;
  adminOnly?: boolean;
}

interface DashboardStatCardsProps {
  cards: DashboardStatCard[];
  loading?: boolean;
  showAdminCards?: boolean;
}

const getCardColors = (id: string) => {
  switch (id) {
    case "total-leads":
      return {
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        iconBorder: "border-blue-100/40 dark:border-blue-900/50",
        cardGradient: "to-blue-50/10 hover:to-blue-50/20 dark:to-blue-950/5 dark:hover:to-blue-950/10",
        hoverBorder: "hover:border-blue-200/80 hover:shadow-blue-500/[0.015] dark:hover:border-blue-800/80",
        leftBar: "bg-blue-500",
      };
    case "new-leads-week":
      return {
        iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
        iconBorder: "border-violet-100/40 dark:border-violet-900/50",
        cardGradient: "to-violet-50/10 hover:to-violet-50/20 dark:to-violet-950/5 dark:hover:to-violet-950/10",
        hoverBorder: "hover:border-violet-200/80 hover:shadow-violet-500/[0.015] dark:hover:border-violet-800/80",
        leftBar: "bg-violet-500",
      };
    case "followups-today":
      return {
        iconBg: "bg-[var(--theme-color)]/10 text-[var(--theme-color)] dark:bg-[rgba(var(--theme-color-rgb),0.2)] dark:text-[var(--theme-color)]",
        iconBorder: "border-[var(--theme-color)]/20 dark:border-[rgba(var(--theme-color-rgb),0.3)]",
        cardGradient: "to-[var(--theme-color)]/5 hover:to-[var(--theme-color)]/10 dark:to-[rgba(var(--theme-color-rgb),0.05)] dark:hover:to-[rgba(var(--theme-color-rgb),0.1)]",
        hoverBorder: "hover:border-[var(--theme-color)]/30 hover:shadow-[var(--theme-color)]/[0.015] dark:hover:border-[rgba(var(--theme-color-rgb),0.4)]",
        leftBar: "bg-[var(--theme-color)]",
      };
    case "pending-followups":
      return {
        iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
        iconBorder: "border-amber-100/40 dark:border-amber-900/50",
        cardGradient: "to-amber-50/10 hover:to-amber-50/20 dark:to-amber-950/5 dark:hover:to-amber-950/10",
        hoverBorder: "hover:border-amber-200/80 hover:shadow-amber-500/[0.015] dark:hover:border-amber-800/80",
        leftBar: "bg-amber-500",
      };
    case "tasks-due-today":
      return {
        iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
        iconBorder: "border-indigo-100/40 dark:border-indigo-900/50",
        cardGradient: "to-indigo-50/10 hover:to-indigo-50/20 dark:to-indigo-950/5 dark:hover:to-indigo-950/10",
        hoverBorder: "hover:border-indigo-200/80 hover:shadow-indigo-500/[0.015] dark:hover:border-indigo-800/80",
        leftBar: "bg-indigo-500",
      };
    case "overdue-tasks":
      return {
        iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
        iconBorder: "border-rose-100/40 dark:border-rose-900/50",
        cardGradient: "to-rose-50/10 hover:to-rose-50/20 dark:to-rose-950/5 dark:hover:to-rose-950/10",
        hoverBorder: "hover:border-rose-200/80 hover:shadow-rose-500/[0.015] dark:hover:border-rose-800/80",
        leftBar: "bg-rose-500",
      };
    case "total-projects":
      return {
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        iconBorder: "border-emerald-100/40 dark:border-emerald-900/50",
        cardGradient: "to-emerald-50/10 hover:to-emerald-50/20 dark:to-emerald-950/5 dark:hover:to-emerald-950/10",
        hoverBorder: "hover:border-emerald-200/80 hover:shadow-emerald-500/[0.015] dark:hover:border-emerald-800/80",
        leftBar: "bg-emerald-500",
      };
    case "total-users":
      return {
        iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
        iconBorder: "border-teal-100/40 dark:border-teal-900/50",
        cardGradient: "to-teal-50/10 hover:to-teal-50/20 dark:to-teal-950/5 dark:hover:to-teal-950/10",
        hoverBorder: "hover:border-teal-200/80 hover:shadow-teal-500/[0.015] dark:hover:border-teal-800/80",
        leftBar: "bg-teal-500",
      };
    default:
      return {
        iconBg: "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        iconBorder: "border-slate-100/60 dark:border-slate-700/50",
        cardGradient: "to-slate-50/10 dark:to-slate-900/10",
        hoverBorder: "hover:border-slate-200/80 dark:hover:border-slate-800",
        leftBar: "bg-slate-400",
      };
  }
};

const DashboardStatCards = ({
  cards,
  loading = false,
  showAdminCards = true,
}: DashboardStatCardsProps) => {
  const visible = cards.filter((card) => showAdminCards || !card.adminOnly);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: showAdminCards ? 8 : 6 }).map((_, i) => (
          <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {visible.map((card) => {
        const Icon = card.icon;
        const colors = getCardColors(card.id);
        return (
          <Link key={card.id} to={card.href} className="block group">
            <Card className={cn(
              "bg-gradient-to-br from-white via-white dark:from-slate-900 dark:via-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full rounded-2xl active:scale-[0.98] overflow-hidden relative",
              colors.cardGradient,
              colors.hoverBorder
            )}>
              {/* Left accent color-coded indicator bar */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-[4px] transition-colors duration-300", colors.leftBar)} />
              
              <CardContent className="p-4 pl-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <div className={cn("p-2 rounded-xl border transition-all duration-200 shrink-0", colors.iconBg, colors.iconBorder)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums group-hover:text-slate-950 dark:group-hover:text-slate-200 transition-colors">
                    {card.value.toLocaleString()}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border transition-colors",
                        card.trend.positive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
                      )}
                    >
                      {card.trend.text}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export const STAT_CARD_ICONS = {
  totalLeads: Users,
  newLeadsWeek: Sparkles,
  followupsToday: Calendar,
  pendingFollowups: CalendarClock,
  tasksDueToday: ClipboardList,
  overdueTasks: AlertCircle,
  totalProjects: Building,
  totalUsers: UserCheck,
};

export default DashboardStatCards;
