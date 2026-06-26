import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACTIVITY_STATUS_OPTIONS } from "@/utils/activityFormUtils";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  List,
  Plus,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import LogFollowUpModal from "./LogFollowUpModal";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import {
  PIPELINE_STAGES,
  initials,
  priorityColor,
  stageColor,
  stageLabel,
  statusColor,
} from "./followUpConstants";

interface DashboardStats {
  totalFollowups: number;
  todayFollowups: number;
  upcoming7: number;
  overdue: number;
  completedThisMonth: number;
  pendingAll: number;
  conversionRate: number;
  avgFollowupsPerLead: number;
  trendTotal: number;
}

interface FollowUpRow {
  leadId: string;
  activityId: number | null;
  leadName: string;
  phone?: string;
  companySource: string;
  assigneeId?: string;
  assigneeName: string;
  stage: string;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  followUpType: string;
  followUpCount: number;
  status: string;
  priority: string;
  notesPreview: string;
  rescheduleCount: number;
}

const KPI_CONFIG = [
  { key: "totalFollowups", label: "Total Follow-ups", icon: Target, border: "var(--theme-color)" },
  { key: "todayFollowups", label: "Today's Follow-ups", icon: Calendar, border: "#F59E0B" },
  { key: "upcoming7", label: "Upcoming (7 days)", icon: Clock, border: "#8B5CF6" },
  { key: "overdue", label: "Overdue / Missed", icon: AlertTriangle, danger: true, border: "#EF4444" },
  { key: "completedThisMonth", label: "Completed This Month", icon: CheckCircle2, border: "#10B981" },
  { key: "pendingAll", label: "Pending (All Time)", icon: List, border: "#3B82F6" },
  { key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, suffix: "%", border: "#EC4899" },
  { key: "avgFollowupsPerLead", label: "Avg. Follow-ups / Lead", icon: Users, border: "#06B6D4" },
] as const;

const STAGE_HEX_COLORS: Record<string, string> = {
  new_enquiry: "#64748B",
  first_contact: "#3B82F6",
  followup_scheduled: "#6366F1",
  in_negotiation: "#8B5CF6",
  proposal_sent: "#F97316",
  followup_pending: "#F59E0B",
  closed_won: "#10B981",
  closed_lost: "#EF4444",
  nurturing: "#14B8A6",
};

const FollowUpManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const listFiltersReadyRef = useRef(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [items, setItems] = useState<FollowUpRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [leaderboard, setLeaderboard] = useState<
    {
      id: string;
      name: string;
      totalThisMonth: number;
      missedCount: number;
      completionRate: number;
      pipelineLeads: number;
    }[]
  >([]);
  const [alerts, setAlerts] = useState<{
    overdue: { activityId: number; leadId: string; leadName: string; daysOverdue: number }[];
    dueToday: { activityId: number; leadId: string; leadName: string }[];
    completedRecent: { leadId: string; leadName: string }[];
    atRisk: { leadId: string; leadName: string; phone?: string }[];
    rescheduled: { activityId: number; leadId: string; leadName: string }[];
  }>({ overdue: [], dueToday: [], completedRecent: [], atRisk: [], rescheduled: [] });
  const [calendar, setCalendar] = useState<
    { activityId: number; leadId: string; leadName: string; date: string; time: string; color: string }[]
  >([]);
  const [today, setToday] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [logOpen, setLogOpen] = useState(false);
  const [logLead, setLogLead] = useState<{ id: string; name: string } | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("10:00");
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<FollowUpRow | null>(null);
  const [statusValue, setStatusValue] = useState("scheduled");
  const [leaderboardSort, setLeaderboardSort] = useState("active");
  const [alertsOpen, setAlertsOpen] = useState(true);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [salesperson, setSalesperson] = useState("all");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("next_followup");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("next");
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);

  const buildListParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {
      page: String(page),
      limit: "25",
      sortBy,
      dateField,
    };
    if (searchDebounced.trim()) params.search = searchDebounced.trim();
    if (salesperson !== "all") params.salesperson = salesperson;
    if (stageFilter) params.stage = stageFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (typeFilter !== "all") params.followupType = typeFilter;
    if (priorityFilter !== "all") params.priority = priorityFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [
    page,
    searchDebounced,
    salesperson,
    stageFilter,
    statusFilter,
    typeFilter,
    priorityFilter,
    sortBy,
    dateFrom,
    dateTo,
    dateField,
  ]);

  const applySummaryData = useCallback((data: Record<string, unknown>) => {
    setStats(data.stats as DashboardStats);
    setPipeline((data.pipeline as Record<string, number>) || {});
    setLeaderboard(
      (data.leaderboard as typeof leaderboard) || [],
    );
    setAlerts(
      (data.alerts as typeof alerts) || {
        overdue: [],
        dueToday: [],
        completedRecent: [],
        atRisk: [],
        rescheduled: [],
      },
    );
    setCalendar((data.calendar as typeof calendar) || []);
    setToday((data.today as string) || "");
  }, []);

  const applyListData = useCallback((data: Record<string, unknown>) => {
    setItems((data.items as FollowUpRow[]) || []);
    setPagination(
      (data.pagination as typeof pagination) || {
        page: 1,
        totalPages: 1,
        total: 0,
      },
    );
  }, []);

  /** Full reload: stats, pipeline, alerts, leaderboard, calendar, and list. */
  const fetchAll = useCallback(async () => {
    setSummaryLoading(true);
    setListLoading(true);
    try {
      const res = await axiosInstance.get("/followups/dashboard", {
        params: buildListParams(),
      });
      applySummaryData(res.data);
      applyListData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
      setListLoading(false);
    }
  }, [applyListData, applySummaryData, buildListParams]);

  /** List-only reload: table rows and pagination — does not touch KPI / pipeline stats. */
  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await axiosInstance.get("/followups/dashboard", {
        params: buildListParams(),
      });
      applyListData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  }, [applyListData, buildListParams]);

  const fetchAllRef = useRef(fetchAll);
  fetchAllRef.current = fetchAll;

  useEffect(() => {
    void fetchAllRef.current();
  }, []);

  useEffect(() => {
    if (!listFiltersReadyRef.current) {
      listFiltersReadyRef.current = true;
      return;
    }
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    axiosInstance.get("/users").then((res) => {
      const list = (res.data?.data || res.data || []).map(
        (u: { id: string; name: string }) => ({ id: u.id, name: u.name }),
      );
      setUsers(list);
    }).catch(() => setUsers([]));
  }, []);

  const clearFilters = () => {
    setSearch("");
    setSalesperson("all");
    setStageFilter("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("next_followup");
    setPage(1);
  };

  const markDone = async (activityId: number | null) => {
    if (!activityId) return;
    try {
      await axiosInstance.post(`/followups/${activityId}/complete`);
      void fetchAll();
    } catch {
      // Failed to complete
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget?.activityId || !rescheduleDate) return;
    try {
      await axiosInstance.post(`/followups/${rescheduleTarget.activityId}/reschedule`, {
        scheduleOn: `${rescheduleDate}T${rescheduleTime}`,
      });
      setRescheduleOpen(false);
      void fetchAll();
    } catch {
      // Failed to reschedule
    }
  };

  const submitStatusUpdate = async () => {
    if (!statusTarget?.activityId || !statusValue) return;
    try {
      await axiosInstance.post(`/followups/${statusTarget.activityId}/status`, {
        status: statusValue,
      });
      setStatusOpen(false);
      void fetchAll();
    } catch {
      // Failed to update status
    }
  };

  const sortedLeaderboard = useMemo(() => {
    const copy = [...leaderboard];
    if (leaderboardSort === "missed") {
      copy.sort((a, b) => b.missedCount - a.missedCount);
    } else if (leaderboardSort === "completion") {
      copy.sort((a, b) => b.completionRate - a.completionRate);
    } else {
      copy.sort((a, b) => b.totalThisMonth - a.totalThisMonth);
    }
    return copy;
  }, [leaderboard, leaderboardSort]);

  const calendarByDate = useMemo(() => {
    const map: Record<string, typeof calendar> = {};
    for (const c of calendar) {
      if (!map[c.date]) map[c.date] = [];
      map[c.date].push(c);
    }
    return map;
  }, [calendar]);

  const calendarDates = useMemo(
    () => Object.keys(calendarByDate).sort(),
    [calendarByDate],
  );

  /** Pipeline counts stay fixed from summary data — never swap to filtered list totals. */
  const getStageCount = (stageId: string) => pipeline[stageId] ?? 0;

  const trendIcon = (trend: number) =>
    trend >= 0 ? (
      <ArrowUp className="h-3 w-3 text-emerald-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-red-600" />
    );

  const getMedalStyle = (idx: number) => {
    if (idx === 0) return { background: "#FEF3C7", color: "#D97706", label: "🥇" };
    if (idx === 1) return { background: "#F3F4F6", color: "#4B5563", label: "🥈" };
    if (idx === 2) return { background: "#FFEDD5", color: "#B45309", label: "🥉" };
    return { background: "transparent", color: "#8A92B2", label: String(idx + 1) };
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "rgba(var(--theme-color-rgb), 0.02)", padding: "22px 24px" }}>
      <div className="space-y-6 animate-fade-in-up">
        
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 500, marginBottom: 3 }}>CRM</div>
            <h1 className="text-3xl font-bold tracking-tight">Follow-Up Management</h1>
            <p className="text-muted-foreground mt-1">
              Track, manage, and analyze all lead follow-ups across your sales team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void fetchAll()} style={{ fontFamily: "inherit" }} className="hover:shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              style={{ fontFamily: "inherit", background: "var(--theme-color)" }}
              className="hover:bg-theme-hover shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                setLogLead(null);
                setLogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Follow-up
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CONFIG.map(({ key, label, icon: Icon, danger, suffix, border }) => (
            <Card
              key={key}
              className={danger ? "border-red-200 bg-red-50/20" : ""}
              style={{
                borderLeft: `4px solid ${border}`,
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = danger
                  ? "0 8px 24px rgba(239, 68, 68, 0.1)"
                  : `0 12px 30px ${border === "var(--theme-color)" ? "rgba(var(--theme-color-rgb), 0.15)" : border + "26"}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <CardContent className="p-4">
                {summaryLoading || !stats ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold mt-1.5 ${danger ? "text-red-600" : ""}`}>
                        {stats[key as keyof DashboardStats]}
                        {suffix || ""}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                        {key === "totalFollowups" && (
                          <>
                            {trendIcon(stats.trendTotal)}
                            <span>{Math.abs(stats.trendTotal)}% vs last month</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        background: danger
                          ? "rgba(239, 68, 68, 0.1)"
                          : border === "var(--theme-color)"
                            ? "linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15), rgba(var(--theme-color-rgb), 0.03))"
                            : `linear-gradient(135deg, ${border}26, ${border}08)`,
                        boxShadow: danger ? "none" : `0 4px 10px ${border === "var(--theme-color)" ? "rgba(var(--theme-color-rgb), 0.05)" : border + "12"}`
                      }}
                      className="p-2.5 rounded-xl flex-shrink-0"
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          danger 
                            ? "text-red-600" 
                            : border === "var(--theme-color)" 
                              ? "text-theme" 
                              : ""
                        }`}
                        style={{
                          color: danger ? "" : border === "var(--theme-color)" ? "var(--theme-color)" : border
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
          <Card className="shadow-sm border-muted-foreground/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                    Alerts & Notifications
                    {!summaryLoading && (
                      <Badge style={{ background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" }}>
                        {(alerts.overdue?.length || 0) + (alerts.dueToday?.length || 0)}
                      </Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${alertsOpen ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 pt-1 pb-4">
                <AlertBlock title="Overdue" accentColor="#EF4444" items={alerts.overdue?.map((a) => `${a.leadName} (${a.daysOverdue}d)`) || []} />
                <AlertBlock title="Due Today" accentColor="#F59E0B" items={alerts.dueToday?.map((a) => a.leadName) || []} />
                <AlertBlock title="Completed (24h)" accentColor="#10B981" items={alerts.completedRecent?.map((a) => a.leadName) || []} />
                <AlertBlock title="At Risk (7+ days)" accentColor="#F97316" items={alerts.atRisk?.map((a) => a.leadName) || []} />
                <AlertBlock title="Rescheduled 2+" accentColor="#8B5CF6" items={alerts.rescheduled?.map((a) => a.leadName) || []} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Pipeline */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lead Stage Pipeline</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Counts active leads by CRM stage. Click a stage card to filter the list below.
            </p>
          </CardHeader>
          <CardContent className="overflow-visible pt-2">
            {summaryLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar">
                {PIPELINE_STAGES.map((s) => {
                  const isSelected = stageFilter === s.id;
                  const baseColor = STAGE_HEX_COLORS[s.id] || "#64748B";
                  
                  const borderLeftColor = isSelected ? "var(--theme-color)" : baseColor;
                  const bg = isSelected 
                    ? "rgba(var(--theme-color-rgb), 0.12)" 
                    : `${baseColor}0d`; 
                  const border = isSelected 
                    ? "var(--theme-color)" 
                    : `${baseColor}25`; 
                  const textCol = isSelected 
                    ? "var(--theme-color)" 
                    : baseColor;
                  const glow = isSelected 
                    ? "rgba(var(--theme-color-rgb), 0.15)" 
                    : `${baseColor}15`;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setStageFilter(s.id);
                        setStatusFilter("all");
                        setTypeFilter("all");
                        setPriorityFilter("all");
                        setDateFrom("");
                        setDateTo("");
                        setPage(1);
                      }}
                      className="flex-shrink-0 min-w-[140px] rounded-xl border p-4 text-left transition-all hover:scale-[1.03]"
                      style={{
                        background: bg,
                        borderColor: border,
                        borderLeft: `4px solid ${borderLeftColor}`,
                        boxShadow: isSelected 
                          ? `0 6px 18px ${glow}` 
                          : "0 2px 4px rgba(0,0,0,0.01)",
                        fontFamily: "inherit",
                        color: textCol,
                      }}
                      title={`Show leads in ${s.label} stage`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-85" style={{ color: textCol }}>
                        {s.short}
                      </div>
                      <div className="text-2xl font-black mt-1.5 text-foreground">
                        {getStageCount(s.id)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-4">
            
            {/* Filters */}
            <Card className="shadow-sm border-muted-foreground/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "hsl(var(--card))", border: searchFocused ? "1.5px solid var(--theme-color)" : "1.5px solid hsl(var(--border))", boxShadow: searchFocused ? "0 0 0 1px var(--theme-color)" : "none", borderRadius: 8, padding: "8px 14px", transition: "all 0.15s" }}>
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search lead, phone, company..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "hsl(var(--foreground))", width: "100%", fontFamily: "inherit" }}
                    />
                  </div>
                  <Select value={salesperson} onValueChange={(v) => { setSalesperson(v); setPage(1); }}>
                    <SelectTrigger className="w-full lg:w-44" style={{ fontFamily: "inherit" }}>
                      <SelectValue placeholder="Salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Salespeople</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full lg:w-36" style={{ fontFamily: "inherit" }}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full lg:w-36" style={{ fontFamily: "inherit" }}>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Site Visit">Site Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-32" style={{ fontFamily: "inherit" }}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44" style={{ fontFamily: "inherit" }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next_followup">Next follow-up</SelectItem>
                      <SelectItem value="last_activity">Last activity</SelectItem>
                      <SelectItem value="lead_name">Lead name</SelectItem>
                      <SelectItem value="followup_count">Follow-up count</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateField} onValueChange={setDateField}>
                    <SelectTrigger className="w-36" style={{ fontFamily: "inherit" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next">Next date</SelectItem>
                      <SelectItem value="last">Last contact</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-40" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ fontFamily: "inherit" }} />
                  <Input type="date" className="w-40" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ fontFamily: "inherit" }} />
                  <Button variant="ghost" size="sm" onClick={clearFilters} style={{ fontFamily: "inherit" }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                  <div className="ml-auto flex gap-1 border rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("list")}
                      style={{
                        fontFamily: "inherit",
                        background: viewMode === "list" ? "rgba(var(--theme-color-rgb), 0.1)" : "",
                        color: viewMode === "list" ? "var(--theme-color)" : "",
                        borderColor: viewMode === "list" ? "var(--theme-color)" : ""
                      }}
                    >
                      <List className="h-4 w-4 mr-1" /> List
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      style={{
                        fontFamily: "inherit",
                        background: viewMode === "calendar" ? "rgba(var(--theme-color-rgb), 0.1)" : "",
                        color: viewMode === "calendar" ? "var(--theme-color)" : "",
                        borderColor: viewMode === "calendar" ? "var(--theme-color)" : ""
                      }}
                    >
                      <CalendarDays className="h-4 w-4 mr-1" /> Calendar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stageFilter && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                <span>
                  Showing leads in{" "}
                  <strong className="text-foreground">{stageLabel(stageFilter)}</strong>
                  {pagination.total > 0
                    ? ` (${pagination.total} lead${pagination.total === 1 ? "" : "s"})`
                    : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    setStageFilter("");
                    setPage(1);
                  }}
                  style={{ fontFamily: "inherit" }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear stage
                </Button>
              </div>
            )}

            {viewMode === "list" ? (
              <Card className="shadow-sm border-muted-foreground/10">
                <CardContent className="p-0">
                  {listLoading && items.length === 0 ? (
                    <div className="p-6 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : items.length === 0 && !listLoading ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No leads match your filters</p>
                      <p className="text-sm mt-1">
                        {stageFilter
                          ? `No leads in the ${stageLabel(stageFilter)} stage with the current filters.`
                          : "Try adjusting filters or log a new follow-up."}
                      </p>
                      {(stageFilter || statusFilter !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={clearFilters}
                          style={{ fontFamily: "inherit" }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="relative overflow-auto max-h-[min(70vh,720px)] rounded-md border">
                      {listLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <Table>
                        <TableHeader style={{ background: "rgba(var(--theme-color-rgb), 0.06)" }}>
                          <TableRow className="bg-background hover:bg-background border-b">
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lead</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Source</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Follow-ups</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</TableHead>
                            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }} className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((row) => (
                            <TableRow
                              key={`${row.leadId}-${row.activityId}`}
                              className={row.status === "overdue" ? "bg-red-50/50" : ""}
                            >
                              <TableCell>
                                <button
                                  type="button"
                                  className="font-medium hover:underline text-left"
                                  style={{ color: "var(--theme-color)", fontFamily: "inherit" }}
                                  onClick={() => navigate(`/leads/${row.leadId}`)}
                                >
                                  {row.leadName}
                                </button>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatPascalCaseDisplayName(
                                  row.companySource || "unknown",
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div style={{ background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" }} className="h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center">
                                    {initials(row.assigneeName)}
                                  </div>
                                  <span className="text-sm truncate max-w-[100px]">{row.assigneeName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={stageColor(row.stage)}>
                                  {stageLabel(row.stage)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {row.lastFollowUpDate
                                  ? String(row.lastFollowUpDate).slice(0, 10)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                <span className={row.status === "overdue" ? "text-red-600 font-medium" : ""}>
                                  {row.nextFollowUpDate || "—"}
                                  {row.nextFollowUpTime ? ` ${row.nextFollowUpTime}` : ""}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">{row.followUpType}</TableCell>
                              <TableCell>{row.followUpCount}</TableCell>
                              <TableCell>
                                <Badge className={statusColor(row.status)}>{row.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={priorityColor(row.priority)}>
                                  {row.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                                {row.notesPreview || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ fontFamily: "inherit" }}
                                    onClick={() => {
                                      setLogLead({ id: row.leadId, name: row.leadName });
                                      setLogOpen(true);
                                    }}
                                  >
                                    Log
                                  </Button>
                                  {row.activityId && row.status !== "completed" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        style={{ fontFamily: "inherit" }}
                                        onClick={() => {
                                          setRescheduleTarget(row);
                                          setRescheduleDate(
                                            row.nextFollowUpDate
                                              ? String(row.nextFollowUpDate).slice(0, 10)
                                              : today,
                                          );
                                          setRescheduleTime(
                                            row.nextFollowUpTime || "10:00",
                                          );
                                          setRescheduleOpen(true);
                                        }}
                                      >
                                        Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        style={{ fontFamily: "inherit" }}
                                        onClick={() => {
                                          setStatusTarget(row);
                                          setStatusValue(row.status || "scheduled");
                                          setStatusOpen(true);
                                        }}
                                      >
                                        Status
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        style={{ fontFamily: "inherit" }}
                                        onClick={() => markDone(row.activityId)}
                                      >
                                        Done
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    style={{ fontFamily: "inherit" }}
                                    onClick={() => navigate(`/leads/${row.leadId}`)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {!listLoading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} · {pagination.total} leads
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          style={{ fontFamily: "inherit" }}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= pagination.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          style={{ fontFamily: "inherit" }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-muted-foreground/10">
                <CardHeader>
                  <CardTitle className="text-base">Follow-up Calendar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                  {summaryLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : calendarDates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No scheduled follow-ups in range.</p>
                  ) : (
                    calendarDates.map((date) => (
                      <div key={date} className="border rounded-lg p-3">
                        <div className="font-medium text-sm mb-2 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-theme" />
                          {date}
                          {date === today && (
                            <Badge className="bg-orange-100 text-orange-800">Today</Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          {calendarByDate[date].map((ev) => (
                            <button
                              key={ev.activityId}
                              type="button"
                              className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-all hover:shadow-sm ${
                                ev.color === "overdue"
                                  ? "bg-red-50 border-red-200"
                                  : ev.color === "today"
                                    ? "bg-orange-50 border-orange-200"
                                    : ev.color === "done"
                                      ? "bg-green-50 border-green-200"
                                      : "rgba(var(--theme-color-rgb), 0.05) border-theme-light"
                              }`}
                              style={{ fontFamily: "inherit" }}
                              onClick={() => navigate(`/leads/${ev.leadId}`)}
                            >
                              <span className="font-medium text-theme">{ev.leadName}</span>
                              <span className="text-muted-foreground ml-2">{ev.time}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="sticky top-4 shadow-sm border-muted-foreground/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Leaderboard</CardTitle>
                <Select value={leaderboardSort} onValueChange={setLeaderboardSort}>
                  <SelectTrigger className="h-8 text-xs mt-2" style={{ fontFamily: "inherit" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Most Active</SelectItem>
                    <SelectItem value="missed">Most Missed</SelectItem>
                    <SelectItem value="completion">Best Completion</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
                {summaryLoading ? (
                  [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : sortedLeaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
                ) : (
                  sortedLeaderboard.map((person, idx) => {
                    const medal = getMedalStyle(idx);
                    
                    let itemClass = "flex gap-3 p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 shadow-sm";
                    let avatarClass = "h-9 w-9 rounded-full text-sm font-semibold flex items-center justify-center flex-shrink-0";
                    let avatarStyle: React.CSSProperties = {};
                    let medalClass = "font-bold flex-shrink-0 mt-1 rounded-full flex items-center justify-center";

                    if (idx === 0) { // Gold
                      itemClass += " border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-950/5 border-l-4 border-l-amber-500 hover:shadow-amber-500/10";
                      avatarClass += " bg-amber-500/10 text-amber-600 dark:text-amber-400";
                      medalClass += " bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-450 text-sm";
                    } else if (idx === 1) { // Silver
                      itemClass += " border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100/30 dark:from-slate-900/20 dark:to-slate-900/5 border-l-4 border-l-slate-450 hover:shadow-slate-400/10";
                      avatarClass += " bg-slate-500/10 text-slate-600 dark:text-slate-400";
                      medalClass += " bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm";
                    } else if (idx === 2) { // Bronze
                      itemClass += " border-orange-200 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/60 to-orange-100/20 dark:from-orange-950/20 dark:to-orange-950/5 border-l-4 border-l-orange-500 hover:shadow-orange-500/10";
                      avatarClass += " bg-orange-500/10 text-orange-600 dark:text-orange-400";
                      medalClass += " bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-450 text-sm";
                    } else {
                      itemClass += " border-border bg-card border-l-4 border-l-transparent hover:border-primary hover:border-l-primary hover:shadow-primary/10";
                      avatarStyle = {
                        background: "rgba(var(--theme-color-rgb), 0.1)",
                        color: "var(--theme-color)"
                      };
                      medalClass += " bg-transparent text-muted-foreground text-xs";
                    }

                    return (
                      <div
                        key={person.id}
                        className={itemClass}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            fontSize: idx < 3 ? 14 : 11,
                          }}
                          className={medalClass}
                        >
                          {medal.label}
                        </div>
                        <div 
                          style={avatarStyle} 
                          className={avatarClass}
                        >
                          {initials(person.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground truncate">{person.name}</p>
                          <div className="grid grid-cols-2 gap-x-2 text-[11px] text-muted-foreground mt-1.5">
                            <span>Month: <strong className="text-foreground font-semibold">{person.totalThisMonth}</strong></span>
                            <span>Missed: <strong className="text-red-600 font-semibold">{person.missedCount}</strong></span>
                            <span>Done: <strong className="text-green-600 font-semibold">{person.completionRate}%</strong></span>
                            <span>Pipeline: <strong className="text-foreground font-semibold">{person.pipelineLeads}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <LogFollowUpModal
          open={logOpen}
          onOpenChange={setLogOpen}
          leadId={logLead?.id}
          leadName={logLead?.name}
          users={users}
          onSaved={() => {
            void fetchAll();
          }}
        />

        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Follow-up</DialogTitle>
              <DialogDescription>
                Choose a new date and time for this follow-up.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <p className="text-sm font-semibold text-theme">
                {rescheduleTarget?.leadName}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ fontFamily: "inherit" }} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} style={{ fontFamily: "inherit" }} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleOpen(false)} style={{ fontFamily: "inherit" }}>Cancel</Button>
              <Button onClick={submitReschedule} style={{ fontFamily: "inherit" }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Follow-up Status</DialogTitle>
              <DialogDescription>
                Track the current stage of this follow-up for {statusTarget?.leadName}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label>Status</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger className="mt-2" style={{ fontFamily: "inherit" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusOpen(false)} style={{ fontFamily: "inherit" }}>
                Cancel
              </Button>
              <Button onClick={submitStatusUpdate} style={{ fontFamily: "inherit" }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

function AlertBlock({
  title,
  accentColor,
  items,
}: {
  title: string;
  accentColor: string;
  items: string[];
}) {
  const [hovered, setHovered] = useState(false);
  
  const bg = accentColor.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.04)" : `${accentColor}0a`;
  const border = accentColor.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${accentColor}25`;
  const glow = accentColor.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${accentColor}20`;

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: "12px",
        padding: "14px",
        transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease",
        boxShadow: hovered ? `0 8px 24px ${glow}` : "0 1px 3px rgba(0,0,0,0.02)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ fontSize: 10, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase", color: accentColor }} className="mb-3">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None</p>
      ) : (
        <ul className="text-xs space-y-1.5 max-h-24 overflow-y-auto pr-1 no-scrollbar">
          {items.slice(0, 10).map((item, i) => (
            <li key={i} className="flex items-center gap-1.5 text-foreground/80 font-medium">
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: accentColor }} />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FollowUpManagementPage;
