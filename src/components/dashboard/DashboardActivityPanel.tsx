import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import {
  getTaskPriorityColor,
  isTaskDueToday,
  isTaskOverdue,
  type FollowUpDashboardItem,
} from "@/utils/dashboardHelpers";
import type { TaskItem } from "@/components/tasks/taskConstants";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DashboardActivityPanelProps {
  followUps: FollowUpDashboardItem[];
  tasks: TaskItem[];
  loading?: boolean;
  isAdminView?: boolean;
  onFollowUpUpdated?: () => void;
}

const followUpTypeIcon = (type?: string) => {
  const t = (type || "call").toLowerCase();
  if (t.includes("visit") || t.includes("site")) {
    return <MapPin className="h-3.5 w-3.5" />;
  }
  if (t.includes("email") || t.includes("mail")) {
    return <Mail className="h-3.5 w-3.5" />;
  }
  return <Phone className="h-3.5 w-3.5" />;
};

const followUpStatusClass = (status?: string) => {
  const s = (status || "pending").toLowerCase();
  if (s === "completed" || s === "done") {
    return "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border border-green-200/20";
  }
  if (s === "pending" || s === "scheduled") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-850 dark:text-gray-400 border border-gray-200/20";
};

const DashboardActivityPanel = ({
  followUps,
  tasks,
  loading = false,
  isAdminView = false,
  onFollowUpUpdated,
}: DashboardActivityPanelProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const taskRows = useMemo(() => {
    return tasks
      .filter((task) => task.status !== "completed")
      .filter((task) => isTaskDueToday(task) || isTaskOverdue(task))
      .sort((a, b) => {
        const aOver = isTaskOverdue(a);
        const bOver = isTaskOverdue(b);
        if (aOver && !bOver) return -1;
        if (!aOver && bOver) return 1;
        const aDue = a.due_on || a.due_date || "";
        const bDue = b.due_on || b.due_date || "";
        return aDue.localeCompare(bDue);
      });
  }, [tasks]);

  const markFollowUpDone = async (activityId: number | null) => {
    if (!activityId) return;
    setCompletingId(activityId);
    try {
      await axiosInstance.post(`/followups/${activityId}/complete`);
      // toast({ title: "Follow-up marked complete" });
      onFollowUpUpdated?.();
    } catch {
      // toast({
        // title: "Could not update follow-up",
        // variant: "destructive",
      // });
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[0, 1].map((i) => (
          <Card key={i} className="bg-white shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col rounded-2xl hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3 border-b border-slate-100/80 dark:border-slate-800 mb-2">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-slate-800 dark:text-slate-200">
            <Calendar className="h-4 w-4 text-[var(--theme-color)]" />
            Today&apos;s Follow-ups
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Scheduled follow-ups for today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pb-4 pt-2">
          {followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 flex-1 text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-600 border border-emerald-500/20 shadow-sm animate-pulse">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All caught up for today!</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No scheduled follow-ups left.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80 dark:divide-slate-800/50 flex-1 max-h-[360px] overflow-y-auto pr-1">
              {followUps.map((row) => (
                <div
                  key={`${row.activityId}-${row.leadId}`}
                  className="flex flex-wrap items-center gap-3 justify-between py-2.5 px-1 first:pt-0 last:pb-0 hover:bg-slate-50/20 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/leads/${row.leadId}`)}
                      className="font-semibold text-xs hover:underline text-left text-slate-800 dark:text-slate-200 truncate block max-w-full"
                    >
                      {row.leadName}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 capitalize font-medium">
                        {followUpTypeIcon(row.followUpType)}
                        {formatPascalCaseDisplayName(row.followUpType || "call")}
                      </span>
                      <span>•</span>
                      <span>{row.nextFollowUpTime || "—"}</span>
                      <span>•</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize",
                          followUpStatusClass(row.status),
                        )}
                      >
                        {row.status || "pending"}
                      </span>
                    </div>
                  </div>
                  {row.activityId &&
                    !["completed", "done"].includes(
                      (row.status || "").toLowerCase(),
                    ) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 text-xs rounded-lg px-2 border-slate-200 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
                        disabled={completingId === row.activityId}
                        onClick={() => markFollowUpDone(row.activityId)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Done
                      </Button>
                    )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/followups"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-4 hover:underline"
            >
              View All Follow-ups
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col rounded-2xl hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3 border-b border-slate-100/80 dark:border-slate-800 mb-2">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-slate-800 dark:text-slate-200">
            <ClipboardList className="h-4 w-4 text-[var(--theme-color)]" />
            My Tasks
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Tasks due today and overdue items</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pb-4 pt-2">
          {taskRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 flex-1 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 text-blue-600 border border-blue-500/20 shadow-sm animate-pulse">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No tasks due today</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Enjoy your clear dashboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80 dark:divide-slate-800/50 flex-1 max-h-[360px] overflow-y-auto pr-1">
              {taskRows.map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate("/tasks")}
                    className={cn(
                      "w-full text-left flex flex-wrap items-center gap-2 justify-between py-2.5 px-2 first:pt-0 last:pb-0 transition-colors border-l-2 border-transparent pl-1",
                      overdue
                        ? "border-l-red-400 bg-red-50/10 dark:bg-red-950/10 hover:bg-red-50/30 dark:hover:bg-red-950/20"
                        : "hover:bg-slate-50/30 dark:hover:bg-slate-800/30",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-semibold text-xs truncate",
                          overdue ? "text-red-900 dark:text-red-400" : "text-slate-800 dark:text-slate-200",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={cn(
                            "text-[10px]",
                            overdue
                              ? "text-red-700 dark:text-red-400 font-bold"
                              : "text-muted-foreground",
                          )}
                        >
                          Due {task.due_date || task.due_on || "—"}
                        </span>
                        <span>•</span>
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                            getTaskPriorityColor(task.priority),
                          )}
                        >
                          {task.priority}
                        </span>
                        {isAdminView && task.assignee_names?.[0] && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-muted-foreground">
                              {task.assignee_names[0]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/tasks"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-4 hover:underline"
            >
              View All Tasks
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardActivityPanel;
