import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LeadActions from "./LeadActions";
import { LocalLead } from "./ListingLeads";
import { User } from "@/contexts/AuthContext";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import { Checkbox } from "@/components/ui/checkbox";
import { buildLeadIndexMap, getLeadSku as helperGetLeadSku } from "@/utils/skuUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadTableProps {
  leads: LocalLead[];
  isLoading: boolean;
  user: User | null;
  totalLeads: number;
  currentPage: number;
  leadsPerPage: number;
  useSimpleSerial?: boolean;
  onStatusChange: (id: number, newStatus: string) => void;
  onViewDetails: (lead: LocalLead) => void;
  onEdit: (lead: LocalLead) => void;
  onAssign: (lead: LocalLead) => void;
  onDelete?: (lead: LocalLead) => void;
  hasPermission: (permission: string) => boolean;
  formatBudget: (budget: string | null) => string;
  canDelete?: boolean;
  selectedLeadIds?: number[];
  onToggleLead?: (id: number, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  allLeads?: LocalLead[];
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  user,
  totalLeads,
  currentPage,
  leadsPerPage,
  useSimpleSerial = false,
  onStatusChange,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  hasPermission,
  formatBudget,
  canDelete = false,
  selectedLeadIds = [],
  onToggleLead,
  onToggleAll,
  allLeads = [],
}) => {
  const navigate = useNavigate();

  const allSelected =
    canDelete &&
    leads.length > 0 &&
    leads.every((lead) => selectedLeadIds.includes(lead.id));
  const someSelected =
    canDelete && leads.some((lead) => selectedLeadIds.includes(lead.id));

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: "bg-blue-50 text-blue-750 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30",
      qualified: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/30",
      contacted: "bg-emerald-50 text-emerald-750 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30",
      pending: "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30",
      working: "bg-violet-50 text-violet-750 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/30",
      "proposal sent": "bg-orange-50 text-orange-755 border-orange-250 dark:bg-orange-950/40 dark:text-orange-405 dark:border-orange-900/30",
      lost: "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30",
    };
    return colors[status.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const getInterestLevelColor = (level: string | null) => {
    const colors: { [key: string]: string } = {
      hot: "bg-rose-50 text-rose-750 border-rose-200 dark:bg-rose-950/45 dark:text-rose-400 dark:border-rose-900/30",
      warm: "bg-orange-50 text-orange-755 border-orange-200 dark:bg-orange-950/45 dark:text-orange-400 dark:border-orange-900/30",
      cold: "bg-sky-50 text-sky-750 border-sky-200 dark:bg-sky-950/45 dark:text-sky-400 dark:border-sky-900/30",
    };
    return colors[(level || "").toLowerCase()] || "bg-slate-50 text-slate-655 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const capitalize = (str: string) =>
    str
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const leadIndexMap = React.useMemo(() => {
    return buildLeadIndexMap(allLeads || []);
  }, [allLeads]);

  const getLeadSku = (lead: LocalLead) => {
    return helperGetLeadSku(lead, leadIndexMap);
  };

  const formatReceivedOn = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return dateStr || "—";
    }
  };

  return (
    <div style={{border:"1px solid hsl(var(--border))",borderRadius:12,overflow:"auto",maxHeight:"min(70vh,720px)",background:"hsl(var(--card))",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      {isLoading ? (
        <div className="p-4 text-center text-xs text-muted-foreground">Loading leads...</div>
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
            <TableRow className="bg-background hover:bg-background">
              {canDelete && (
                <TableHead className="sticky top-0 z-20 bg-background w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) =>
                      onToggleAll?.(checked === true)
                    }
                    aria-label="Select all leads on this page"
                  />
                </TableHead>
              )}
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>SKU</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>NAME</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>PROJECT NAME</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>PROPERTY TYPE</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>ASSIGNED TO</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>SOURCE</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>STATUS</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>RECEIVED ON</TableHead>
              <TableHead style={{fontSize:10,fontWeight:700,color:"hsl(var(--muted-foreground))",letterSpacing:"0.07em",padding:"10px 16px",background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))"}}>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 10 : 9} className="text-center">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead, index) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <TableRow
                    key={lead.id}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{borderBottom:"1px solid hsl(var(--border))", cursor:"pointer"}}
                  >
                    {canDelete && (
                      <TableCell style={{padding:"10px 16px"}} onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            onToggleLead?.(lead.id, checked === true)
                          }
                          aria-label={`Select ${lead.name || "lead"}`}
                        />
                      </TableCell>
                    )}
                    {/* SKU */}
                    <TableCell style={{padding:"12px 16px", fontSize:12, fontFamily:"monospace", fontWeight:600, color:"hsl(var(--muted-foreground))"}}>
                      {getLeadSku(lead)}
                    </TableCell>
                    {/* NAME — avatar + name + email */}
                    <TableCell style={{padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{
                          width:34,height:34,borderRadius:"50%",flexShrink:0,
                          background:"rgba(var(--theme-color-rgb), 0.1)",display:"flex",alignItems:"center",
                          justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--theme-color)"
                        }}>
                          {(lead.name || "?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"hsl(var(--foreground))",lineHeight:1.3}}>{lead.name || "—"}</div>
                          <div style={{fontSize:11,color:"hsl(var(--muted-foreground))",marginTop:2}}>{lead.email || lead.phone || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    {/* PROJECT NAME */}
                    <TableCell style={{padding:"12px 16px",fontSize:13,color:"hsl(var(--foreground))"}}>
                      {lead.project_name || "—"}
                    </TableCell>
                    {/* PROPERTY TYPE */}
                    <TableCell style={{padding:"12px 16px",fontSize:13,color:"hsl(var(--foreground))"}}>
                      {lead.property_type ? capitalize(lead.property_type) : "—"}
                    </TableCell>
                    {/* ASSIGNED TO */}
                    <TableCell style={{padding:"12px 16px",fontSize:13,color:"hsl(var(--foreground))"}}>
                      {lead.assigned_to_name || "Unassigned"}
                    </TableCell>
                    {/* SOURCE */}
                    <TableCell style={{padding:"12px 16px",fontSize:13,color:"hsl(var(--muted-foreground))"}}>
                      {formatPascalCaseDisplayName(lead.lead_type || "unknown")}
                    </TableCell>
                    {/* STATUS */}
                    <TableCell style={{padding:"6px 12px"}} onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const stat = (lead.status || "new").toLowerCase();
                        const statusBg: Record<string,string> = {
                          new: "rgba(59, 130, 246, 0.12)",
                          contacted: "rgba(16, 185, 129, 0.12)",
                          qualified: "rgba(5, 150, 105, 0.12)",
                          working: "rgba(139, 92, 246, 0.12)",
                          "proposal sent": "rgba(249, 115, 22, 0.12)",
                          lost: "rgba(239, 68, 68, 0.12)"
                        };
                        const statusColor: Record<string,string> = {
                          new: "#3B82F6",
                          contacted: "#10B981",
                          qualified: "#059669",
                          working: "#8B5CF6",
                          "proposal sent": "#F97316",
                          lost: "#EF4444"
                        };
                        const bg = statusBg[stat] || "rgba(107, 114, 128, 0.12)";
                        const color = statusColor[stat] || "#6B7280";
                        const isAgent = user?.role?.toLowerCase() === "agent";

                        return (
                          <Select
                            value={stat}
                            disabled={isLoading || isAgent}
                            onValueChange={(val) => {
                              onStatusChange(lead.id, val);
                            }}
                          >
                            <SelectTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 px-2.5 text-[11px] rounded-full border-0 focus:ring-0 focus:ring-offset-0 select-none cursor-pointer font-semibold shadow-none w-full"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "6px",
                                background: bg,
                                color: color,
                                border: `1px solid ${color}33`,
                                width: "100%"
                              }}
                            >
                              <SelectValue placeholder={capitalize(lead.status)} />
                            </SelectTrigger>
                            <SelectContent onClick={(e) => e.stopPropagation()}>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="working">Working</SelectItem>
                              <SelectItem value="proposal sent">Proposal Sent</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </TableCell>
                    {/* RECEIVED ON */}
                    <TableCell style={{padding:"12px 16px",fontSize:12,color:"hsl(var(--muted-foreground))"}}>
                      {formatReceivedOn(lead.created_at)}
                    </TableCell>
                    {/* ACTIONS */}
                    <TableCell style={{padding:"12px 16px"}} onClick={e => e.stopPropagation()}>
                      <LeadActions
                        lead={lead}
                        isLoading={isLoading}
                        hasPermission={hasPermission}
                        onViewDetails={onViewDetails}
                        onEdit={onEdit}
                        onAssign={onAssign}
                        onDelete={onDelete}
                        canDelete={canDelete}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default LeadTable;
