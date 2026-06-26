import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckSquare, Sparkles, AlertCircle } from "lucide-react";
import { TaskItem, associationLabel, priorityMeta, statusMeta } from "./taskConstants";
import TaskCreateSheet from "./TaskCreateSheet";
import TaskDrawer from "./TaskDrawer";
import { cn } from "@/lib/utils";

interface Props {
  leadId: string;
  projectId?: string;
}

const getPriorityBorderColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "border-l-red-500";
    case "high":
      return "border-l-orange-500";
    case "medium":
      return "border-l-blue-500";
    case "low":
    default:
      return "border-l-slate-300 dark:border-l-slate-700";
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/20";
    case "high":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100/60 dark:border-orange-900/20";
    case "medium":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/20";
    case "low":
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-100/60 dark:border-slate-700/50";
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/20";
    case "on_hold":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/20";
    case "in_progress":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/20";
    case "open":
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-100/60 dark:border-slate-700/50";
  }
};

const LeadTasksPanel = ({ leadId, projectId }: Props) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/tasks", {
        params: { lead_id: leadId },
      });
      setTasks(res.data?.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[var(--theme-color)]" />
            <CardTitle className="text-xl font-bold flex items-center gap-2 dark:text-slate-200">
              Tasks
              <span className="bg-orange-50 dark:bg-orange-950/20 text-[var(--theme-color)] border border-orange-100/60 dark:border-orange-900/30 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                {tasks.length}
              </span>
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white font-bold h-9 px-4 rounded-xl transition-all shadow-none"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-sm text-slate-500 animate-pulse">Loading tasks…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
              <CheckSquare className="h-10 w-10 text-slate-300 dark:text-slate-650 mb-3" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-base">No tasks linked yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mt-1 mb-4">
                Keep track of this lead's next actions and follow-ups by adding task lists.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-lg"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Task
              </Button>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 cursor-pointer transition-all hover:shadow-md border-l-4 flex flex-col md:flex-row md:items-center justify-between gap-4",
                  getPriorityBorderColor(task.priority)
                )}
                onClick={() => {
                  setSelectedId(task.id);
                  setDrawerOpen(true);
                }}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base truncate">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl truncate">
                      {task.description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1 font-medium bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-650 dark:text-slate-400">
                      {associationLabel(task)}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1 font-medium text-slate-650 dark:text-slate-400 bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100/30 dark:border-orange-900/25 px-2 py-0.5 rounded">
                        <Calendar className="h-3.5 w-3.5 text-[var(--theme-color)]" />
                        Due {task.due_date}
                        {task.due_time ? ` ${task.due_time}` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={cn("rounded-full border shadow-none font-semibold text-xs py-0.5 px-2.5", getPriorityBadgeColor(task.priority))}>
                    {priorityMeta(task.priority).label}
                  </Badge>
                  <Badge className={cn("rounded-full border shadow-none font-semibold text-xs py-0.5 px-2.5", getStatusBadgeColor(task.status))}>
                    {statusMeta(task.status).label}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-gradient-to-br from-slate-50 to-orange-50/15 dark:from-slate-900 dark:to-orange-950/10 rounded-xl h-fit bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 flex flex-row items-center gap-2 border-b border-slate-100/80 dark:border-slate-800">
          <Sparkles className="h-5 w-5 text-[var(--theme-color)]" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Quick add</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
            Quickly capture actions, set deadlines, and assign tasks to keep your lead pipeline active.
          </p>
          <Button
            className="w-full bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white font-bold h-10 shadow-sm rounded-xl transition-all flex items-center justify-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New task for lead
          </Button>
        </CardContent>
      </Card>

      <TaskCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={fetchTasks}
        defaultLeadId={leadId}
        defaultProjectId={projectId}
      />

      <TaskDrawer
        taskId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={fetchTasks}
      />
    </div>
  );
};

export default LeadTasksPanel;
