import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import LogFollowUpModal from "./LogFollowUpModal";
import {
  KPI_FORMULAS,
  PIPELINE_STAGES,
  capConversionRate,
  priorityColor,
  priorityLabel,
  stageColor,
  stageLabel,
  tableStatusColor,
} from "./followUpConstants";

interface DashboardStats {
  todayFollowups: number;
  overdue: number;
  conversionRate: number;
  monthDone: number;
  monthPending: number;
  totalFollowups?: number;
  pendingAll?: number;
  avgFollowupsPerLead?: number;
}

interface FollowUpRow {
  leadId: string;
  activityId: number | null;
  leadName: string;
  phone?: string;
  companySource: string;
  assigneeName: string;
  stage: string;
  leadStatus: string;
  tableStatus: string;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  followUpType: string;
  followUpCount: number;
  status: string;
  priority: string;
  notesPreview: string;
}

const KPI_CARDS = [
  {
    key: "todayFollowups" as const,
    label: "Today's Follow-ups",
    icon: Calendar,
    filter: { status: "today" },
    formulaKey: "todayFollowups" as const,
  },
  {
    key: "overdue" as const,
    label: "Overdue Follow-ups",
    icon: AlertTriangle,
    filter: { status: "overdue" },
    formulaKey: "overdue" as const,
    danger: true,
  },
  {
    key: "conversionRate" as const,
    label: "Conversion Rate",
    icon: TrendingUp,
    filter: {},
    formulaKey: "conversionRate" as const,
    suffix: "%",
  },
  {
    key: "monthDone" as const,
    label: "This Month: Done vs Pending",
    icon: Calendar,
    filter: {},
    formulaKey: "monthDonePending" as const,
    isRatio: true,
  },
];

const FollowUpManagementPage = () => {
  const navigate = useNavigate();
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
      conversionRate: number;
    }[]
  >([]);
  const [alerts, setAlerts] = useState<{
    overdue: { activityId: number; leadId: string; leadName: string; daysOverdue: number }[];
    dueToday: { activityId: number; leadId: string; leadName: string }[];
  }>({ overdue: [], dueToday: [] });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [logLead, setLogLead] = useState<{ id: string; name: string } | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("10:00");

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [salesperson, setSalesperson] = useState("all");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const buildListParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = { page: String(page), limit: "25" };
    if (searchDebounced.trim()) params.search = searchDebounced.trim();
    if (salesperson !== "all") params.salesperson = salesperson;
    if (stageFilter) params.stage = stageFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (priorityFilter !== "all") params.priority = priorityFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [page, searchDebounced, salesperson, stageFilter, statusFilter, priorityFilter, dateFrom, dateTo]);

  const fetchAll = useCallback(async () => {
    setSummaryLoading(true);
    setListLoading(true);
    try {
      const res = await axiosInstance.get("/followups/dashboard", {
        params: buildListParams(),
      });
      const data = res.data;
      setStats({
        ...data.stats,
        conversionRate: capConversionRate(data.stats?.conversionRate ?? 0),
      });
      setPipeline(data.pipeline || {});
      setLeaderboard(data.leaderboard || []);
      setAlerts(data.alerts || { overdue: [], dueToday: [] });
      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
      setListLoading(false);
    }
  }, [buildListParams]);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await axiosInstance.get("/followups/dashboard", {
        params: buildListParams(),
      });
      setItems(res.data.items || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  }, [buildListParams]);

  useEffect(() => {
    void fetchAll();
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
    axiosInstance
      .get("/users")
      .then((res) => {
        const list = (res.data?.data || res.data || []).map(
          (u: { id: string; name: string }) => ({ id: u.id, name: u.name }),
        );
        setUsers(list);
      })
      .catch(() => setUsers([]));
  }, []);

  const applyKpiFilter = (filter: Record<string, string>) => {
    if (filter.status) setStatusFilter(filter.status);
    setPage(1);
  };

  const toggleExpand = (leadId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget?.activityId || !rescheduleDate) return;
    try {
      await axiosInstance.post(
        `/followups/${rescheduleTarget.activityId}/reschedule`,
        { scheduleOn: `${rescheduleDate}T${rescheduleTime}` },
      );
      setRescheduleOpen(false);
      void fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const monthProgress = useMemo(() => {
    if (!stats) return 0;
    const total = stats.monthDone + stats.monthPending;
    return total > 0 ? Math.round((stats.monthDone / total) * 100) : 0;
  }, [stats]);

  return (
    <TooltipProvider>
      <div style={{ height: "100%", overflowY: "auto", background: "rgba(var(--theme-color-rgb), 0.02)", padding: "22px 24px" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>
              FOLLOW-UPS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "baseline", gap: 8 }}>
              Follow-Up Management
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.1)", padding: "2px 10px", borderRadius: 20 }}>
                {pagination.total}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => void fetchAll()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", height: 36, background: "hsl(var(--card))",
                color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))",
                borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-0.5" /> Refresh
            </button>
            <button
              onClick={() => { setLogLead(null); setLogOpen(true); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", height: 36, background: "var(--theme-color)", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 2px 8px rgba(var(--theme-color-rgb), 0.3)",
              }}
            >
              <Plus className="h-4 w-4 mr-0.5" /> Log Follow-up
            </button>
          </div>
        </div>

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI_CARDS.map((kpi) => {
            const Icon = kpi.icon;
            const value = stats?.[kpi.key];
            const displayValue = kpi.isRatio
              ? stats
                ? `${stats.monthDone} done / ${stats.monthPending} pending`
                : "—"
              : `${value ?? 0}${kpi.suffix ?? ""}`;

            const color = kpi.danger ? "#EF4444" : kpi.isRatio ? "#8B5CF6" : kpi.key === "conversionRate" ? "#10B981" : "var(--theme-color)";
            const bg = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.04)" : `${color}0d`;
            const border = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${color}25`;
            const glow = color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.15)" : `${color}20`;

            return (
              <Card
                key={kpi.key}
                className={kpi.danger ? "border-red-200" : ""}
                style={{
                  background: bg,
                  borderColor: border,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
                }}
                onClick={() => applyKpiFilter(kpi.filter)}
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                        {kpi.label}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {KPI_FORMULAS[kpi.formulaKey]}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-20 mt-2" />
                    ) : kpi.isRatio ? (
                      <div className="space-y-2 mt-2">
                        <p className="text-lg font-bold text-foreground">{displayValue}</p>
                        <Progress value={monthProgress} className="h-1.5" />
                      </div>
                    ) : (
                      <p className="text-2xl font-black mt-2 text-foreground">
                        {displayValue}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      background: color.startsWith("var")
                        ? "linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15), rgba(var(--theme-color-rgb), 0.03))"
                        : `linear-gradient(135deg, ${color}26, ${color}08)`,
                      boxShadow: `0 4px 10px ${color.startsWith("var") ? "rgba(var(--theme-color-rgb), 0.05)" : color + "12"}`
                    }}
                    className="p-2.5 rounded-xl flex-shrink-0 ml-3"
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

        {/* Pipeline (compact) */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, margin: "14px 0" }}>
          {PIPELINE_STAGES.map((stage) => {
            const active = stageFilter === stage.id;
            const count = pipeline[stage.id] ?? 0;
            
            let pillColor = "#6366F1";
            if (stage.id === "new") pillColor = "#64748B";
            else if (stage.id === "contacted") pillColor = "#3B82F6";
            else if (stage.id === "site_visit_negotiation") pillColor = "#8B5CF6";
            else if (stage.id === "won") pillColor = "#10B981";
            else if (stage.id === "lost") pillColor = "#EF4444";

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  setStageFilter(stageFilter === stage.id ? "" : stage.id);
                  setPage(1);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 14px", borderRadius: 20, flexShrink: 0,
                  border: `1.5px solid ${active ? pillColor : "hsl(var(--border))"}`,
                  background: active ? `${pillColor}15` : "hsl(var(--card))",
                  color: active ? pillColor : "hsl(var(--muted-foreground))",
                  fontSize: 11, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: pillColor }} />
                {stage.short}
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: active ? pillColor : "hsl(var(--muted))",
                  color: active ? "#fff" : "hsl(var(--muted-foreground))",
                  padding: "1px 6px", borderRadius: 10,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts: Overdue + Due Today only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <CardHeader className="pb-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <CardTitle className="text-xs font-bold text-red-600 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" /> Overdue (oldest first)
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1 p-2">
              {alerts.overdue.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">No overdue follow-ups</p>
              ) : (
                alerts.overdue.map((a) => (
                  <button
                    key={a.activityId}
                    type="button"
                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center"
                    onClick={() => navigate(`/leads/${a.leadId}`)}
                  >
                    <span className="font-semibold text-foreground">{a.leadName}</span>
                    <span style={{ fontSize: 10, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "1px 8px", borderRadius: 20, fontWeight: 600 }}>{a.daysOverdue}d overdue</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <CardHeader className="pb-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Due Today
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1 p-2">
              {alerts.dueToday.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">Nothing due today</p>
              ) : (
                alerts.dueToday.map((a) => (
                  <button
                    key={a.activityId}
                    type="button"
                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors font-semibold text-foreground"
                    onClick={() => navigate(`/leads/${a.leadId}`)}
                  >
                    {a.leadName}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "hsl(var(--card))", borderRadius: 12, padding: "10px 14px", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 200 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search leads..."
              style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 36, border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, outline: "none", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Select value={salesperson} onValueChange={(v) => { setSalesperson(v); setPage(1); }}>
              <SelectTrigger style={{ height: 36, borderRadius: 8, fontSize: 12, width: 150 }} className="bg-card border border-border">
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
              <SelectTrigger style={{ height: 36, borderRadius: 8, fontSize: 12, width: 130 }} className="bg-card border border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="pending">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
              <SelectTrigger style={{ height: 36, borderRadius: 8, fontSize: 12, width: 130 }} className="bg-card border border-border">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">Hot</SelectItem>
                <SelectItem value="medium">Warm</SelectItem>
                <SelectItem value="low">Cold</SelectItem>
              </SelectContent>
            </Select>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ height: 36, padding: "0 10px", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontFamily: "inherit" }} />
              <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ height: 36, padding: "0 10px", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontFamily: "inherit" }} />
            </div>
          </div>
        </div>

        {/* 6-column table with expandable rows */}
        <Card style={{ borderRadius: 14, overflow: "hidden", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-0">
            <Table>
              <TableHeader style={{ background: "rgba(var(--theme-color-rgb), 0.05)" }}>
                <TableRow className="border-b">
                  <TableHead className="w-8" />
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lead Name</TableHead>
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned</TableHead>
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Follow-up</TableHead>
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableHead>
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</TableHead>
                  <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => {
                    const expanded = expandedRows.has(row.leadId);
                    return (
                      <Fragment key={row.leadId}>
                        <TableRow className="hover:bg-muted/40 transition-colors border-b">
                          <TableCell>
                            <button type="button" onClick={() => toggleExpand(row.leadId)}>
                              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{row.leadName}</TableCell>
                          <TableCell>{row.assigneeName}</TableCell>
                          <TableCell>
                            {row.nextFollowUpDate
                              ? `${row.nextFollowUpDate}${row.nextFollowUpTime ? ` ${row.nextFollowUpTime}` : ""}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={tableStatusColor(row.status, row.leadStatus)}>
                              {row.tableStatus || row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityColor(row.priority)}>
                              {priorityLabel(row.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                              <button
                                onClick={() => { setLogLead({ id: row.leadId, name: row.leadName }); setLogOpen(true); }}
                                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.08)", border: "none", borderRadius: 6, cursor: "pointer" }}
                              >
                                Log
                              </button>
                              <button
                                disabled={!row.activityId}
                                onClick={() => {
                                  setRescheduleTarget(row);
                                  setRescheduleDate(row.nextFollowUpDate || "");
                                  setRescheduleOpen(true);
                                }}
                                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "none", borderRadius: 6, cursor: "pointer", opacity: !row.activityId ? 0.5 : 1 }}
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => navigate(`/leads/${row.leadId}`)}
                                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))", border: "none", borderRadius: 6, cursor: "pointer" }}
                              >
                                View
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow key={`${row.leadId}-detail`}>
                            <TableCell colSpan={7} style={{ background: "rgba(var(--theme-color-rgb), 0.015)" }} className="text-xs">
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, padding: "12px 16px" }}>
                                <div><strong style={{ color: "hsl(var(--muted-foreground))" }}>Source:</strong> {row.companySource}</div>
                                <div><strong style={{ color: "hsl(var(--muted-foreground))" }}>Type:</strong> {row.followUpType}</div>
                                <div><strong style={{ color: "hsl(var(--muted-foreground))" }}>Follow-ups:</strong> {row.followUpCount}</div>
                                <div><strong style={{ color: "hsl(var(--muted-foreground))" }}>Stage:</strong> {stageLabel(row.stage)}</div>
                                <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "hsl(var(--muted-foreground))" }}>Notes:</strong> {row.notesPreview || "—"}</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 500 }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ padding: "6px 12px", border: "1px solid hsl(var(--border))", borderRadius: 8, background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600, cursor: pagination.page <= 1 ? "not-allowed" : "pointer", opacity: pagination.page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: "6px 12px", border: "1px solid hsl(var(--border))", borderRadius: 8, background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600, cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Advanced stats */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Advanced Stats & Leaderboard
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border p-3">Total follow-ups: <strong>{stats.totalFollowups ?? 0}</strong></div>
                <div className="rounded-lg border p-3">Pending (all): <strong>{stats.pendingAll ?? 0}</strong></div>
                <div className="rounded-lg border p-3">Avg / lead: <strong>{stats.avgFollowupsPerLead ?? 0}</strong></div>
              </div>
            )}
            <Card>
              <CardHeader><CardTitle className="text-sm">Salesperson Leaderboard (this month)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Missed</TableHead>
                      <TableHead>Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.totalThisMonth}</TableCell>
                        <TableCell className="text-red-600">{u.missedCount}</TableCell>
                        <TableCell>{capConversionRate(u.conversionRate)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <LogFollowUpModal
          open={logOpen}
          onOpenChange={setLogOpen}
          leadId={logLead?.id}
          leadName={logLead?.name}
          users={users}
          onSaved={() => void fetchAll()}
        />

        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Follow-up</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitReschedule()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default FollowUpManagementPage;
