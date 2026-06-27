import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ArrowLeft,
  Building2,
  RefreshCw,
  Search,
  Check,
  Building,
} from "lucide-react";
import { PROJECT_HIERARCHY_CONFIG, ProjectType } from "./setup/projectHierarchyConfig";

type UnitStatus = "available" | "booked" | "sold" | "blocked";

interface Unit {
  id: string;
  unit_number: string;
  status: UnitStatus;
  hierarchy_node_id: string | null;
  node_name: string | null;
  node_type_code: string | null;
  carpet_area_sqft: number | null;
  price: number | null;
}

interface HierarchyNode {
  id: string;
  parent_id: string | null;
  type_code: string;
  name: string;
  children: HierarchyNode[];
}

const STATUS_CONFIG: Record<
  UnitStatus,
  { label: string; bg: string; color: string; border: string; activeBorder: string }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    color: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    activeBorder: "ring-2 ring-emerald-500 border-emerald-500",
  },
  booked: {
    label: "Booked",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    color: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    activeBorder: "ring-2 ring-amber-500 border-amber-500",
  },
  sold: {
    label: "Sold",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    color: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
    activeBorder: "ring-2 ring-rose-500 border-rose-500",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-slate-100 dark:bg-slate-800",
    color: "text-slate-600 dark:text-slate-400",
    border: "border-slate-300 dark:border-slate-700",
    activeBorder: "ring-2 ring-slate-500 border-slate-500",
  },
};

const ALL_STATUSES: UnitStatus[] = ["available", "booked", "sold", "blocked"];

export default function UnitAvailability() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [units, setUnits] = useState<Unit[]>([]);
  const [projectName, setProjectName] = useState("Project");
  const [projectType, setProjectType] = useState<string | null>(null);
  const [projectStructure, setProjectStructure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<UnitStatus | "all">("all");

  const [towers, setTowers] = useState<HierarchyNode[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | "all">("all");

  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setSelectedUnitIds(new Set());
    try {
      const [projRes, unitsRes, hierarchyRes] = await Promise.all([
        axiosInstance.get(`/projects/${projectId}`),
        axiosInstance.get(`/projects/${projectId}/units`),
        axiosInstance.get(`/projects/${projectId}/hierarchy-nodes`),
      ]);

      const projData = projRes.data?.data ?? projRes.data ?? {};
      setProjectName(projData.name ?? "Project");
      setProjectType(projData.project_type ?? null);
      setProjectStructure(projData.project_structure ?? null);

      const rawUnits = unitsRes.data?.data ?? unitsRes.data ?? [];
      setUnits(Array.isArray(rawUnits) ? rawUnits : []);

      const rawHierarchy = hierarchyRes.data?.data ?? hierarchyRes.data ?? [];
      setTowers(Array.isArray(rawHierarchy) ? rawHierarchy : []);

      setSelectedTowerId("all");
    } catch {
      setError("Failed to load project details and units. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle single unit selection/toggle
  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  // Select all units matching current view
  const handleSelectAll = (visibleUnits: Unit[]) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      const allVisibleSelected = visibleUnits.every((u) => next.has(u.id));

      if (allVisibleSelected) {
        visibleUnits.forEach((u) => next.delete(u.id));
      } else {
        visibleUnits.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  // Perform bulk status update
  const handleBulkStatusUpdate = async (status: UnitStatus) => {
    if (selectedUnitIds.size === 0) return;
    setBulkUpdating(true);
    const idsToUpdate = Array.from(selectedUnitIds);

    // Optimistic Update
    setUnits((prev) =>
      prev.map((u) =>
        selectedUnitIds.has(u.id) ? { ...u, status } : u
      )
    );
    setSelectedUnitIds(new Set());

    try {
      await axiosInstance.patch(`/projects/${projectId}/units/bulk/status`, {
        unitIds: idsToUpdate,
        status,
      });
    } catch {
      // Revert if API fails
      fetchData();
    } finally {
      setBulkUpdating(false);
    }
  };

  // ─── Filter & Grouping ───────────────────────────────────
  const getStructureLabels = useCallback(() => {
    if (!projectType || !projectStructure) {
      return { level3: "Tower", level4: "Floor", level3Plural: "Towers" };
    }
    const type = projectType.toUpperCase() as ProjectType;
    const struct = projectStructure.toUpperCase();
    const config = PROJECT_HIERARCHY_CONFIG.level3_level4_hierarchy_by_structure?.[type]?.[struct];
    if (config) {
      const level3Label = config.level3?.default_label ?? "Tower";
      let level3Plural = `${level3Label}s`;
      if (level3Label.toLowerCase().includes("category") || level3Label.toLowerCase().includes("not applicable")) {
        level3Plural = level3Label;
      } else if (level3Label.toLowerCase().includes("phase")) {
        level3Plural = "Phases";
      } else if (level3Label.toLowerCase().includes("sector")) {
        level3Plural = "Sectors";
      } else if (level3Label.toLowerCase().includes("cluster")) {
        level3Plural = "Clusters";
      } else if (level3Label.toLowerCase().includes("building")) {
        level3Plural = "Buildings";
      } else if (level3Label.toLowerCase().includes("block")) {
        level3Plural = "Blocks";
      } else if (level3Label.toLowerCase().includes("wing")) {
        level3Plural = "Wings";
      }
      return {
        level3: level3Label,
        level4: config.level4?.default_label ?? "Floor",
        level3Plural,
      };
    }
    return { level3: "Tower", level4: "Floor", level3Plural: "Towers" };
  }, [projectType, projectStructure]);

  const labels = getStructureLabels();

  const getFloorName = (unit: Unit) => {
    return unit.node_name ?? `Unassigned ${labels.level4}`;
  };

  const getTowerIdForUnit = (unit: Unit): string => {
    if (!unit.hierarchy_node_id) return "unassigned";

    // Find the floor node in hierarchy, get parent_id
    for (const tower of towers) {
      if (tower.id === unit.hierarchy_node_id) return tower.id;
      if (tower.children?.some((floor) => floor.id === unit.hierarchy_node_id)) {
        return tower.id;
      }
    }
    return "unassigned";
  };

  const getTowerName = (towerId: string) => {
    if (towerId === "unassigned") return "Unassigned Units";
    return towers.find((t) => t.id === towerId)?.name ?? labels.level3;
  };

  // 1. Filter by Search and Status Pill
  const searchAndStatusFiltered = units.filter((u) => {
    const matchSearch =
      !search ||
      u.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
      u.node_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // 2. Filter by Active Tower selection
  const towerFiltered = searchAndStatusFiltered.filter((u) => {
    if (selectedTowerId === "all") return true;
    return getTowerIdForUnit(u) === selectedTowerId;
  });

  // 3. Group by Floor (and sort floors descending: e.g. Floor 10 down to Floor 1)
  const floorGrouped = towerFiltered.reduce<Record<string, Unit[]>>((acc, u) => {
    const floor = getFloorName(u);
    acc[floor] = acc[floor] ?? [];
    acc[floor].push(u);
    return acc;
  }, {});

  // Sort floors descending. Extracts numbers where possible for accurate numerical sorting
  const sortedFloors = Object.keys(floorGrouped).sort((a, b) => {
    const numA = parseInt(a.replace(/^\D+/g, ""), 10);
    const numB = parseInt(b.replace(/^\D+/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA;
    }
    return b.localeCompare(a);
  });

  // Unique list of tower/cluster IDs that have units in this project
  const availableTowerIds = Array.from(
    new Set(units.map((u) => getTowerIdForUnit(u)))
  );

  // Counts for summary pills
  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = units.filter((u) => u.status === s).length;
    return acc;
  }, {});
  counts.total = units.length;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
        {/* ── Header ── */}
        <button
          onClick={() => navigate("/projects")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--theme-color)", fontSize: 13, fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
            marginBottom: 20, padding: 0,
          }}
        >
          <ArrowLeft size={15} /> Back to Projects
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(var(--theme-color-rgb), 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={22} color="var(--theme-color)" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--foreground))", margin: 0 }}>
                {projectName}
              </h1>
              <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0 }}>
                {labels.level3} Wise Seat-Layout Availability Manager
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))", cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Summary Counts ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { key: "total", label: "Total Units", color: "#6366f1", bg: "#eef2ff" },
            { key: "available", label: "Available", color: "#10b981", bg: "#ecfdf5" },
            { key: "booked", label: "Booked", color: "#f59e0b", bg: "#fffbeb" },
            { key: "sold", label: "Sold", color: "#ef4444", bg: "#fef2f2" },
            { key: "blocked", label: "Blocked", color: "#64748b", bg: "#f1f5f9" },
          ].map(({ key, label, color, bg }) => (
            <div
              key={key}
              onClick={() => key !== "total" && setFilterStatus(filterStatus === key ? "all" : key as UnitStatus)}
              style={{
                background: filterStatus === key ? bg : "hsl(var(--card))",
                border: `1.5px solid ${filterStatus === key ? color : "hsl(var(--border))"}`,
                borderRadius: 12, padding: "14px 16px", cursor: key !== "total" ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{counts[key] ?? 0}</div>
              <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
            borderRadius: 8, padding: "8px 12px",
          }}>
            <Search size={14} color="hsl(var(--muted-foreground))" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search unit number or ${labels.level4.toLowerCase()}…`}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "hsl(var(--foreground))" }}
            />
          </div>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "hsl(var(--secondary))", border: "none", color: "hsl(var(--secondary-foreground))",
                cursor: "pointer",
              }}
            >
              Clear Filter ({filterStatus})
            </button>
          )}
        </div>

        {/* ── Switcher & Bulk Toggle ── */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {towers.filter((t) => availableTowerIds.includes(t.id)).length > 0 && (
              <button
                onClick={() => setSelectedTowerId("all")}
                style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                  border: "1.5px solid",
                  borderColor: selectedTowerId === "all" ? "var(--theme-color)" : "hsl(var(--border))",
                  background: selectedTowerId === "all" ? "rgba(var(--theme-color-rgb), 0.08)" : "hsl(var(--card))",
                  color: selectedTowerId === "all" ? "var(--theme-color)" : "hsl(var(--foreground))",
                  cursor: "pointer",
                }}
              >
                All {labels.level3Plural}
              </button>
            )}
            {towers
              .filter((tower) => availableTowerIds.includes(tower.id))
              .map((tower) => (
                <button
                  key={tower.id}
                  onClick={() => setSelectedTowerId(tower.id)}
                  style={{
                    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                    border: "1.5px solid",
                    borderColor: selectedTowerId === tower.id ? "var(--theme-color)" : "hsl(var(--border))",
                    background: selectedTowerId === tower.id ? "rgba(var(--theme-color-rgb), 0.08)" : "hsl(var(--card))",
                    color: selectedTowerId === tower.id ? "var(--theme-color)" : "hsl(var(--foreground))",
                    cursor: "pointer",
                  }}
                >
                  {tower.name}
                </button>
              ))}
            {availableTowerIds.includes("unassigned") && (
              <button
                onClick={() => setSelectedTowerId("unassigned")}
                style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                  border: "1.5px solid",
                  borderColor: selectedTowerId === "unassigned" ? "var(--theme-color)" : "hsl(var(--border))",
                  background: selectedTowerId === "unassigned" ? "rgba(var(--theme-color-rgb), 0.08)" : "hsl(var(--card))",
                  color: selectedTowerId === "unassigned" ? "var(--theme-color)" : "hsl(var(--foreground))",
                  cursor: "pointer",
                }}
              >
                Unassigned
              </button>
            )}
          </div>

          {towerFiltered.length > 0 && (
            <button
              onClick={() => handleSelectAll(towerFiltered)}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))", cursor: "pointer",
              }}
            >
              {towerFiltered.every((u) => selectedUnitIds.has(u.id))
                ? "Deselect All in View"
                : "Select All in View"}
            </button>
          )}
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "hsl(var(--muted-foreground))" }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", display: "block" }} />
            Loading project unit layout…
          </div>
        ) : error ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            color: "#ef4444", background: "#fef2f2", borderRadius: 12,
          }}>
            {error}
          </div>
        ) : towerFiltered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            background: "hsl(var(--card))", border: "1.5px dashed hsl(var(--border))",
            borderRadius: 12, color: "hsl(var(--muted-foreground))",
          }}>
            No units found matching selection.
          </div>
        ) : (
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {sortedFloors.map((floor) => {
                const floorUnits = floorGrouped[floor] ?? [];
                // Sort units horizontally by unit number
                const sortedUnits = floorUnits.sort((a, b) =>
                  a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })
                );

                return (
                  <div
                    key={floor}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      paddingBottom: 16,
                      borderBottom: "1px solid hsl(var(--border))/40",
                    }}
                  >
                    {/* Floor Label */}
                    <div style={{
                      width: 110,
                      fontWeight: 700,
                      fontSize: 13,
                      color: "hsl(var(--foreground))",
                      flexShrink: 0,
                    }}>
                      {floor}
                    </div>

                    {/* Horizontal Seats/Units */}
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      flex: 1,
                    }}>
                      {sortedUnits.map((unit) => {
                        const isSelected = selectedUnitIds.has(unit.id);
                        const statusCfg = STATUS_CONFIG[unit.status ?? "available"];

                        return (
                          <div
                            key={unit.id}
                            onClick={() => toggleUnitSelection(unit.id)}
                            className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                            style={{
                              width: 60,
                              height: 48,
                              borderRadius: 8,
                              border: "1.5px solid",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              transition: "all 0.12s ease-in-out",
                              boxShadow: isSelected ? "0 0 0 2px var(--theme-color)" : "none",
                              transform: isSelected ? "scale(0.96)" : "none",
                            }}
                            title={`${unit.unit_number} - ${statusCfg.label}\nArea: ${unit.carpet_area_sqft ?? "—"} sqft\nPrice: ${unit.price ? `₹${(unit.price/100000).toFixed(1)}L` : "—"}`}
                          >
                            {/* Selected Check overlay */}
                            {isSelected && (
                              <div style={{
                                position: "absolute",
                                top: -4,
                                right: -4,
                                background: "var(--theme-color)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: 15,
                                height: 15,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1.5px solid #fff",
                              }}>
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}

                            <span style={{ fontSize: 13, fontWeight: 800 }}>
                              {unit.unit_number}
                            </span>
                            <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 600 }}>
                              {unit.price ? `₹${(unit.price/100000).toFixed(0)}L` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Legend ── */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 20,
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid hsl(var(--border))",
            }}>
              {[
                { label: "Available", color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200" },
                { label: "Booked", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200" },
                { label: "Sold", color: "#ef4444", bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200" },
                { label: "Blocked", color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-300" },
              ].map(({ label, color, bg, border }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    className={`${bg} ${border}`}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: "1.5px solid",
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ── */}
      {selectedUnitIds.size > 0 && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 50,
          animation: "slideUp 0.2s ease-out",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "hsl(var(--foreground))" }}>
              {selectedUnitIds.size} Units Selected
            </div>
            <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
              Select status below to update all:
            </div>
          </div>

          <div style={{ height: 28, width: 1, background: "hsl(var(--border))" }} />

          <div style={{ display: "flex", gap: 8 }}>
            {[
              { status: "available", label: "Set Available", color: "#fff", bg: "#10b981" },
              { status: "booked", label: "Set Booked", color: "#fff", bg: "#f59e0b" },
              { status: "sold", label: "Set Sold", color: "#fff", bg: "#ef4444" },
              { status: "blocked", label: "Set Blocked", color: "#fff", bg: "#64748b" },
            ].map(({ status, label, bg, color }) => (
              <button
                key={status}
                disabled={bulkUpdating}
                onClick={() => handleBulkStatusUpdate(status as UnitStatus)}
                style={{
                  background: bg,
                  color,
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: bulkUpdating ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            disabled={bulkUpdating}
            onClick={() => setSelectedUnitIds(new Set())}
            style={{
              background: "transparent",
              border: "none",
              color: "hsl(var(--muted-foreground))",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: 8,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
