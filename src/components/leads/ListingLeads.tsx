"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Component,
  ReactNode,
} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildLeadsListUrl,
  parseLeadsPageFromSearch,
  rememberLeadsReturnTo,
} from "@/utils/leadsPagination";
import axiosInstance from "@/api/axiosInstance";
import CreateLeadForm from "./CreateLeadForm";
import LeadTable from "./LeadTable";
import PaginationControls from "./PaginationControls";
import Progress from "./Progress";
import ErrorMessage from "./ErrorMessage";
import AssignLeadModal from "./AssignLeadModal";
import LeadDeleteConfirmDialog from "./LeadDeleteConfirmDialog";
import { bulkDeleteLeads } from "./leadDeleteApi";
import { useLeads } from "../../contexts/LeadsContext";
import { sortLeadsByNewestFirst } from "@/utils/sortLeads";
import { format, parseISO } from "date-fns";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import { buildLeadIndexMap, getLeadSku } from "@/utils/skuUtils";

// Error Boundary
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError)
      return <h1>Something went wrong. Please refresh the page.</h1>;
    return this.props.children;
  }
}

// Interfaces
export interface LocalLead {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  lead_type: string;
  address: string | null;
  property_type: string | null;
  budget: string | null;
  message: string | null;
  status: string;
  interested_project_id: number | null;
  project_name: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  interest_level: string | null;
}

interface Project {
  id: number;
  name: string;
}
interface LeadType {
  id: string;
  name: string;
  logo_image?: string | null;
  logo_name?: string | null;
  logo_url?: string | null;
}
interface ListingLeadsProps {
  showExtraContent?: boolean;
}

interface FilterValues {
  startDate: string;
  endDate: string;
  statuses: string[];
  leadTypes: string[];
  assignedTo: string[];
  interestLevels: string[];
  projects: string[];
}
const defaultFilters: FilterValues = {
  startDate: "",
  endDate: "",
  statuses: [],
  leadTypes: [],
  assignedTo: [],
  interestLevels: [],
  projects: [],
};

const formatBudget = (budget: string | null): string => {
  if (!budget) return "N/A";
  const rangeMatch = budget.match(
    /\$?(\d+\.?\d*[KMB]?)\s*-\s*\$?(\d+\.?\d*[KMB]?)/i,
  );
  if (rangeMatch) budget = rangeMatch[1];
  let numericValue = budget.replace(/[^\d.KMB]/g, "");
  let multiplier = 1;
  if (numericValue.toUpperCase().endsWith("K")) {
    multiplier = 1000;
    numericValue = numericValue.replace(/[Kk]/, "");
  } else if (numericValue.toUpperCase().endsWith("M")) {
    multiplier = 1000000;
    numericValue = numericValue.replace(/[Mm]/, "");
  } else if (numericValue.toUpperCase().endsWith("B")) {
    multiplier = 1000000000;
    numericValue = numericValue.replace(/[Bb]/, "");
  }
  const parsedValue = parseFloat(numericValue);
  if (isNaN(parsedValue)) return "-";
  return (parsedValue * multiplier).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const mapLocalLeadToFormData = (localLead: LocalLead) => {
  let level = (localLead.interest_level || "").toLowerCase().trim();
  if (level === "medium") level = "warm";
  if (level === "high") level = "hot";
  if (level === "low") level = "cold";
  
  return {
    id: localLead.id,
    name: localLead.name || "",
    email: localLead.email || "",
    phone: localLead.phone || "",
    lead_type: localLead.lead_type,
    address: localLead.address || "",
    property_type: localLead.property_type || "",
    budget: localLead.budget || "",
    message: localLead.message || "",
    interested_project_id: localLead.interested_project_id?.toString() || "none",
    status: localLead.status || "new",
    assigned_to: localLead.assigned_to || null,
    interest_level: level,
  };
};

const ListingLeads: React.FC<ListingLeadsProps> = ({
  showExtraContent = true,
}) => {
  const { user, token, isAuthenticated, logout, hasPermission } = useAuth();
  const { leads: allLeads, fetchLeads, updateLeadStatus, isLoading, error } = useLeads();

  const [displayedLeads, setDisplayedLeads] = useState<LocalLead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] =
    useState<LocalLead | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() =>
    parseLeadsPageFromSearch(searchParams.toString()),
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [selectedLeadType, setSelectedLeadType] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LocalLead | null>(null);
  const [usersMap, setUsersMap] = useState<{ [key: string]: string }>({});
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);
  const [deletingLeads, setDeletingLeads] = useState(false);
  const navigate = useNavigate();

  const canDeleteLeads = hasPermission("delete_leads");
  const canExportLeads = hasPermission("export_leads");
  const canCreateLeads = hasPermission("create_leads");

  const syncPageToUrl = useCallback(
    (page: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (page <= 1) next.delete("page");
          else next.set("page", String(page));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      const safe = Math.max(1, page);
      setCurrentPage(safe);
      syncPageToUrl(safe);
    },
    [syncPageToUrl],
  );

  useEffect(() => {
    const urlPage = parseLeadsPageFromSearch(searchParams.toString());
    if (urlPage !== currentPage) setCurrentPage(urlPage);
  }, [searchParams]);

  const memoizedSetFilterText = useCallback(
    (value: string) => setFilterText(value),
    [],
  );

  // Fetchers
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !token) return navigate("/login");
    try {
      setProjects((await axiosInstance.get("/projects")).data.data);
    } catch (e: any) {
      if (e.response?.status === 403) logout();
    }
  }, [isAuthenticated, token, navigate, logout]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !token) return navigate("/login");
    try {
      const usersData = (await axiosInstance.get("/users")).data.reduce(
        (acc: any, u: any) => ({ ...acc, [u.id]: u.name }),
        {},
      );
      setUsersMap(usersData);
    } catch (e: any) {
      if (e.response?.status === 403) logout();
    }
  }, [isAuthenticated, token, navigate, logout]);

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !token) return navigate("/login");
    const statuses = [
      "New",
      "Contacted",
      "Qualified",
      "Working",
      "Proposal Sent",
      "Lost",
    ];
    const newCounts: { [k: string]: number } = {};
    for (const s of statuses) {
      try {
        const { pagination } = (
          await axiosInstance.get("/leads", {
            params: { status: s.toLowerCase().replace(/\s+/g, " ") },
          })
        ).data;
        newCounts[s] = pagination.total || 0;
      } catch {
        newCounts[s] = 0;
      }
    }
    setCounts(newCounts);
  }, [isAuthenticated, token, navigate]);

  const fetchLeadTypes = useCallback(async () => {
    if (!isAuthenticated || !token) return navigate("/login");
    try {
      setLeadTypes((await axiosInstance.get("/leadtype")).data || []);
    } catch (e: any) {
      if (e.response?.status === 403) logout();
    }
  }, [isAuthenticated, token, navigate, logout]);

  const leadTypeCounts = useMemo(() => {
    const c: { [k: string]: number } = { all: allLeads.length };
    leadTypes.forEach((lt) => (c[lt.name] = 0));
    allLeads.forEach((l) => {
      if (l.lead_type) c[l.lead_type] = (c[l.lead_type] || 0) + 1;
    });
    return c;
  }, [allLeads, leadTypes]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && token) {
      Promise.all([
        fetchProjects(),
        fetchCounts(),
        fetchLeads(true, filterText, selectedLeadType),
        fetchLeadTypes(),
        fetchUsers(),
      ]);
    } else navigate("/login");
  }, [
    isAuthenticated,
    token,
    fetchProjects,
    fetchCounts,
    fetchLeads,
    fetchLeadTypes,
    fetchUsers,
    navigate,
    filterText,
    selectedLeadType,
  ]);

  const filteredLeads = useMemo(() => {
    let enriched = allLeads.map((l) => ({
      ...l,
      assigned_to_name: usersMap[l.assigned_to?.toString()] || "Unassigned",
    }));

    if (filters.statuses.length)
      enriched = enriched.filter((l) =>
        filters.statuses.includes(l.status.toLowerCase()),
      );
    if (filters.leadTypes.length)
      enriched = enriched.filter((l) =>
        filters.leadTypes.includes(l.lead_type),
      );
    if (filters.assignedTo.length)
      enriched = enriched.filter((l) =>
        filters.assignedTo.includes(l.assigned_to || ""),
      );
    if (filters.interestLevels.length)
      enriched = enriched.filter((l) =>
        filters.interestLevels.includes(l.interest_level || ""),
      );
    if (filters.projects.length)
      enriched = enriched.filter((l) =>
        filters.projects.includes(l.interested_project_id?.toString() || ""),
      );
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      enriched = enriched.filter((l) => {
        const created = parseISO(l.created_at);
        return created >= start && created <= end;
      });
    }

    if (filterText)
      enriched = enriched.filter(
        (l) =>
          l.name?.toLowerCase().includes(filterText.toLowerCase()) ||
          l.email?.toLowerCase().includes(filterText.toLowerCase()) ||
          l.phone?.toLowerCase().includes(filterText.toLowerCase()) ||
          l.assigned_to_name?.toLowerCase().includes(filterText.toLowerCase()),
      );

    if (selectedLeadType !== "all" && filters.leadTypes.length === 0) {
      enriched = enriched.filter((l) => l.lead_type === selectedLeadType);
    }

    return sortLeadsByNewestFirst(enriched);
  }, [allLeads, filterText, selectedLeadType, filters, usersMap]);

  // Pagination
  useEffect(() => {
    const total = filteredLeads.length;
    setTotalPages(Math.ceil(total / rowsPerPage));
    const startIdx = (currentPage - 1) * rowsPerPage;
    setDisplayedLeads(filteredLeads.slice(startIdx, startIdx + rowsPerPage));
  }, [filteredLeads, currentPage, rowsPerPage]);

  const handleExport = () => {
    if (!filteredLeads.length) return;

    const leadIndexMap = buildLeadIndexMap(allLeads);
    const projectNameById = projects.reduce<Record<string, string>>(
      (acc, p) => {
        acc[p.id.toString()] = p.name;
        return acc;
      },
      {},
    );

    const rows = filteredLeads.map((lead) => ({
      SKU: getLeadSku(lead, leadIndexMap),
      "Lead ID": lead.id,
      Name: lead.name || "",
      Email: lead.email || "",
      Phone: lead.phone || "",
      "Lead Type": formatPascalCaseDisplayName(lead.lead_type || ""),
      Status: formatPascalCaseDisplayName(lead.status || ""),
      "Interest Level": lead.interest_level || "",
      "Assigned To": lead.assigned_to_name || "Unassigned",
      Project:
        projectNameById[lead.interested_project_id?.toString() || ""] ||
        lead.project_name ||
        "",
      "Property Type": lead.property_type || "",
      Budget: lead.budget || "",
      Address: lead.address || "",
      Message: lead.message || "",
      "Created At": lead.created_at
        ? format(parseISO(lead.created_at), "dd MMM yyyy HH:mm")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String((r as Record<string, string>)[key] || "").length),
      ),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(
      wb,
      `leads_export_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`,
    );
  };

  const handleViewDetails = useCallback(
    (lead: LocalLead) => {
      const returnTo = buildLeadsListUrl(currentPage);
      rememberLeadsReturnTo(returnTo);
      navigate(`/leads/${lead.id}`, { state: { returnTo } });
    },
    [navigate, currentPage],
  );

  const handleAssignLead = useCallback(
    (lead: LocalLead) => {
      if (!hasPermission("assign_leads")) return;
      setSelectedLeadForAssign(lead);
      setIsAssignModalOpen(true);
    },
    [hasPermission],
  );

  const handleStatusChange = useCallback(
    async (id: number, newStatus: string) => {
      if (!isAuthenticated || !token || !hasPermission("edit_leads")) return;
      // Optimistically update status locally in Redux store
      updateLeadStatus(id, newStatus.toLowerCase());
      try {
        await axiosInstance.put(`/leads/${id}`, {
          status: newStatus.toLowerCase(),
        });
        // Silently refresh counts and lead types in the background
        await Promise.all([
          fetchCounts(),
          fetchLeadTypes(),
        ]);
      } catch (e: any) {
        if (e.response?.status === 403) logout();
        // Revert or sync from server if call fails
        fetchLeads(true, filterText, selectedLeadType);
      }
    },
    [
      isAuthenticated,
      token,
      user?.role,
      updateLeadStatus,
      fetchCounts,
      fetchLeadTypes,
      fetchLeads,
      filterText,
      selectedLeadType,
      logout,
    ],
  );

  const handleFilterApply = (newFilters: FilterValues) => {
    setFilters(newFilters);
    goToPage(1);
  };

  const handleFilterClear = () => {
    setFilters(defaultFilters);
    goToPage(1);
  };

  const refreshLeads = useCallback(
    () =>
      Promise.all([
        fetchLeads(true, filterText, selectedLeadType),
        fetchCounts(),
        fetchLeadTypes(),
      ]),
    [fetchLeads, filterText, selectedLeadType, fetchCounts, fetchLeadTypes],
  );

  const openDeleteDialog = useCallback(
    (ids: number[], leadName?: string | null) => {
      if (!canDeleteLeads || ids.length === 0) return;
      setPendingDeleteIds(ids);
      setPendingDeleteName(leadName ?? null);
      setDeleteDialogOpen(true);
    },
    [canDeleteLeads],
  );

  const handleDeleteLead = useCallback(
    (lead: LocalLead) => openDeleteDialog([lead.id], lead.name),
    [openDeleteDialog],
  );

  const handleToggleLeadSelection = useCallback((id: number, checked: boolean) => {
    setSelectedLeadIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  }, []);

  const handleToggleAllLeads = useCallback(
    (checked: boolean) => {
      setSelectedLeadIds((prev) => {
        const pageIds = displayedLeads.map((l) => l.id);
        if (!checked) return prev.filter((id) => !pageIds.includes(id));
        return [...new Set([...prev, ...pageIds])];
      });
    },
    [displayedLeads],
  );

  const handleConfirmDelete = useCallback(async (shouldExport: boolean) => {
    if (pendingDeleteIds.length === 0) return;
    setDeletingLeads(true);
    try {
      if (shouldExport) {
        const leadsToExport = allLeads.filter((l) => pendingDeleteIds.includes(l.id));
        const leadIndexMap = buildLeadIndexMap(allLeads);
        const projectNameById = projects.reduce<Record<string, string>>(
          (acc, p) => {
            acc[p.id.toString()] = p.name;
            return acc;
          },
          {},
        );

        const rows = leadsToExport.map((lead) => ({
          SKU: getLeadSku(lead, leadIndexMap),
          "Lead ID": lead.id,
          Name: lead.name || "",
          Email: lead.email || "",
          Phone: lead.phone || "",
          "Lead Type": formatPascalCaseDisplayName(lead.lead_type || ""),
          Status: formatPascalCaseDisplayName(lead.status || ""),
          "Interest Level": lead.interest_level || "",
          "Assigned To": lead.assigned_to_name || "Unassigned",
          Project:
            projectNameById[lead.interested_project_id?.toString() || ""] ||
            lead.project_name ||
            "",
          "Property Type": lead.property_type || "",
          Budget: lead.budget || "",
          Address: lead.address || "",
          Message: lead.message || "",
          "Created At": lead.created_at
            ? format(parseISO(lead.created_at), "dd MMM yyyy HH:mm")
            : "",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const colWidths = Object.keys(rows[0] || {}).map((key) => ({
          wch: Math.max(
            key.length,
            ...rows.map((r) => String((r as Record<string, string>)[key] || "").length),
          ),
        }));
        ws["!cols"] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Deleted Leads");
        XLSX.writeFile(
          wb,
          `deleted_leads_export_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`,
        );
      }

      await bulkDeleteLeads(pendingDeleteIds);
      setSelectedLeadIds((prev) =>
        prev.filter((id) => !pendingDeleteIds.includes(id)),
      );
      await refreshLeads();
      setDeleteDialogOpen(false);
      setPendingDeleteIds([]);
      setPendingDeleteName(null);
    } catch (error) {
      console.error("Failed to delete leads:", error);
    } finally {
      setDeletingLeads(false);
    }
  }, [pendingDeleteIds, refreshLeads, allLeads, projects]);

  // Options
  const statusOptions = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "working", label: "Working" },
    { value: "proposal sent", label: "Proposal Sent" },
    { value: "lost", label: "Lost" },
  ];
  const leadTypeOptions = leadTypes.map((lt) => ({
    value: lt.name,
    label: formatPascalCaseDisplayName(lt.name),
  }));
  const assignedToOptions = Object.entries(usersMap).map(([id, name]) => ({
    value: id,
    label: name,
  }));
  const interestLevelOptions = [
    { value: "hot", label: "Hot" },
    { value: "warm", label: "Warm" },
    { value: "cold", label: "Cold" },
  ];
  const projectOptions = projects.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));

  return (
    <ErrorBoundary>
      <div style={{ height: "100%", overflowY: "auto", background: "hsl(var(--background))" }}>
        <div style={{ padding: "22px 24px" }}>
          <ErrorMessage error={error} onLogin={() => navigate("/login")} />

          {/* HEADER */}
          {showExtraContent && (
            <div style={{ display: "flex", alignItems: "center", justifyContext: "space-between", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>LEADS</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "baseline", gap: 8 }}>
                  All Leads
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.1)", padding: "2px 10px", borderRadius: 20 }}>{allLeads?.length ?? 0}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {canDeleteLeads && selectedLeadIds.length > 0 && (
                  <button
                    disabled={isLoading || deletingLeads}
                    onClick={() => openDeleteDialog(selectedLeadIds)}
                    style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",fontSize:12,fontWeight:600,cursor:"pointer" }}
                  >
                    <Trash2 size={13} /> Delete ({selectedLeadIds.length})
                  </button>
                )}
                <button
                  onClick={handleExport}
                  disabled={isLoading || !canExportLeads}
                  style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",height:36,borderRadius:8,background:"hsl(var(--card))",color:"hsl(var(--muted-foreground))",border:"1px solid hsl(var(--border))",fontSize:12,fontWeight:500,cursor:"pointer",opacity:!canExportLeads?0.5:1 }}
                >
                  ↓ Export
                </button>
                <Dialog
                  open={isCreateModalOpen}
                  onOpenChange={(open) => {
                    if (!canCreateLeads) return;
                    setIsCreateModalOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <button
                      disabled={isLoading || !canCreateLeads}
                      style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",height:36,borderRadius:8,background: "var(--theme-color)",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",opacity:(!canCreateLeads)?0.5:1,boxShadow: "0 2px 8px rgba(var(--theme-color-rgb), 0.3)" }}
                    >
                      <Plus size={14} /> Add Lead
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Lead</DialogTitle>
                      <DialogDescription>Enter lead details to add a new lead to the pipeline.</DialogDescription>
                    </DialogHeader>
                    <CreateLeadForm
                      onClose={() => setIsCreateModalOpen(false)}
                      onLeadCreated={() => Promise.all([fetchLeads(true, filterText, selectedLeadType), fetchCounts(), fetchLeadTypes()])}
                      projects={projects}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* PROGRESS COMPONENT */}
          {showExtraContent && (
            <Progress
              counts={counts}
              leadTypeCounts={leadTypeCounts}
              onLeadTypeSelect={(type) => {
                setSelectedLeadType(type);
                goToPage(1);
              }}
              onFilterApply={handleFilterApply}
              onFilterClear={handleFilterClear}
              currentFilters={filters}
              filterText={filterText}
              setFilterText={memoizedSetFilterText}
              selectedLeadType={selectedLeadType}
              isLoading={isLoading}
              statusOptions={statusOptions}
              leadTypeOptions={leadTypeOptions}
              assignedToOptions={assignedToOptions}
              interestLevelOptions={interestLevelOptions}
              projectOptions={projectOptions}
            />
          )}

          {/* TABLE + PAGINATION */}
          <div style={{ marginTop: 16, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 0 }}>
              <LeadTable
                leads={displayedLeads}
                isLoading={isLoading}
                user={user}
                totalLeads={allLeads.length}
                currentPage={currentPage}
                leadsPerPage={rowsPerPage}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
                onEdit={(lead) => {
                  if (!hasPermission("edit_leads")) return;
                  setSelectedLead(lead);
                  setIsEditModalOpen(true);
                }}
                onAssign={handleAssignLead}
                onDelete={handleDeleteLead}
                hasPermission={hasPermission}
                formatBudget={formatBudget}
                canDelete={canDeleteLeads}
                selectedLeadIds={selectedLeadIds}
                onToggleLead={handleToggleLeadSelection}
                onToggleAll={handleToggleAllLeads}
                allLeads={allLeads}
              />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                isLoading={isLoading}
                onPageChange={goToPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  goToPage(1);
                }}
                showRowsPerPage={true}
              />
            </div>
          </div>

          {/* MODALS */}
          {selectedLead && (
            <Dialog
              open={isEditModalOpen}
              onOpenChange={(open) => {
                if (!hasPermission("edit_leads")) return;
                setIsEditModalOpen(open);
                if (!open) setSelectedLead(null);
              }}
            >
              <DialogContent
                className="max-w-2xl h-[80vh] overflow-y-auto"
                aria-describedby="lead-form-description"
              >
                <DialogHeader>
                  <DialogTitle>Edit Lead</DialogTitle>
                </DialogHeader>
                <p id="lead-form-description" className="sr-only">
                  Form to edit lead details.
                </p>
                <CreateLeadForm
                  onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedLead(null);
                  }}
                  onLeadCreated={() =>
                    Promise.all([
                      fetchLeads(true, filterText, selectedLeadType),
                      fetchCounts(),
                      fetchLeadTypes(),
                    ])
                  }
                  projects={projects}
                  initialData={mapLocalLeadToFormData(selectedLead)}
                  isEditMode={true}
                  leadId={selectedLead.id}
                />
              </DialogContent>
            </Dialog>
          )}

          {selectedLeadForAssign && (
            <AssignLeadModal
              isOpen={isAssignModalOpen}
              onClose={() => {
                setIsAssignModalOpen(false);
                setSelectedLeadForAssign(null);
              }}
              leadId={selectedLeadForAssign.id}
              onLeadAssigned={() =>
                fetchLeads(true, filterText, selectedLeadType)
              }
            />
          )}

          <LeadDeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            count={pendingDeleteIds.length}
            leadName={pendingDeleteName}
            deleting={deletingLeads}
            onConfirm={handleConfirmDelete}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ListingLeads;
