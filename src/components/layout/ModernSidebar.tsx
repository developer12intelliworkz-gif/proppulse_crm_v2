import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Phone,
  FileText,
  ChevronLeft,
  Building2,
  ChevronDown,
  Briefcase,
  UserCheck,
  Settings,
  LayoutList,
  MessageCircle,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axiosInstance from "@/api/axiosInstance";
import { SECURITY_CONFIG } from "@/config/security";
import logo from "./logo.png"; // ← Static logo

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
  children?: MenuItem[];
}

const ModernSidebar = () => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const visualCollapsed = isCollapsed && !isHovered;
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);

  // Hardcoded for now — replace with user?.companyId if available
  const companyId = "60c06a65-d9cb-4df7-89fc-4a77004a353d";

  // Base URL without /api for serving static files (images)
  const baseURL = SECURITY_CONFIG.ONLY_URL.replace("/api", "");

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!companyId) {
        setLoadingLogo(false);
        return;
      }

      try {
        setLoadingLogo(true);
        const response = await axiosInstance.get(`/companies/${companyId}`);
        const logoPath = response.data?.logo_url;

        if (
          logoPath &&
          typeof logoPath === "string" &&
          logoPath.trim() !== ""
        ) {
          setCompanyLogoUrl(`${baseURL}${logoPath}`);
          setLogoFailed(false);
        } else {
          setCompanyLogoUrl(null); // Use default logo
          setLogoFailed(true);
        }
      } catch (err) {
        console.warn("Failed to fetch company logo, falling back to default.");
        setCompanyLogoUrl(null);
        setLogoFailed(true);
      } finally {
        setLoadingLogo(false);
      }
    };

    fetchCompanyLogo();
  }, [companyId, baseURL]);

  // Final logo to display: API logo if available, otherwise local default
  const displayLogoSrc = companyLogoUrl || logo;

  const menuSections = [
    {
      title: "Main Dashboard",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Business Operations",
      items: [
        {
          id: "leads",
          label: "Leads Management",
          path: "/leads",
          icon: UserCheck,
          permission: "view_leads",
        },
        {
          id: "projects",
          label: "Projects",
          path: "/projects",
          icon: Briefcase,
          permission: "view_projects",
        },
        {
          id: "project-setup",
          label: "Project Setup",
          path: "/project-setup",
          icon: Building2,
          permission: "view_projects",
        },
        {
          id: "quotations",
          label: "Quotations",
          path: "/quotations",
          icon: FileText,
          permission: "view_projects",
        },
        {
          id: "followups",
          label: "Follow-ups",
          path: "/followups",
          icon: CalendarClock,
          permission: "view_followups",
        },
        {
          id: "tasks",
          label: "Tasks",
          path: "/tasks",
          icon: LayoutList,
          permission: "view_tasks",
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          id: "users",
          label: "Users",
          path: "/users",
          icon: Users,
          permission: "manage_users",
        },
        {
          id: "reports",
          label: "Reports",
          path: "/reports",
          icon: FileText,
          permission: "view_reports",
        },
        {
          id: "chat",
          label: "Chat",
          path: "/chat",
          icon: MessageCircle,
          permission: "view_settings",
        },
        {
          id: "settings",
          label: "Settings",
          path: "/settings",
          icon: Settings,
          permission: "view_settings",
        },
      ],
    },
  ];

  const canShowMenuItem = (permission?: string) =>
    !permission || hasPermission(permission);

  const isActiveRoute = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    if (!canShowMenuItem(item.permission)) return null;

    const isActive = isActiveRoute(item.path);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const itemContent = hasChildren ? (
      <Button
        variant="ghost"
        title={visualCollapsed ? item.label : undefined}
        className={cn(
          "w-full h-10 mb-1 transition-all duration-200 text-[14px] font-medium rounded-lg relative whitespace-nowrap overflow-hidden border-none flex items-center",
          isActive 
            ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/90 hover:text-[hsl(var(--sidebar-primary-foreground))]" 
            : "text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
        )}
        style={{
          paddingLeft: 12 + depth * 16,
          paddingRight: 12,
          justifyContent: "flex-start",
          transition: "background 0.15s, color 0.15s",
        }}
        onClick={() => toggleExpanded(item.id)}
      >
        <item.icon
          className={cn(
            "h-6 w-6 shrink-0 transition-colors duration-200",
            isActive ? "text-[hsl(var(--sidebar-primary-foreground))]" : "text-[hsl(var(--sidebar-foreground))]/60 group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
          style={{
            marginRight: visualCollapsed ? 0 : 12,
            transition: "margin-right 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        <span
          className={cn(
            "text-left whitespace-nowrap overflow-hidden text-ellipsis text-[14px] font-medium",
            !visualCollapsed && "flex-1",
            isActive ? "text-[hsl(var(--sidebar-primary-foreground))]" : "text-[hsl(var(--sidebar-foreground))]/75 group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
          style={{
            opacity: visualCollapsed ? 0 : 1,
            transform: visualCollapsed ? "translateX(-8px)" : "translateX(0)",
            width: visualCollapsed ? 0 : "auto",
            minWidth: 0,
            visibility: visualCollapsed ? "hidden" : "visible",
            transition: "opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1), transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), width 0.18s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 ml-1 shrink-0",
            isActive ? "text-[hsl(var(--sidebar-primary-foreground))]" : "text-[hsl(var(--sidebar-foreground))]/40 group-hover:text-[hsl(var(--sidebar-accent-foreground))]/80",
            isExpanded && "rotate-180",
          )}
          style={{
            opacity: visualCollapsed ? 0 : 1,
            transform: visualCollapsed ? "scale(0.8)" : "scale(1)",
            width: visualCollapsed ? 0 : "auto",
            visibility: visualCollapsed ? "hidden" : "visible",
            transition: "opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Button>
    ) : (
      <NavLink
        to={item.path}
        title={visualCollapsed ? item.label : undefined}
        className={cn(
          "flex items-center h-10 mb-1 rounded-lg transition-all duration-200 group text-[14px] font-medium relative whitespace-nowrap overflow-hidden",
          isActive 
            ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/90 hover:text-[hsl(var(--sidebar-primary-foreground))]" 
            : "text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
        )}
        style={{
          paddingLeft: 12 + depth * 16,
          paddingRight: 12,
          justifyContent: "flex-start",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <item.icon
          className={cn(
            "h-6 w-6 shrink-0 transition-colors duration-200",
            isActive ? "text-[hsl(var(--sidebar-primary-foreground))]" : "text-[hsl(var(--sidebar-foreground))]/60 group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
          style={{
            marginRight: visualCollapsed ? 0 : 12,
            transition: "margin-right 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        <span
          className={cn(
            "whitespace-nowrap overflow-hidden text-ellipsis text-[14px] font-medium text-left",
            !visualCollapsed && "flex-1",
            isActive ? "text-[hsl(var(--sidebar-primary-foreground))]" : "text-[hsl(var(--sidebar-foreground))]/75 group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
          style={{
            opacity: visualCollapsed ? 0 : 1,
            transform: visualCollapsed ? "translateX(-8px)" : "translateX(0)",
            width: visualCollapsed ? 0 : "auto",
            minWidth: 0,
            visibility: visualCollapsed ? "hidden" : "visible",
            transition: "opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1), transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), width 0.18s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {item.label}
        </span>
      </NavLink>
    );

    return (
      <div key={item.id}>
        {itemContent}
        {hasChildren && isExpanded && !visualCollapsed && (
          <div className="ml-2 border-l border-[hsl(var(--sidebar-border))]">
            {item.children?.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] relative select-none shrink-0 z-40 overflow-x-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: visualCollapsed ? 64 : 256,
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Header - Logo Section */}
      <div className="flex items-center border-b border-[hsl(var(--sidebar-border))] shrink-0 justify-center h-20 px-4">
        <div className="relative w-full h-9 flex items-center justify-center overflow-hidden">
          {/* Collapsed Logo (Badge/Icon) */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all ease-in-out"
            style={{
              opacity: visualCollapsed ? 1 : 0,
              transform: visualCollapsed ? "scale(1)" : "scale(0.95)",
              pointerEvents: visualCollapsed ? "auto" : "none",
              transitionDuration: "0.22s",
            }}
          >
            {companyLogoUrl && !logoFailed ? (
              <img
                src={companyLogoUrl}
                alt="Company Logo"
                className="h-8 w-8 rounded-full border border-[hsl(var(--sidebar-border))] object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              // Recreating the PropPulse skyscrapers logo badge using brand variables
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--sidebar-primary))] shadow-md shadow-[hsl(var(--sidebar-primary))]/20 transition-transform duration-300 hover:scale-105 shrink-0">
                <svg className="w-5 h-5 text-[hsl(var(--sidebar-primary-foreground))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <line x1="5" y1="18" x2="19" y2="18" />
                  <path d="M7 18V10h3v8" />
                  <path d="M10 18V6h4v12" />
                  <path d="M14 18V12h3v6" />
                </svg>
              </div>
            )}
          </div>

          {/* Expanded Logo */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all ease-in-out"
            style={{
              opacity: visualCollapsed ? 0 : 1,
              transform: visualCollapsed ? "scale(0.95)" : "scale(1)",
              pointerEvents: visualCollapsed ? "none" : "auto",
              transitionDuration: "0.22s",
            }}
          >
            {loadingLogo ? (
              <div className="h-9 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <img
                src={logoFailed ? logo : displayLogoSrc}
                alt="Company Logo"
                className="h-9 w-auto max-w-[130px] object-contain transition-all duration-300 dark:filter dark:brightness-0 dark:invert"
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-3 px-2">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canShowMenuItem(item.permission),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <p
                className="text-[10px] font-bold text-[hsl(var(--sidebar-foreground))]/45 uppercase tracking-widest block whitespace-nowrap overflow-hidden text-ellipsis px-3 mt-3 mb-1.5 transition-all ease-in-out"
                style={{
                  opacity: visualCollapsed ? 0 : 1,
                  transitionDuration: "0.22s",
                }}
              >
                {section.title}
              </p>
              {visibleItems.map((item) => renderMenuItem(item))}
            </div>
          );
        })}
      </nav>

      {/* Footer Branding Footnote */}
      <div className="border-t border-[hsl(var(--sidebar-border))] mt-auto bg-[hsl(var(--sidebar-accent))] flex items-center justify-center h-16 shrink-0 relative overflow-hidden px-4">
        {/* Collapsed Logo Footnote */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all ease-in-out cursor-pointer"
          style={{
            opacity: visualCollapsed ? 1 : 0,
            transform: visualCollapsed ? "scale(1)" : "scale(0.9)",
            pointerEvents: visualCollapsed ? "auto" : "none",
            transitionDuration: "0.22s",
          }}
        >
          <div className="group relative">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-[12px] font-bold text-[hsl(var(--sidebar-primary-foreground))] shadow-sm hover:scale-105 transition-all duration-200">
              P
            </div>
            {/* Hover Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-950 text-white text-[10px] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 font-medium">
              Powered by PropPulse
            </div>
          </div>
        </div>

        {/* Expanded Logo Footnote */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-all ease-in-out"
          style={{
            opacity: visualCollapsed ? 0 : 1,
            transform: visualCollapsed ? "scale(0.9)" : "scale(1)",
            pointerEvents: visualCollapsed ? "none" : "auto",
            transitionDuration: "0.22s",
          }}
        >
          <span className="text-[9px] text-[hsl(var(--sidebar-foreground))]/45 uppercase tracking-widest font-bold block mb-0.5">
            POWERED BY
          </span>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[13px] font-bold text-[hsl(var(--sidebar-foreground))] tracking-tight">
              Prop<span className="text-[hsl(var(--sidebar-primary))]">Pulse</span>
            </span>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--sidebar-primary))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--sidebar-primary))]"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSidebar;
