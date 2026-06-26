import type { LocalLead } from "@/store/types/leads";
import type { TaskItem } from "@/components/tasks/taskConstants";
import {
  isSalesFacingRole,
  normalizeRole,
} from "@/utils/rolePermissions";

export type DashboardRole = "admin" | "manager" | "sales" | "other";

export function getDashboardRole(role?: string | null): DashboardRole {
  const r = normalizeRole(role);
  if (r === "admin") return "admin";
  if (r === "manager") return "manager";
  if (isSalesFacingRole(r)) return "sales";
  return "other";
}

/** Admin & manager see all CRM data; sales sees assigned leads only. */
export function filterLeadsForRole(
  leads: LocalLead[],
  userId: string | undefined,
  role?: string | null,
): LocalLead[] {
  const dashboardRole = getDashboardRole(role);
  if (dashboardRole === "admin" || dashboardRole === "manager") {
    return leads;
  }
  if (!userId) return [];
  return leads.filter((lead) => lead.assigned_to === userId);
}

export function getDashboardSubtitle(role?: string | null): string {
  const dashboardRole = getDashboardRole(role);
  if (dashboardRole === "admin") {
    return "Here's your complete CRM overview";
  }
  if (dashboardRole === "sales") {
    return "Here's your personal leads & tasks overview";
  }
  if (dashboardRole === "manager") {
    return "Here's your team CRM overview";
  }
  return "Manage your leads, properties, projects, and follow-ups efficiently";
}

export function getRoleBadgeClass(role?: string | null): string {
  const dashboardRole = getDashboardRole(role);
  if (dashboardRole === "admin") {
    return "bg-slate-800 text-white border-slate-700";
  }
  if (dashboardRole === "manager") {
    return "bg-purple-600 text-white border-purple-500";
  }
  if (dashboardRole === "sales") {
    return "bg-blue-600 text-white border-blue-500";
  }
  return "bg-gray-600 text-white border-gray-500";
}

export function toDateKey(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isWithinDays(isoDate: string, days: number, from = new Date()): boolean {
  const key = toDateKey(isoDate);
  if (!key) return false;
  const end = startOfDay(from);
  const start = addDays(end, -(days - 1));
  const target = startOfDay(new Date(key));
  return target >= start && target <= end;
}

export function isSameDay(isoDate: string | undefined, ref = new Date()): boolean {
  const key = toDateKey(isoDate);
  if (!key) return false;
  return key === ref.toISOString().slice(0, 10);
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";
  const now = new Date();
  const past = new Date(dateString);
  if (Number.isNaN(past.getTime())) return "—";
  const diffInMin = Math.floor((now.getTime() - past.getTime()) / 60000);
  if (diffInMin < 1) return "Just now";
  if (diffInMin < 60) return `${diffInMin} min ago`;
  if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)} hr ago`;
  return past.toLocaleDateString("en-IN");
}

export interface TrendResult {
  text: string;
  positive: boolean;
}

export function percentTrend(current: number, previous: number, label: string): TrendResult {
  if (previous === 0) {
    if (current === 0) {
      return { text: "No change", positive: true };
    }
    return { text: `+${current} ${label}`, positive: true };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) {
    return { text: `↑ ${pct}% ${label}`, positive: true };
  }
  if (pct < 0) {
    return { text: `↓ ${Math.abs(pct)}% ${label}`, positive: false };
  }
  return { text: "No change", positive: true };
}

export function countTrend(current: number, previous: number, label: string): TrendResult {
  const diff = current - previous;
  if (diff > 0) {
    return { text: `↑ ${diff} ${label}`, positive: true };
  }
  if (diff < 0) {
    return { text: `↓ ${Math.abs(diff)} ${label}`, positive: false };
  }
  return { text: "No change", positive: true };
}

export function groupLeadsBySource(leads: LocalLead[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const key = (lead.lead_type || "unknown").trim() || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function leadsCreatedByDay(
  leads: LocalLead[],
  days: number,
  ref = new Date(),
): { date: string; label: string; count: number }[] {
  const end = startOfDay(ref);
  const rows: { date: string; label: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = addDays(end, -i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    const count = leads.filter((lead) => toDateKey(lead.created_at) === key).length;
    rows.push({ date: key, label, count });
  }

  return rows;
}

export function getLeadStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-gray-100 text-gray-800",
    qualified: "bg-blue-100 text-blue-800",
    contacted: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    working: "bg-purple-100 text-purple-800",
    "proposal sent": "bg-orange-100 text-orange-800",
    lost: "bg-red-100 text-red-800",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export function capitalizeStatus(status: string): string {
  return status
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isTaskOverdue(task: TaskItem, today = new Date()): boolean {
  if (task.status === "completed") return false;
  const due = toDateKey(task.due_on || task.due_date);
  if (!due) return false;
  return due < today.toISOString().slice(0, 10);
}

export function isTaskDueToday(task: TaskItem, today = new Date()): boolean {
  if (task.status === "completed") return false;
  return isSameDay(task.due_on || task.due_date, today);
}

export function getTaskPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    critical: "bg-red-200 text-red-900",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return colors[priority.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export interface FollowUpDashboardItem {
  activityId: number | null;
  leadId: string;
  leadName: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  followUpType?: string;
  status?: string;
  assigneeName?: string;
}
