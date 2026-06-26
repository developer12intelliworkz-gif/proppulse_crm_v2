import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  ChevronRight,
  Search,
} from "lucide-react";

type ProjectQuotationStatus = {
  id: string;
  name: string;
  project_type: string | null;
  project_structure: string | null;
  unit_count: number | string;
  has_active_template: boolean;
};

// Colored top strip + icon per project_type
function projectTypeStyle(type: string | null): { color: string; iconBg: string; Icon: React.ElementType } {
  const t = (type || "").toLowerCase();
  if (t.includes("apartment") || t.includes("flat") || t.includes("residential"))
    return { color: "#2563EB", iconBg: "#EEF3FF", Icon: Home };
  if (t.includes("plot") || t.includes("land"))
    return { color: "#0D9488", iconBg: "#E6FAF8", Icon: Layers };
  if (t.includes("commercial") || t.includes("office"))
    return { color: "#7C3AED", iconBg: "#F3EFFE", Icon: LayoutGrid };
  return { color: "var(--theme-color)", iconBg: "rgba(var(--theme-color-rgb), 0.1)", Icon: Building2 };
}

const Quotations = () => {
  const [projects, setProjects] = useState<ProjectQuotationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/projects-with-quotation-status");
        setProjects(res.data?.data || []);
      } catch (e: any) {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "hsl(var(--background))" }}>
      <div style={{ padding: "22px 24px" }}>

        {/* ── Page header ───────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>
              QUOTATIONS
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "hsl(var(--foreground))" }}>
              Project Quotation Templates
            </div>
          </div>
        </div>

        {/* ── Action bar (Search input) ──────────────── */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginBottom: 16, 
          alignItems: "center", 
          background: "hsl(var(--card))", 
          borderRadius: 10, 
          padding: "10px 14px", 
          border: `1.5px solid ${searchFocused ? "var(--theme-color)" : "hsl(var(--border))"}`,
          boxShadow: searchFocused ? "0 0 0 1px var(--theme-color)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s"
        }}>
          <Search size={14} color="hsl(var(--muted-foreground))" />
          <input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "hsl(var(--foreground))", width: "100%", fontFamily: "inherit" }}
          />
        </div>

        {/* ── Loading skeleton ──────────────────────── */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  overflow: "hidden",
                  opacity: 0.5,
                }}
              >
                <div style={{ height: 4, background: "hsl(var(--border))" }} />
                <div style={{ padding: 16, minHeight: 140 }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ────────────────────────────── */}
        {!loading && projects.length === 0 && (
          <div
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 14,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(var(--theme-color-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <FileText size={24} color="var(--theme-color)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 6 }}>No Projects Found</div>
            <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Create a project first to manage quotation templates.</div>
          </div>
        )}

        {/* ── Search empty state ──────────────────────── */}
        {!loading && projects.length > 0 && filteredProjects.length === 0 && (
          <div
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 14,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(var(--theme-color-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Search size={24} color="var(--theme-color)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 6 }}>No matching projects found</div>
            <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Try adjusting your search terms.</div>
          </div>
        )}

        {/* ── Project cards grid ────────────────────── */}
        {!loading && filteredProjects.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filteredProjects.map((project) => {
              const { color, iconBg, Icon } = projectTypeStyle(project.project_type);
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/quotations/${project.id}`)}
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 18px rgba(var(--theme-color-rgb), 0.15)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={18} color={color} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {project.name}
                        </div>
                        {project.project_type && (
                          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1, textTransform: "uppercase" }}>
                            {project.project_type}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {project.project_structure && (
                        <span style={{ fontSize: 11, background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: 6, padding: "2px 8px" }}>
                          {project.project_structure}
                        </span>
                      )}
                      <span style={{ fontSize: 11, background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: 6, padding: "2px 8px" }}>
                        {project.unit_count} units
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifySpace: "between", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {project.has_active_template ? (
                          <>
                            <CheckCircle2 size={13} color="#059669" />
                            <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Template Active</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} color="#D97706" />
                            <span style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>No Template</span>
                          </>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--theme-color)", fontWeight: 600 }}>
                        Manage <ChevronRight size={12} />
                      </div>
                    </div>
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

export default Quotations;
