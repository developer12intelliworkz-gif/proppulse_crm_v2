import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import LeadsManagement from "@/components/crm/LeadsManagement";
import ProjectManagement from "@/components/projects/ProjectManagement";
import UserManagement from "@/components/users/UserManagement";
import CreateLeadForm from "@/components/leads/CreateLeadForm";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";
import DashboardStatCards, {
  STAT_CARD_ICONS,
  type DashboardStatCard,
} from "@/components/dashboard/DashboardStatCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardActivityPanel from "@/components/dashboard/DashboardActivityPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/contexts/LeadsContext";
import axiosInstance from "@/api/axiosInstance";
import type { TaskItem } from "@/components/tasks/taskConstants";
import {
  addDays,
  countTrend,
  filterLeadsForRole,
  getDashboardRole,
  getDashboardSubtitle,
  isWithinDays,
  percentTrend,
  toDateKey,
  type FollowUpDashboardItem,
} from "@/utils/dashboardHelpers";

const DashboardEnhancedView = () => {
  const { hasPermission, token, user } = useAuth();
  const { leads, fetchLeads } = useLeads();
  const [activeTab, setActiveTab] = useState("leads");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  const [usersCount, setUsersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpDashboardItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskStats, setTaskStats] = useState<{
    dueToday: number;
    overdue: number;
  } | null>(null);
  const [todayKey, setTodayKey] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const dashboardRole = getDashboardRole(user?.role);
  const isAdminView = dashboardRole === "admin" || dashboardRole === "manager";

  const scopedLeads = useMemo(
    () => filterLeadsForRole(leads, user?.id, user?.role),
    [leads, user?.id, user?.role],
  );

  const loadDashboardData = useCallback(async () => {
    if (!token) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const followupsPromise = axiosInstance.get("/followups/dashboard", {
        params: { limit: "250", sortBy: "next_followup" },
      });
      const tasksPromise = axiosInstance.get("/tasks", {
        params: { view: isAdminView ? "all" : "my" },
      });
      const taskStatsPromise = axiosInstance.get("/tasks/stats");
      const projectsPromise = axiosInstance.get("/projects");

      const usersPromise = isAdminView
        ? axiosInstance.get("/users")
        : Promise.resolve(null);

      const [followupsRes, tasksRes, statsRes, projectsRes, usersRes] =
        await Promise.all([
          followupsPromise,
          tasksPromise,
          taskStatsPromise,
          projectsPromise,
          usersPromise,
        ]);

      const apiToday = followupsRes.data?.today;
      const resolvedToday =
        typeof apiToday === "string" && apiToday
          ? apiToday.slice(0, 10)
          : new Date().toISOString().slice(0, 10);
      setTodayKey(resolvedToday);

      const items = (followupsRes.data?.items || []) as Record<string, unknown>[];
      setFollowUps(
        items.map((row) => ({
          activityId:
            typeof row.activityId === "number" ? row.activityId : null,
          leadId: String(row.leadId || ""),
          leadName: String(row.leadName || "Unknown"),
          nextFollowUpDate: row.nextFollowUpDate
            ? String(row.nextFollowUpDate).slice(0, 10)
            : undefined,
          nextFollowUpTime: row.nextFollowUpTime
            ? String(row.nextFollowUpTime)
            : undefined,
          followUpType: row.followUpType ? String(row.followUpType) : "call",
          status: row.status ? String(row.status) : "pending",
          assigneeName: row.assigneeName ? String(row.assigneeName) : undefined,
        })),
      );

      setTasks(tasksRes.data?.data || []);
      setTaskStats(statsRes.data || null);

      const projectsPayload = projectsRes.data;
      const projectList =
        projectsPayload?.data ||
        (Array.isArray(projectsPayload) ? projectsPayload : []);
      setProjects(Array.isArray(projectList) ? projectList : []);
      setProjectsCount(Array.isArray(projectList) ? projectList.length : 0);

      if (usersRes?.data) {
        setUsersCount(
          Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        );
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data
          ? String((err.response.data as { error?: string }).error)
          : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdminView]);

  useEffect(() => {
    fetchLeads(true);
  }, [fetchLeads]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, leads.length]);

  const todaysFollowUps = useMemo(
    () =>
      followUps.filter(
        (item) =>
          item.nextFollowUpDate === todayKey &&
          !["completed", "done"].includes((item.status || "").toLowerCase()),
      ),
    [followUps, todayKey],
  );

  const pendingFollowUps = useMemo(
    () =>
      followUps.filter((item) =>
        ["pending", "scheduled"].includes((item.status || "").toLowerCase()),
      ),
    [followUps],
  );

  const statCards = useMemo((): DashboardStatCard[] => {
    const now = new Date();
    const yesterdayKey = addDays(new Date(todayKey), -1)
      .toISOString()
      .slice(0, 10);

    const newLeadsThisWeek = scopedLeads.filter((lead) =>
      isWithinDays(lead.created_at, 7, now),
    ).length;

    const newLeadsPriorWeek = scopedLeads.filter((lead) => {
      const key = toDateKey(lead.created_at);
      if (!key) return false;
      const created = new Date(key);
      const end = addDays(startOfDayHelper(now), -7);
      const start = addDays(end, -6);
      return created >= start && created <= end;
    }).length;

    const followupsYesterday = followUps.filter(
      (item) => item.nextFollowUpDate === yesterdayKey,
    ).length;

    const pendingPriorWeekEstimate = Math.max(
      0,
      pendingFollowUps.length -
        todaysFollowUps.length +
        followupsYesterday,
    );

    return [
      {
        id: "total-leads",
        title: "Total Leads",
        value: scopedLeads.length,
        icon: STAT_CARD_ICONS.totalLeads,
        trend: percentTrend(newLeadsThisWeek, newLeadsPriorWeek, "this week"),
        href: "/leads",
      },
      {
        id: "new-leads-week",
        title: "New Leads This Week",
        value: newLeadsThisWeek,
        icon: STAT_CARD_ICONS.newLeadsWeek,
        trend: percentTrend(newLeadsThisWeek, newLeadsPriorWeek, "vs last week"),
        href: "/leads",
      },
      {
        id: "followups-today",
        title: "Follow-ups Today",
        value: todaysFollowUps.length,
        icon: STAT_CARD_ICONS.followupsToday,
        trend: countTrend(
          todaysFollowUps.length,
          followupsYesterday,
          "vs yesterday",
        ),
        href: "/followups",
      },
      {
        id: "pending-followups",
        title: "Pending Follow-ups",
        value: pendingFollowUps.length,
        icon: STAT_CARD_ICONS.pendingFollowups,
        trend: countTrend(
          pendingFollowUps.length,
          pendingPriorWeekEstimate,
          "vs prior week",
        ),
        href: "/followups",
      },
      {
        id: "tasks-due-today",
        title: "Tasks Due Today",
        value: taskStats?.dueToday ?? 0,
        icon: STAT_CARD_ICONS.tasksDueToday,
        trend: { text: "Due today", positive: true },
        href: "/tasks",
      },
      {
        id: "overdue-tasks",
        title: "Overdue Tasks",
        value: taskStats?.overdue ?? 0,
        icon: STAT_CARD_ICONS.overdueTasks,
        trend:
          (taskStats?.overdue ?? 0) > 0
            ? { text: "Requires action", positive: false }
            : { text: "All clear", positive: true },
        href: "/tasks",
      },
      {
        id: "total-projects",
        title: "Total Projects",
        value: projectsCount,
        icon: STAT_CARD_ICONS.totalProjects,
        trend: { text: "Active portfolio", positive: true },
        href: "/projects",
        adminOnly: true,
      },
      {
        id: "total-users",
        title: "Total Users",
        value: usersCount,
        icon: STAT_CARD_ICONS.totalUsers,
        trend: { text: "Team members", positive: true },
        href: "/users",
        adminOnly: true,
      },
    ];
  }, [
    scopedLeads,
    todaysFollowUps.length,
    pendingFollowUps.length,
    followUps,
    taskStats,
    projectsCount,
    usersCount,
    todayKey,
  ]);

  const availableTabs = [
    { id: "leads", label: "Leads", permission: "view_leads" },
    { id: "projects", label: "Projects", permission: "create_projects" },
    { id: "users", label: "Users", permission: "manage_users" },
  ].filter((tab) => hasPermission(tab.permission));

  if (error && !loading && scopedLeads.length === 0) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f4f5] dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="p-6 h-full">
        <div className="mx-auto h-full flex flex-col max-w-[1600px] opacity-0 animate-fade-in-up">
          {/* Top Row: Quick Actions + Date Badge */}
          <div className="mb-6 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
            <DashboardQuickActions
              role={user?.role}
              onCreateLead={() => setCreateLeadOpen(true)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full text-slate-650 dark:text-slate-350 border border-slate-200/85 dark:border-slate-800 text-[11px] font-bold shadow-sm sm:mb-0 mb-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-color)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--theme-color)]"></span>
                  </span>
                  {(selectedDate || new Date()).toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DashboardStatCards
            cards={statCards}
            loading={loading}
            showAdminCards={isAdminView}
          />

          <DashboardCharts leads={scopedLeads} loading={loading} />

          <DashboardActivityPanel
            followUps={todaysFollowUps}
            tasks={tasks}
            loading={loading}
            isAdminView={isAdminView}
            onFollowUpUpdated={loadDashboardData}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-200/60 dark:border-slate-800 pb-px mb-5">
              <TabsList className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit h-10 border border-slate-200/50 dark:border-slate-700 shadow-sm">
                {availableTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 text-slate-600 dark:text-slate-400 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:shadow-sm border-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <TabsContent value="leads" className="m-0 p-4">
                <LeadsManagement />
              </TabsContent>
              <TabsContent value="projects" className="m-0 p-4">
                <ProjectManagement />
              </TabsContent>
              <TabsContent value="users" className="m-0 p-4">
                <UserManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Dialog open={createLeadOpen} onOpenChange={setCreateLeadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Create Lead</DialogTitle>
          </DialogHeader>
          <CreateLeadForm
            projects={projects}
            onClose={() => setCreateLeadOpen(false)}
            onLeadCreated={() => {
              setCreateLeadOpen(false);
              fetchLeads(true);
              loadDashboardData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function startOfDayHelper(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default DashboardEnhancedView;
