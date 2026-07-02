import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  CreditCard,
  Users,
  FileText,
  Target,
  Map,
  FileDown,
  ArrowRight,
  Building2,
} from "lucide-react";

interface SettingItem {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  path: string;
  permission?: string;
}

const settingsData: SettingItem[] = [
  {
    icon: Users,
    title: "Roles & Responsibilities",
    description: "Manage Roles & Responsibilities",
    path: "/settings/roles-and-responsibilities",
    permission: "view_roles",
  },
  {
    icon: CreditCard,
    title: "Lead Sources",
    description: "Manage different lead sources.",
    path: "/settings/lead-types",
    permission: "manage_lead_types",
  },
  {
    icon: Map,
    title: "Import",
    description: "Import your data in bulk.",
    path: "/settings/import",
    permission: "import_leads",
  },
  {
    icon: FileDown,
    title: "Download",
    description: "Download your files, activities & more.",
    path: "/settings/download",
    permission: "export_leads",
  },
  {
    icon: Target,
    title: "Company Details",
    description: "Manage your common company details.",
    path: "/settings/company-details",
    permission: "view_settings",
  },
  {
    icon: Building2,
    title: "Brand Registration",
    description: "Register and manage multiple brands for your company.",
    path: "/settings/brand-registration",
    permission: "view_settings",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Manage your documents and files.",
    path: "/settings/document-management",
    permission: "view_settings",
  },
  {
    icon: Users,
    title: "Reassignment Leads",
    description: "Bulk reassignment of leads.",
    path: "/settings/reassignment-leads",
    permission: "assign_leads",
  },
];

const SettingCard: React.FC<SettingItem> = ({
  icon: Icon,
  title,
  description,
  path,
}) => (
  <Link
    to={path}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "18px 20px",
      background: "hsl(var(--card))",
      borderRadius: 14,
      border: "1px solid hsl(var(--border))",
      borderLeft: "3px solid var(--theme-color)",
      textDecoration: "none",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(var(--theme-color-rgb), 0.12)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
    }}
  >
    {/* Icon Circle */}
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "rgba(var(--theme-color-rgb), 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon style={{ width: 20, height: 20, color: "var(--theme-color)" }} />
    </div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "hsl(var(--foreground))",
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "hsl(var(--muted-foreground))",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {description}
      </div>
    </div>

    {/* Arrow */}
    <ArrowRight
      style={{
        width: 16,
        height: 16,
        color: "hsl(var(--muted-foreground))",
        flexShrink: 0,
        opacity: 0.5,
      }}
    />
  </Link>
);

const Settings = () => {
  const { hasPermission } = useAuth();

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "hsl(var(--background))",
      }}
    >
      <div style={{ padding: "22px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--theme-color)",
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            CONFIGURATION
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "hsl(var(--foreground))",
              lineHeight: 1.2,
            }}
          >
            Settings Management
          </div>
          <div
            style={{
              fontSize: 13,
              color: "hsl(var(--muted-foreground))",
              marginTop: 4,
            }}
          >
            Manage and configure your application settings
          </div>
        </div>

        {/* Settings Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 14,
          }}
        >
          {settingsData
            .filter((item) => !item.permission || hasPermission(item.permission))
            .map((item, index) => (
              <SettingCard
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                path={item.path}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
