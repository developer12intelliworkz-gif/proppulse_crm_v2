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
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Follow-Up Management</h1>
            <p className="text-sm text-muted-foreground">
              Track calls, close leads with dispositions, and focus on what needs action today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void fetchAll()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" onClick={() => { setLogLead(null); setLogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Log Follow-up
            </Button>
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

            return (
              <Card
                key={kpi.key}
                className={`cursor-pointer transition-shadow hover:shadow-md ${kpi.danger ? "border-red-200" : ""}`}
                onClick={() => applyKpiFilter(kpi.filter)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {KPI_FORMULAS[kpi.formulaKey]}
                      </TooltipContent>
                    </Tooltip>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : kpi.isRatio ? (
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">{displayValue}</p>
                      <Progress value={monthProgress} className="h-2" />
                    </div>
                  ) : (
                    <p className={`text-2xl font-bold ${kpi.danger ? "text-red-600" : ""}`}>
                      {displayValue}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pipeline (compact) */}
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setStageFilter(stageFilter === stage.id ? "" : stage.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${stageColor(stage.id)} ${stageFilter === stage.id ? "ring-2 ring-primary" : ""}`}
            >
              {stage.short}
              <Badge variant="secondary" className="h-5 px-1.5">
                {pipeline[stage.id] ?? 0}
              </Badge>
            </button>
          ))}
        </div>

        {/* Alerts: Overdue + Due Today only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Overdue (oldest first)
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {alerts.overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue follow-ups</p>
              ) : (
                alerts.overdue.map((a) => (
                  <button
                    key={a.activityId}
                    type="button"
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted flex justify-between"
                    onClick={() => navigate(`/leads/${a.leadId}`)}
                  >
                    <span>{a.leadName}</span>
                    <span className="text-red-600 text-xs">{a.daysOverdue}d overdue</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Due Today
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto space-y-1">
              {alerts.dueToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due today</p>
              ) : (
                alerts.dueToday.map((a) => (
                  <button
                    key={a.activityId}
                    type="button"
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted"
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
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={salesperson} onValueChange={(v) => { setSalesperson(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Salespeople</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="pending">Upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">Hot</SelectItem>
              <SelectItem value="medium">Warm</SelectItem>
              <SelectItem value="low">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" className="w-[150px]" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <Input type="date" className="w-[150px]" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        {/* 6-column table with expandable rows */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <TableRow className="hover:bg-muted/40">
                          <TableCell>
                            <button type="button" onClick={() => toggleExpand(row.leadId)}>
                              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">{row.leadName}</TableCell>
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
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setLogLead({ id: row.leadId, name: row.leadName }); setLogOpen(true); }}
                            >
                              Log
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!row.activityId}
                              onClick={() => {
                                setRescheduleTarget(row);
                                setRescheduleDate(row.nextFollowUpDate || "");
                                setRescheduleOpen(true);
                              }}
                            >
                              Reschedule
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/leads/${row.leadId}`)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow key={`${row.leadId}-detail`}>
                            <TableCell colSpan={7} className="bg-muted/20 text-sm">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 px-4">
                                <div><span className="text-muted-foreground">Source:</span> {row.companySource}</div>
                                <div><span className="text-muted-foreground">Type:</span> {row.followUpType}</div>
                                <div><span className="text-muted-foreground">Follow-ups:</span> {row.followUpCount}</div>
                                <div><span className="text-muted-foreground">Stage:</span> {stageLabel(row.stage)}</div>
                                <div className="col-span-full"><span className="text-muted-foreground">Notes:</span> {row.notesPreview || "—"}</div>
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
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
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
