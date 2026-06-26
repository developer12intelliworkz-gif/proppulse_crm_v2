import { Link } from "react-router-dom";
import { BarChart3, CalendarCheck, ClipboardList, Plus, UserPlus } from "lucide-react";
import { getDashboardRole } from "@/utils/dashboardHelpers";

interface DashboardQuickActionsProps {
  role?: string | null;
  onCreateLead: () => void;
}

const ActionBtn = ({
  onClick,
  to,
  icon: Icon,
  label,
  primary,
}: {
  onClick?: () => void;
  to?: string;
  icon: React.ElementType;
  label: string;
  primary?: boolean;
}) => {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 14px",
    borderRadius: 8,
    border: `1px solid ${primary ? "var(--theme-color)" : "#E2E5F0"}`,
    background: primary ? "var(--theme-color)" : "#fff",
    color: primary ? "#fff" : "#1A1F36",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.1s",
    whiteSpace: "nowrap" as const,
  };

  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = primary ? "var(--theme-color-hover)" : "rgba(var(--theme-color-rgb), 0.1)";
    e.currentTarget.style.borderColor = primary ? "var(--theme-color-hover)" : "var(--theme-color)";
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = primary ? "var(--theme-color)" : "#fff";
    e.currentTarget.style.borderColor = primary ? "var(--theme-color)" : "#E2E5F0";
  };

  if (to) {
    return (
      <Link to={to} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <Icon size={14} />
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Icon size={14} />
      {label}
    </button>
  );
};

const DashboardQuickActions = ({ role, onCreateLead }: DashboardQuickActionsProps) => {
  const dashboardRole = getDashboardRole(role);
  const isAdmin = dashboardRole === "admin" || dashboardRole === "manager";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      <ActionBtn icon={Plus} label="Create Lead" onClick={onCreateLead} primary />

      {isAdmin && (
        <>
          <ActionBtn icon={UserPlus} label="Add User" to="/users" />
          <ActionBtn icon={BarChart3} label="Reports" to="/reports" />
          <ActionBtn icon={CalendarCheck} label="Follow-ups" to="/followups" />
          <ActionBtn icon={ClipboardList} label="Tasks" to="/tasks" />
        </>
      )}
    </div>
  );
};

export default DashboardQuickActions;
