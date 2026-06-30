import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { normalizeRole } from "@/utils/rolePermissions";
import TaskStatsBar from "./TaskStatsBar";
import TaskListView from "./TaskListView";
import TaskKanbanView from "./TaskKanbanView";
import TaskCalendarView from "./TaskCalendarView";
import TaskTeamView from "./TaskTeamView";
import TaskCreateSheet from "./TaskCreateSheet";
import TaskDrawer from "./TaskDrawer";
import { TaskItem, TaskViewFilter, VIEW_CHIPS } from "./taskConstants";

const TaskManagementPage = () => {
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(normalizeRole(user?.role));

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<{
    dueToday: number;
    overdue: number;
    thisWeek: number;
    completionRate: number;
  } | null>(null);
  const [team, setTeam] = useState<
    {
      id: string;
      name: string;
      open: number;
      overdue: number;
      completed: number;
      total: number;
      completionRate: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<TaskViewFilter>("all");
  const [tab, setTab] = useState("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axiosInstance.get("/tasks", { params: { view: viewFilter } }),
        axiosInstance.get("/tasks/stats"),
      ]);
      setTasks(tasksRes.data?.data || []);
      setStats(statsRes.data);

      if (isManager) {
        const teamRes = await axiosInstance.get("/tasks/team");
        setTeam(teamRes.data?.data || []);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [viewFilter, isManager]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openTask = (task: TaskItem) => {
    setSelectedId(task.id);
    setDrawerOpen(true);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "rgba(var(--theme-color-rgb), 0.02)", padding: "22px 24px" }}>
      <div>

        {/* ── Page header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>
              TASKS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "baseline", gap: 8 }}>
              Task Management
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.1)", padding: "2px 10px", borderRadius: 20 }}>
                {tasks.length}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "var(--theme-color)", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
              boxShadow: "0 2px 8px rgba(var(--theme-color-rgb), 0.3)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--theme-color-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--theme-color)")}
          >
            <Plus size={14} />
            Create Task
          </button>
        </div>

        {/* ── Stats bar ───────────────────────────────────── */}
        <TaskStatsBar stats={stats} loading={loading} />

        {/* ── View filter pills ───────────────────────────── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0" }}>
          {VIEW_CHIPS.map((chip) => {
            const active = viewFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setViewFilter(chip.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1.5px solid ${active ? "var(--theme-color)" : "hsl(var(--border))"}`,
                  background: active ? "var(--theme-color)" : "hsl(var(--card))",
                  color: active ? "#fff" : "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.12s",
                  boxShadow: active ? "0 2px 6px rgba(var(--theme-color-rgb), 0.15)" : "none",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── View tabs ─────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="bg-card border border-border p-1 rounded-xl h-10 gap-1">
            <TabsTrigger value="list" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">List</TabsTrigger>
            <TabsTrigger value="board" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Board</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Calendar</TabsTrigger>
            {isManager && <TabsTrigger value="team" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Team</TabsTrigger>}
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <TaskListView tasks={tasks} onSelect={openTask} />
          </TabsContent>

          <TabsContent value="board" className="mt-4">
            <TaskKanbanView tasks={tasks} onSelect={openTask} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <TaskCalendarView tasks={tasks} onSelect={openTask} />
          </TabsContent>

          {isManager && (
            <TabsContent value="team" className="mt-4">
              <TaskTeamView rows={team} loading={loading} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <TaskCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={fetchAll}
      />

      <TaskDrawer
        taskId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={fetchAll}
      />
    </div>
  );
};

export default TaskManagementPage;
