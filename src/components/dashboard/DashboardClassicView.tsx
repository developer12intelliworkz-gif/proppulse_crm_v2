import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/contexts/LeadsContext";
import axiosInstance from "@/api/axiosInstance";
import { useEffect as useEffectLeads } from "react";
import {
  Users, Building, FileText, CalendarClock,
  Search, Sparkles, Plus, ArrowRight, X, AlertCircle,
} from "lucide-react";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";

// ─── Types ───────────────────────────────────────────────────
interface LatestLead {
  id: string;
  name: string;
  source: string;
  time: string;
}
interface FollowupItem {
  id: string;
  name: string;
  time: string;
  note: string;
}

// ─── New theme palette ────────────────────────────────────────
// Primary: Indigo #6366F1  Secondary: Pink #EC4899  Blue #3B82F6
// Amber #F59E0B  Green #10B981  Dark text #1E1B4B  Muted #6B7280

// ─── Helpers ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" },
  { bg: "#FDF2F8", color: "#EC4899" },
  { bg: "#E6FAF8", color: "#0D9488" },
  { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#ECFDF5", color: "#10B981" },
  { bg: "#FFFBEB", color: "#F59E0B" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// Map lead status → pipeline stage
function derivePipelineStage(status: string): string {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("book") || s.includes("won") || s.includes("closed") || s.includes("converted")) return "BOOKED";
  if (s.includes("negotiat") || s.includes("proposal") || s.includes("working") || s.includes("pending")) return "NEGOTIATION";
  if (s.includes("site") || s.includes("visit")) return "SITE VISIT";
  if (s.includes("contact") || s.includes("qualified") || s.includes("reached")) return "CONTACTED";
  return "NEW";
}

// Status chip color
function statusChip(status: string): { bg: string; color: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "hot") return { bg: "#FDF2F8", color: "#EC4899", label: "Hot" };
  if (s === "warm") return { bg: "#FFFBEB", color: "#F59E0B", label: "Warm" };
  if (s === "cold") return { bg: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)", label: "Cold" };
  if (s.includes("new")) return { bg: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)", label: "New" };
  if (s.includes("contact")) return { bg: "#E6FAF8", color: "#0D9488", label: "Contacted" };
  if (s.includes("won") || s.includes("book")) return { bg: "#ECFDF5", color: "#10B981", label: "Booked" };
  if (s.includes("lost")) return { bg: "#FEF2F2", color: "#EC4899", label: "Lost" };
  return { bg: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)", label: status || "New" };
}

// Pipeline stage config
const PIPELINE_STAGES = [
  { key: "NEW",         label: "NEW",         color: "var(--theme-color)" },
  { key: "CONTACTED",   label: "CONTACTED",   color: "#EC4899" },
  { key: "SITE VISIT",  label: "SITE VISIT",  color: "#3B82F6" },
  { key: "NEGOTIATION", label: "NEGOTIATION", color: "#F59E0B" },
  { key: "BOOKED",      label: "BOOKED",      color: "#10B981" },
];

// ─── Component ───────────────────────────────────────────────
const DashboardClassicView = () => {
  const { token, user } = useAuth();
  const { leads, fetchLeads } = useLeads();
  const navigate = useNavigate();

  // Fix: fetch leads on mount so dashboard data loads immediately
  useEffectLeads(() => {
    fetchLeads(true);
  }, [fetchLeads]);

  const [projectsCount, setProjectsCount] = useState(0);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [totalPendingFollowups, setTotalPendingFollowups] = useState(0);
  const [overdueTasksCount, setOverdueTasksCount] = useState(0);
  const [latestLeads, setLatestLeads] = useState<LatestLead[]>([]);
  const [todaysFollowups, setTodaysFollowups] = useState<FollowupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsList, setProjectsList] = useState<{id:number;name:string;status?:string}[]>([]);
  const [allProjects, setAllProjects] = useState<{id:number;name:string;status?:string;city?:string;state?:string}[]>([]);
  const [usersList, setUsersList] = useState<{id:number;name:string;role?:string;email?:string}[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, projectsRes, quotationsRes, usersRes, taskStatsRes] = await Promise.allSettled([
          axiosInstance.get("/leads/summary"),
          axiosInstance.get("/projects"),
          axiosInstance.get("/projects-with-quotation-status"),
          axiosInstance.get("/users"),
          axiosInstance.get("/tasks/stats"),
        ]);

        if (summaryRes.status === "fulfilled") {
          const d = summaryRes.value.data;
          setLatestLeads(d.latestLeads || []);
          setTodaysFollowups(d.todaysFollowups || []);
          setTotalPendingFollowups(d.totalPendingFollowups || 0);
        }
        if (projectsRes.status === "fulfilled") {
          const d = projectsRes.value.data;
          const list = d?.data || d || [];
          setProjectsCount(list.length || 0);
          setProjectsList(list.slice(0, 5));
          setAllProjects(list);
        }
        if (usersRes.status === "fulfilled") {
          const d = usersRes.value.data;
          const list = d?.data || d || [];
          setUsersList(list.slice(0, 5));
        }
        if (quotationsRes.status === "fulfilled") {
          const d = quotationsRes.value.data;
          setQuotationsCount(d?.data?.length || 0);
        }
        if (taskStatsRes.status === "fulfilled") {
          const d = taskStatsRes.value.data;
          setOverdueTasksCount(d.overdue || 0);
        }
      } catch {
        // silent fail — display whatever we have
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [token]);

  // Pipeline counts from leads context
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = { NEW: 0, CONTACTED: 0, "SITE VISIT": 0, NEGOTIATION: 0, BOOKED: 0 };
    leads.forEach((l) => {
      const stage = derivePipelineStage(l.status);
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const maxPipelineVal = Math.max(...Object.values(pipelineCounts), 1);

  // Latest 5 leads from context (sorted by created_at desc)
  const recentLeads = useMemo(() =>
    [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [leads]
  );

  // KPI cards — new vibrant palette
  const kpiCards = [
    {
      label: "Total leads",
      value: leads.length,
      sub: "Active in pipeline",
      badge: `↑ ${Math.max(leads.length, 0)} total`,
      badgePositive: true,
      iconBg: "linear-gradient(135deg,var(--theme-color),var(--theme-color-hover))",
      iconColor: "#fff",
      accent: "var(--theme-color)",
      Icon: Users,
      href: "/leads",
    },
    {
      label: "Active projects",
      value: projectsCount,
      sub: "Across all cities",
      badge: `${projectsCount} projects`,
      badgePositive: true,
      iconBg: "linear-gradient(135deg,#EC4899,#F472B6)",
      iconColor: "#fff",
      accent: "#EC4899",
      Icon: Building,
      href: "/projects",
    },
    {
      label: "Quotations",
      value: quotationsCount,
      sub: "Configured projects",
      badge: "View all",
      badgePositive: true,
      iconBg: "linear-gradient(135deg,#3B82F6,#60A5FA)",
      iconColor: "#fff",
      accent: "#3B82F6",
      Icon: FileText,
      href: "/quotations",
    },
    {
      label: "Pending follow-ups",
      value: totalPendingFollowups,
      sub: "Scheduled ahead",
      badge: totalPendingFollowups > 0 ? `Due: ${Math.min(totalPendingFollowups, 9)}` : "All clear",
      badgePositive: totalPendingFollowups === 0,
      iconBg: "linear-gradient(135deg,#F59E0B,#FCD34D)",
      iconColor: "#fff",
      accent: "#F59E0B",
      Icon: CalendarClock,
      href: "/followups",
    },
    {
      label: "Overdue tasks",
      value: overdueTasksCount,
      sub: "Assigned to you",
      badge: overdueTasksCount > 0 ? `Overdue: ${overdueTasksCount}` : "All clear",
      badgePositive: overdueTasksCount === 0,
      iconBg: "linear-gradient(135deg,#EF4444,#F87171)",
      iconColor: "#fff",
      accent: "#EF4444",
      Icon: AlertCircle,
      href: "/tasks",
    },
  ];

  // ─── Search state ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search results: filter leads, projects, and quotations from data
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: Array<{
      id: string;
      type: "lead" | "project" | "quotation";
      title: string;
      subtitle: string;
      badge: string;
      route: string;
      avatarText: string;
      avatarColor: { bg: string; color: string };
    }> = [];

    // 1. Leads
    leads.forEach((l) => {
      if (
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.status || "").toLowerCase().includes(q)
      ) {
        results.push({
          id: `lead-${l.id}`,
          type: "lead",
          title: l.name,
          subtitle: l.email || l.phone || "No contact info",
          badge: l.status || "New",
          route: `/leads/${l.id}`,
          avatarText: initials(l.name || "?"),
          avatarColor: avatarColor(l.name || "?"),
        });
      }
    });

    // 2. Projects
    allProjects.forEach((p) => {
      if (
        (p.name || "").toLowerCase().includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.state || "").toLowerCase().includes(q)
      ) {
        results.push({
          id: `project-${p.id}`,
          type: "project",
          title: p.name,
          subtitle: `${p.city || ""}${p.city && p.state ? ", " : ""}${p.state || ""}` || "Project",
          badge: "Project",
          route: `/projects/edit/${p.id}/step1`,
          avatarText: (p.name || "P").charAt(0).toUpperCase(),
          avatarColor: { bg: "#EFF6FF", color: "#3B82F6" },
        });
      }
    });

    // 3. Quotations
    allProjects.forEach((p) => {
      if ((p.name || "").toLowerCase().includes(q)) {
        results.push({
          id: `quote-${p.id}`,
          type: "quotation",
          title: `${p.name} Quotations`,
          subtitle: "Manage templates & generate quotations",
          badge: "Quotation",
          route: `/quotations/${p.id}`,
          avatarText: "QT",
          avatarColor: { bg: "#FFF7ED", color: "#F97316" },
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, leads, allProjects]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = searchFocused && searchQuery.trim().length >= 2;

  // ─── AI panel state ─────────────────────────────────────
  const [aiOpen, setAiOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiListening, setAiListening] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    if (aiListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setAiListening(true);
    rec.onend   = () => setAiListening(false);
    rec.onerror = () => setAiListening(false);

    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setAiQuery(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setAiListening(false);
      }
    };

    rec.start();
  };

  const handleAiSubmit = async () => {
    const q = aiQuery.trim();
    if (!q) return;
    setAiMessages((prev) => [...prev, { role: "user", text: q }]);
    setAiQuery("");
    setAiLoading(true);

    // Build a simple context from leads data
    const leadsContext = leads.slice(0, 30).map((l) =>
      `${l.name} | ${l.status} | ${l.email || ""} | source: ${l.lead_type || ""}`
    ).join("\n");

    try {
      const res = await axiosInstance.post("/ai/ask", {
        question: q,
        context: `CRM leads data (sample):\n${leadsContext}`,
      });
      const answer = res.data?.answer || res.data?.message || "No response from AI.";
      setAiMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch {
      // If AI endpoint doesn't exist, generate a local answer from data
      const q2 = q.toLowerCase();
      let answer = `I found ${leads.length} leads in your CRM.`;
      if (q2.includes("hot")) {
        const hot = leads.filter(l => (l.status||"").toLowerCase() === "hot").length;
        answer = `You have ${hot} hot leads out of ${leads.length} total.`;
      } else if (q2.includes("status") || q2.includes("pipeline")) {
        const counts = pipelineCounts;
        answer = `Pipeline: New(${counts.NEW}), Contacted(${counts.CONTACTED}), Site Visit(${counts["SITE VISIT"]}), Negotiation(${counts.NEGOTIATION}), Booked(${counts.BOOKED}).`;
      } else if (q2.includes("follow")) {
        answer = `You have ${totalPendingFollowups} pending follow-ups.`;
      } else if (q2.includes("project")) {
        answer = `You have ${projectsCount} active projects.`;
      }
      setAiMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "hsl(var(--background))" }}>
      <div style={{ padding: "22px 24px" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,gap:12}}>
          {/* Left: title */}
          <div style={{flexShrink:0}}>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--theme-color)",fontWeight:500,marginBottom:2}}>DASHBOARD</div>
            <div style={{fontSize:18,fontWeight:700,color:"hsl(var(--foreground))",lineHeight:1.2}}>
              {user?.name ? `Welcome back, ${user.name.split(" ")[0]} 👋` : "Welcome back 👋"}
            </div>
          </div>
          {/* Right: search + buttons */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Search */}
            <div style={{position:"relative"}}>
              <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#8A92B2",pointerEvents:"none"}} />
              <input value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchFocused(e.target.value.length > 0); }}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onFocus={() => searchQuery.length > 0 && setSearchFocused(true)}
                placeholder="Search leads, projects, quotations..."
                style={{paddingLeft:30,paddingRight:12,height:36,boxSizing:"border-box",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12,outline:"none",width:240,background:"hsl(var(--card))",color:"hsl(var(--foreground))",fontFamily:"inherit"}} />
            </div>
            {/* New Quotation */}
            <button
              onClick={() => navigate("/quotations")}
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",height:36,background:"#F97316",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>
              <FileText size={13} /> New quotation
            </button>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────── */}
        <div style={{marginBottom:20}}>
          <DashboardQuickActions role={user?.role} onCreateLead={() => setCreateLeadOpen(true)} />
        </div>

        {/* ── KPI Cards ─────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
          {kpiCards.map((card) => (
            <div
              key={card.label}
              onClick={() => navigate(card.href)}
              style={{
                background: "hsl(var(--card))",
                borderRadius: 14,
                padding: "18px 20px",
                cursor: "pointer",
                borderTop: `3px solid ${card.accent}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.13)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <card.Icon size={20} color={card.iconColor} />
                </div>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: card.badgePositive ? "#ECFDF5" : "#FEF2F2", color: card.badgePositive ? "#059669" : "#DC2626", fontWeight: 600 }}>
                  {card.badge}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>{isLoading ? "—" : card.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", marginTop: 4 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Pipeline ─────────────────────────────────────── */}
        <div style={{ background: "hsl(var(--card))", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 16 }}>Lead Pipeline</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {PIPELINE_STAGES.map(stage => {
              const count = pipelineCounts[stage.key] || 0;
              const pct = Math.round((count / maxPipelineVal) * 100);
              return (
                <div key={stage.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{stage.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "hsl(var(--muted))", borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${pct}%`, background: stage.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Charts ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <DashboardCharts leads={leads} />
        </div>

        {/* ── Leads / Projects / Users panels ──────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>

          {/* Recent Leads */}
          <div style={{background:"hsl(var(--card))",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:8,background:"rgba(var(--theme-color-rgb), 0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Users size={16} color="var(--theme-color)" />
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"hsl(var(--foreground))",lineHeight:1}}>Recent Leads</div>
                  <div style={{fontSize:10,color:"hsl(var(--muted-foreground))",marginTop:2}}>{leads.length} total leads</div>
                </div>
              </div>
              <Link to="/leads" style={{fontSize:11,color:"var(--theme-color)",fontWeight:500,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {recentLeads.slice(0,4).map(lead => {
              const av = avatarColor(lead.name || "?");
              const chip = statusChip(lead.status);
              return (
                <div key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid hsl(var(--border))",cursor:"pointer"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.opacity="0.8"}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.opacity="1"}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:av.bg,color:av.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>
                    {initials(lead.name||"?")}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:"hsl(var(--foreground))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name}</div>
                    <div style={{fontSize:10,color:"hsl(var(--muted-foreground))"}}>{lead.email||lead.phone||"—"}</div>
                  </div>
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:chip.bg,color:chip.color,fontWeight:600,flexShrink:0}}>{chip.label}</span>
                </div>
              );
            })}
            {recentLeads.length === 0 && <div style={{textAlign:"center",padding:"16px 0",color:"hsl(var(--muted-foreground))",fontSize:12}}>No leads yet</div>}
          </div>

          {/* Projects */}
          <div style={{background:"hsl(var(--card))",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:8,background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Building size={16} color="#F97316" />
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"hsl(var(--foreground))",lineHeight:1}}>Projects</div>
                  <div style={{fontSize:10,color:"hsl(var(--muted-foreground))",marginTop:2}}>{projectsCount} active projects</div>
                </div>
              </div>
              <Link to="/projects" style={{fontSize:11,color:"var(--theme-color)",fontWeight:500,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {projectsList.length > 0 ? projectsList.map((p,i) => (
              <div key={p.id||i} onClick={() => navigate("/projects")}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid hsl(var(--border))",cursor:"pointer"}}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.opacity="0.8"}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.opacity="1"}>
                <div style={{width:28,height:28,borderRadius:8,background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#F97316",flexShrink:0}}>
                  {(p.name||"P").charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:"hsl(var(--foreground))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"hsl(var(--muted-foreground))"}}>Project #{p.id}</div>
                </div>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#ECFDF5",color:"#059669",fontWeight:600}}>Active</span>
              </div>
            )) : (
              <div style={{textAlign:"center",padding:"16px 0",color:"hsl(var(--muted-foreground))",fontSize:12}}>No projects yet</div>
            )}
          </div>

          {/* Users */}
          <div style={{background:"hsl(var(--card))",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:8,background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <CalendarClock size={16} color="#059669" />
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"hsl(var(--foreground))",lineHeight:1}}>Users</div>
                  <div style={{fontSize:10,color:"hsl(var(--muted-foreground))",marginTop:2}}>{usersList.length} team members</div>
                </div>
              </div>
              <Link to="/users" style={{fontSize:11,color:"var(--theme-color)",fontWeight:500,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {usersList.length > 0 ? usersList.map((u,i) => {
              const av = avatarColor(u.name||"?");
              return (
                <div key={u.id||i} onClick={() => navigate("/users")}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid hsl(var(--border))",cursor:"pointer"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.opacity="0.8"}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.opacity="1"}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:av.bg,color:av.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>
                    {initials(u.name||"?")}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:"hsl(var(--foreground))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                    <div style={{fontSize:10,color:"hsl(var(--muted-foreground))"}}>{u.email||"—"}</div>
                  </div>
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"rgba(var(--theme-color-rgb), 0.1)",color:"var(--theme-color)",fontWeight:600,textTransform:"capitalize"}}>{u.role||"user"}</span>
                </div>
              );
            }) : (
              <div style={{textAlign:"center",padding:"16px 0",color:"hsl(var(--muted-foreground))",fontSize:12}}>No users found</div>
            )}
          </div>

        </div>

        {/* ── Today's Follow-ups ────────────────────────────── */}
        {todaysFollowups.length > 0 && (
          <div style={{ background: "hsl(var(--card))", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>Today's Follow-ups</div>
              <Link to="/followups" style={{ fontSize: 11, color: "var(--theme-color)", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
              {todaysFollowups.slice(0, 6).map(f => (
                <div key={f.id} style={{ background: "hsl(var(--muted))", borderRadius: 10, padding: "10px 14px", border: "1px solid hsl(var(--border))" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "var(--theme-color)", marginBottom: 4 }}>{f.time}</div>
                  <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.note || "Follow-up scheduled"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Global Search dropdown ──────────────────────────── */}
      {showDropdown && (
        <div
          ref={searchRef}
          style={{
            position: "fixed",
            top: 56,
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            background: "hsl(var(--card))",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            border: "1px solid hsl(var(--border))",
            zIndex: 200,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {searchResults.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No results match "{searchQuery}"</div>
          ) : (
            searchResults.map(item => {
              // Custom badge styling based on item type
              let badgeBg = "rgba(var(--theme-color-rgb), 0.1)";
              let badgeColor = "var(--theme-color)";
              let displayBadgeText = item.badge;

              if (item.type === "lead") {
                const chip = statusChip(item.badge);
                badgeBg = chip.bg;
                badgeColor = chip.color;
                displayBadgeText = chip.label;
              } else if (item.type === "project") {
                badgeBg = "rgba(59, 130, 246, 0.1)";
                badgeColor = "#3B82F6";
              } else if (item.type === "quotation") {
                badgeBg = "rgba(249, 115, 22, 0.1)";
                badgeColor = "#F97316";
              }

              return (
                <div
                  key={item.id}
                  onClick={() => { navigate(item.route); setSearchQuery(""); setSearchFocused(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid hsl(var(--border))", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--muted))"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: item.avatarColor.bg, color: item.avatarColor.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {item.avatarText}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{item.subtitle}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: badgeBg, color: badgeColor, fontWeight: 600 }}>{displayBadgeText}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── AI Panel ────────────────────────────────────────── */}
      {aiOpen && (
        <div style={{
          position: "fixed", bottom: 80, right: 24,
          width: 340, height: 440,
          background: "hsl(var(--card))", borderRadius: 16,
          boxShadow: "0 8px 40px rgba(var(--theme-color-rgb),0.18)",
          border: "1px solid hsl(var(--border))",
          display: "flex", flexDirection: "column",
          zIndex: 300,
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--theme-color),#EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>AI Assistant</span>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: 12, marginTop: 40 }}>
                Ask me anything about your leads, pipeline, or follow-ups.
              </div>
            )}
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "8px 12px", borderRadius: 10, fontSize: 12,
                  background: m.role === "user" ? "var(--theme-color)" : "rgba(var(--theme-color-rgb), 0.1)",
                  color: m.role === "user" ? "#fff" : "hsl(var(--foreground))",
                }}>{m.text}</div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "rgba(var(--theme-color-rgb), 0.1)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Thinking…</div>
              </div>
            )}
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid hsl(var(--border))", display: "flex", gap: 6 }}>
            <input
              ref={aiInputRef}
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSubmit()}
              placeholder="Ask about your CRM…"
              style={{ flex: 1, border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", fontFamily: "inherit", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
            />
            <button
              onClick={handleVoiceInput}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid hsl(var(--border))", background: aiListening ? "rgba(var(--theme-color-rgb), 0.1)" : "hsl(var(--card))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: aiListening ? "var(--theme-color)" : "hsl(var(--muted-foreground))" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <button
              onClick={handleAiSubmit}
              disabled={!aiQuery.trim() || aiLoading}
              style={{ width: 32, height: 32, borderRadius: 8, background: "var(--theme-color)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── AI FAB ──────────────────────────────────────────── */}
      <button
        onClick={() => setAiOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg,var(--theme-color),#EC4899)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(var(--theme-color-rgb),0.4)",
          zIndex: 300,
        }}
      >
        <Sparkles size={20} color="#fff" />
      </button>

    </div>
  );
};

export default DashboardClassicView;
