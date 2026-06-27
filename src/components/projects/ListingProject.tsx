import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building,
  Building2,
  MapPin,
  Edit,
  Trash2,
  List,
  Grid,
  Plus,
  Search,
  TrendingUp,
  Home,
  CheckCircle2,
  MoreVertical,
  Shield,
  Tag,
  Copy,
  Archive,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { isInitialSetupComplete } from "./setup/projectSetupHelpers";

interface Project {
  id: string;
  name: string;
  rera_project_id: string;
  possession: string;
  city: string;
  state: string;
  total_properties?: number;
  sold_properties?: number;
  is_active: boolean;
  project_type?: string | null;
  project_structure?: string | null;
}

const ACCENT_COLORS = ["var(--theme-color)", "#EC4899", "#F97316", "#059669", "#0EA5E9", "#7C3AED", "#D97706", "#DC2626"];
const getAccent = (name: string) => ACCENT_COLORS[name.charCodeAt(0) % ACCENT_COLORS.length];

// Helper to get translucent wash backgrounds for accents
const getAccentBg = (accent: string) => {
  if (accent === "var(--theme-color)") {
    return "rgba(var(--theme-color-rgb), 0.1)";
  }
  return `${accent}18`;
};

// Helper to get gradient hover or semi-translucencies for accents
const getAccentSemi = (accent: string) => {
  if (accent === "var(--theme-color)") {
    return "rgba(var(--theme-color-rgb), 0.6)";
  }
  return `${accent}99`;
};

const ListingProject = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true); setError(null);
    try {
      const response = await axiosInstance.get("/projects");
      setProjects(response.data?.data || []);
    } catch (err: any) {
      setError("Failed to load projects. Please try again.");
    } finally { setLoading(false); }
  };

  const handleToggleActive = async (project: Project) => {
    try {
      await axiosInstance.put(`/projects/${project.id}`, { is_active: !project.is_active });
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_active: !p.is_active } : p));
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}`);
      await fetchProjects();
      setIsDeleteDialogOpen(false); setSelectedProject(null);
    } catch {}
  };

  useEffect(() => { fetchProjects(); }, []);

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = filterActive === "all" ? true : filterActive === "active" ? p.is_active : !p.is_active;
    return matchSearch && matchActive;
  });

  // Summary stats
  const totalUnits = projects.reduce((s, p) => s + (p.total_properties || 0), 0);
  const soldUnits  = projects.reduce((s, p) => s + (p.sold_properties  || 0), 0);
  const activeCount = projects.filter(p => p.is_active).length;
  const avgRate = totalUnits ? Math.round((soldUnits / totalUnits) * 100) : 0;

  if (!hasPermission("manage_project")) {
    return <div style={{ textAlign: "center", padding: "48px 24px", color: "#4B5280", fontSize: 14 }}>You don't have permission to manage projects.</div>;
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "hsl(var(--background))" }}>
      <div style={{ padding: "22px 24px" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>PROJECTS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "baseline", gap: 8 }}>
              All Projects
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.1)", padding: "2px 10px", borderRadius: 20 }}>{filteredProjects.length}</span>
            </div>
          </div>
          {hasPermission("create_projects") && (
            <button
              onClick={() => navigate("/projects/create")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, background: "var(--theme-color)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(var(--theme-color-rgb), 0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--theme-color-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--theme-color)")}
            >
              <Plus size={15} /> New Project
            </button>
          )}
        </div>

        {/* ── Stat cards ─────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Projects", value: projects.length,  Icon: Building,     color: "var(--theme-color)", bg: "rgba(var(--theme-color-rgb), 0.1)",  border: "var(--theme-color)" },
            { label: "Active",         value: activeCount,       Icon: CheckCircle2, color: "#059669", bg: "#ECFDF5",  border: "#059669" },
            { label: "Total Units",    value: totalUnits,        Icon: Home,         color: "#F97316", bg: "#FFF7ED",  border: "#F97316" },
            { label: "Avg Sale Rate",  value: `${avgRate}%`,     Icon: TrendingUp,   color: "#7C3AED", bg: "#F5F3FF",  border: "#7C3AED" },
          ].map(c => (
            <div key={c.label} style={{ background: "hsl(var(--card))", borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${c.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.Icon size={17} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>{loading ? "—" : c.value}</div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 4, fontWeight: 500 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Action bar ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", background: "hsl(var(--card))", borderRadius: 10, padding: "10px 14px", border: "1px solid hsl(var(--border))" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Search size={14} color="hsl(var(--muted-foreground))" />
            <input
              placeholder="Search projects by name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "hsl(var(--foreground))", width: "100%", fontFamily: "inherit" }}
            />
          </div>
          {/* Status filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all","active","inactive"] as const).map(f => (
              <button key={f} onClick={() => setFilterActive(f)}
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${filterActive===f?"var(--theme-color)":"hsl(var(--border))"}`, background: filterActive===f?"var(--theme-color)":"hsl(var(--card))", color: filterActive===f?"#fff":"hsl(var(--muted-foreground))", textTransform: "capitalize" as const }}>
                {f}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 4, borderLeft: "1px solid hsl(var(--border))", paddingLeft: 8 }}>
            {(["grid","list"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${viewMode===mode?"var(--theme-color)":"hsl(var(--border))"}`, background: viewMode===mode?"rgba(var(--theme-color-rgb), 0.1)":"hsl(var(--card))", color: viewMode===mode?"var(--theme-color)":"hsl(var(--muted-foreground))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {mode==="grid" ? <Grid size={14}/> : <List size={14}/>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading skeleton ────────────────────────────── */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 14, height: 200, opacity: 0.4, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────── */}
        {error && !loading && (
          <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "20px 24px", color: "#DC2626", fontSize: 13, border: "1px solid #FECACA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {error}
            <button onClick={fetchProjects} style={{ padding: "6px 14px", borderRadius: 7, background: "#DC2626", color: "#fff", border: "none", fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* ── Empty ──────────────────────────────────────── */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            <Building size={44} color="hsl(var(--border))" style={{ margin: "0 auto 14px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>No projects found</div>
            <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Try adjusting your search or create a new project.</div>
          </div>
        )}

        {/* ── Grid view ──────────────────────────────────── */}
        {!loading && !error && viewMode === "grid" && filteredProjects.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {filteredProjects.map(project => {
              const total = project.total_properties || 0;
              const sold  = project.sold_properties  || 0;
              const avail = total - sold;
              const rate  = total ? Math.round((sold / total) * 100) : 0;
              return (
                <div key={project.id}
                  style={{
                    background: "hsl(var(--card))",
                    borderRadius: 16,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    border: "1px solid hsl(var(--border))",
                    transition: "all 0.2s ease-in-out",
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 280
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(var(--theme-color-rgb), 0.15)";
                    e.currentTarget.style.borderColor = "var(--theme-color)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "rgba(var(--theme-color-rgb), 0.08)",
                          border: "1.5px solid rgba(var(--theme-color-rgb), 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Building size={18} color="var(--theme-color)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                            {project.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
                            <MapPin size={10} color="hsl(var(--muted-foreground))" />
                            {project.city || "—"}{project.state ? `, ${project.state}` : ""}
                          </div>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 8,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(var(--theme-color-rgb), 0.08)",
                            color: "var(--theme-color)",
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            <Home size={10} />
                            {project.project_type ? `${project.project_type.charAt(0).toUpperCase()}${project.project_type.slice(1).toLowerCase()} Project` : "Residential Project"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => handleToggleActive(project)}
                          title="Click to toggle status"
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 20,
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: project.is_active ? "#ECFDF5" : "#F1F5F9",
                            color: project.is_active ? "#059669" : "#64748B",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = project.is_active ? "#FEF2F2" : "#ECFDF5"; e.currentTarget.style.color = project.is_active ? "#DC2626" : "#059669"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = project.is_active ? "#ECFDF5" : "#F1F5F9"; e.currentTarget.style.color = project.is_active ? "#059669" : "#64748B"; }}
                        >
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: project.is_active ? "#10B981" : "#94A3B8"
                          }} />
                          {project.is_active ? "Active" : "Inactive"}
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "hsl(var(--muted-foreground))",
                              padding: 4,
                              borderRadius: 4
                            }}>
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ minWidth: 150 }}>
                            <DropdownMenuItem onClick={() => navigate(`/projects/edit/${project.id}/step1`)}>
                              <Edit size={13} style={{ marginRight: 8 }} /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(project)}>
                              <Archive size={13} style={{ marginRight: 8 }} /> {project.is_active ? "Archive Project" : "Activate Project"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              style={{ color: "#EF4444" }}
                              onClick={() => {
                                setSelectedProject(project);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 size={13} style={{ marginRight: 8 }} /> Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
                      gap: 12,
                      padding: "14px 0",
                      borderTop: "1px solid #F1F5F9",
                      borderBottom: "1px solid #F1F5F9",
                      marginBottom: 16
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "rgba(var(--theme-color-rgb), 0.08)", color: "var(--theme-color)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <Building size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Total Units</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--foreground))", marginTop: 2 }}>{total}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "#FEF2F2", color: "#EF4444",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <Tag size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Sold</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginTop: 2 }}>{sold}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "#ECFDF5", color: "#059669",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Available</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 2 }}>{avail}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Sales Progress</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--theme-color)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 2 }}>
                          {rate}<span style={{ fontSize: 11, fontWeight: 600 }}>%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
                          <div style={{ height: "100%", width: `${rate}%`, background: "var(--theme-color)", borderRadius: 99, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "hsl(var(--muted-foreground))", fontWeight: 500, maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Shield size={12} color="hsl(var(--muted-foreground))" />
                      RERA: {project.rera_project_id || "N/A"}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isInitialSetupComplete(project) && (
                        <>
                          <button
                            onClick={() => navigate(`/project-setup?projectId=${project.id}`)}
                            style={{
                              padding: "0 12px", height: 32, borderRadius: 8,
                              border: "1.5px solid var(--theme-color)", background: "transparent", color: "var(--theme-color)",
                              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                              fontSize: 12, fontWeight: 700, transition: "all 0.12s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background="rgba(var(--theme-color-rgb), 0.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}
                            title="Open Layout Builder"
                          >
                            <Building2 size={13} />
                            Layout
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.id}/availability`)}
                            style={{
                              padding: "0 12px", height: 32, borderRadius: 8,
                              border: "1.5px solid #059669", background: "transparent", color: "#059669",
                              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                              fontSize: 12, fontWeight: 700, transition: "all 0.12s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background="rgba(5,150,105,0.06)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}
                            title="Manage Unit Availability"
                          >
                            <CheckCircle2 size={13} />
                            Availability
                          </button>
                        </>
                      )}

                      {currentUser?.role === "admin" && (
                        <Dialog open={isDeleteDialogOpen && selectedProject?.id===project.id} onOpenChange={open=>{setIsDeleteDialogOpen(open);if(!open)setSelectedProject(null);}}>
                          <DialogContent style={{maxWidth:420}}>
                            <DialogHeader><DialogTitle>Delete Project</DialogTitle></DialogHeader>
                            <p style={{fontSize:13,color:"#4B5280",margin:"10px 0 20px"}}>Delete <strong>{project.name}</strong>? This cannot be undone.</p>
                            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                              <Button variant="outline" onClick={()=>setIsDeleteDialogOpen(false)}>Cancel</Button>
                              <Button variant="destructive" onClick={()=>handleDeleteProject(project.id)}>Delete</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── List view ──────────────────────────────────── */}
        {!loading && !error && viewMode === "list" && filteredProjects.length > 0 && (
          <div style={{ background: "hsl(var(--card))", borderRadius: 14, overflow: "hidden", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 0.7fr 0.7fr 0.7fr 100px", background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))", padding: "0 4px" }}>
              {["Project","Location","Total","Sold","Rate","Actions"].map(h => (
                <div key={h} style={{ padding: "10px 12px", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {filteredProjects.map((project, idx) => {
              const total = project.total_properties || 0;
              const sold  = project.sold_properties  || 0;
              const rate  = total ? Math.round((sold/total)*100) : 0;
              const accent = getAccent(project.name);
              return (
                <div key={project.id}
                  style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 0.7fr 0.7fr 0.7fr 100px", borderBottom: idx<filteredProjects.length-1?"1px solid hsl(var(--border))":"none", borderLeft: `3px solid ${accent}` }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="hsl(var(--background))"}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
                >
                  <div style={{ padding: "12px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:getAccentBg(accent), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Building size={15} color={accent} />
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"hsl(var(--foreground))" }}>{project.name}</div>
                      <button
                        onClick={() => handleToggleActive(project)}
                        title="Click to toggle status"
                        style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:project.is_active?"#ECFDF5":"hsl(var(--secondary))", color:project.is_active?"#059669":"hsl(var(--muted-foreground))", fontWeight:600, border:"none", cursor:"pointer", transition:"all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = project.is_active ? "#FEF2F2" : "#ECFDF5"; e.currentTarget.style.color = project.is_active ? "#DC2626" : "#059669"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = project.is_active ? "#ECFDF5" : (project.is_active?"#ECFDF5":"hsl(var(--secondary))"); e.currentTarget.style.color = project.is_active ? "#059669" : "hsl(var(--muted-foreground))"; }}
                      >
                        {project.is_active?"● Active":"○ Inactive"}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding:"12px", display:"flex", alignItems:"center", fontSize:12, color:"hsl(var(--muted-foreground))", gap:4 }}>
                    <MapPin size={11} color="hsl(var(--muted-foreground))"/>{project.city}{project.state?`, ${project.state}`:""}
                  </div>
                  <div style={{ padding:"12px", display:"flex", alignItems:"center", fontSize:13, fontWeight:700, color:"hsl(var(--foreground))" }}>{total}</div>
                  <div style={{ padding:"12px", display:"flex", alignItems:"center", fontSize:13, fontWeight:700, color:"#059669" }}>{sold}</div>
                  <div style={{ padding:"12px", display:"flex", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:rate>=70?"#059669":rate>=40?"#F59E0B":accent, background:rate>=70?"#ECFDF5":rate>=40?"#FFFBEB":getAccentBg(accent), padding:"3px 9px", borderRadius:20 }}>{rate}%</span>
                  </div>
                  <div style={{ padding:"8px 12px", display:"flex", alignItems:"center", gap:5 }}>
                    {isInitialSetupComplete(project) && (
                      <>
                        <button
                          onClick={() => navigate(`/project-setup?projectId=${project.id}`)}
                          style={{ padding: "0 8px", height: 28, borderRadius: 6, border: "1.5px solid var(--theme-color)", background: "var(--theme-color)", color: "#fff", display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                          onMouseEnter={e => { e.currentTarget.style.background="var(--theme-color-hover)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="var(--theme-color)"; }}
                          title="Open Layout Builder"
                        >
                          <Building2 size={11} />
                          Layout
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/availability`)}
                          style={{ padding: "0 8px", height: 28, borderRadius: 6, border: "1.5px solid #059669", background: "#059669", color: "#fff", display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                          onMouseEnter={e => { e.currentTarget.style.background="#047857"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="#059669"; }}
                          title="Manage Unit Availability"
                        >
                          <CheckCircle2 size={11} />
                          Availability
                        </button>
                      </>
                    )}
                    <button onClick={()=>navigate(`/projects/edit/${project.id}/step1`)}
                      style={{ width:28,height:28,borderRadius:6,border:"1px solid hsl(var(--border))",background:"hsl(var(--card))",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--theme-color)";e.currentTarget.style.background="rgba(var(--theme-color-rgb), 0.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="hsl(var(--border))";e.currentTarget.style.background="hsl(var(--card))";}}
                      title="Edit"><Edit size={12} color="var(--theme-color)"/></button>
                    {currentUser?.role === "admin" && (
                      <Dialog open={isDeleteDialogOpen&&selectedProject?.id===project.id} onOpenChange={open=>{setIsDeleteDialogOpen(open);if(!open)setSelectedProject(null);}}>
                        <DialogTrigger asChild>
                          <button onClick={()=>{setSelectedProject(project);setIsDeleteDialogOpen(true);}}
                            style={{ width:28,height:28,borderRadius:6,border:"1px solid hsl(var(--border))",background:"hsl(var(--card))",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="#DC2626";e.currentTarget.style.background="rgba(220,38,38,0.15)";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="hsl(var(--border))";e.currentTarget.style.background="hsl(var(--card))";}}
                            title="Delete"><Trash2 size={12} color="#DC2626"/></button>
                        </DialogTrigger>
                        <DialogContent style={{maxWidth:420}}>
                          <DialogHeader><DialogTitle>Delete Project</DialogTitle></DialogHeader>
                          <p style={{fontSize:13,color:"#4B5280",margin:"10px 0 20px"}}>Delete <strong>{project.name}</strong>? This cannot be undone.</p>
                          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                            <Button variant="outline" onClick={()=>setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={()=>handleDeleteProject(project.id)}>Delete</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingProject;
