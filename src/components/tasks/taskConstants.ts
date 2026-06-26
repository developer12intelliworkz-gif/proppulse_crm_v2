export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "open" | "in_progress" | "on_hold" | "completed";
export type AssociationType = "standalone" | "lead" | "project" | "both";
export type TaskViewFilter =
  | "all"
  | "my"
  | "overdue"
  | "today"
  | "week"
  | "completed";

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  due_on?: string;
  due_date?: string;
  due_time?: string;
  assignees: string[];
  assignee_names?: string[];
  remark?: string;
  priority: TaskPriority;
  status: TaskStatus;
  document?: string;
  created_by: string;
  project_id?: number | null;
  lead_id?: number | null;
  lead_name?: string | null;
  project_name?: string | null;
  association_type: AssociationType;
  reminder_at?: string;
  created_at: string;
  updated_at: string;
  comments?: TaskComment[];
  activity?: TaskActivity[];
}

export interface TaskComment {
  id: number;
  user_name?: string;
  body: string;
  created_at: string;
}

export interface TaskActivity {
  id: number;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  user_name?: string;
  created_at: string;
}

export const PRIORITIES: { value: TaskPriority; label: string; className: string }[] = [
  { value: "low", label: "Low", className: "bg-slate-100 text-slate-800" },
  { value: "medium", label: "Medium", className: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", className: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", className: "bg-red-100 text-red-800" },
];

export const STATUSES: { value: TaskStatus; label: string; className: string }[] = [
  { value: "open", label: "Open", className: "bg-slate-100 text-slate-800" },
  { value: "in_progress", label: "In Progress", className: "bg-blue-100 text-blue-800" },
  { value: "on_hold", label: "On Hold", className: "bg-amber-100 text-amber-800" },
  { value: "completed", label: "Completed", className: "bg-emerald-100 text-emerald-800" },
];

export const KANBAN_COLUMNS: TaskStatus[] = [
  "open",
  "in_progress",
  "on_hold",
  "completed",
];

export const VIEW_CHIPS: { id: TaskViewFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "my", label: "My Tasks" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due Today" },
  { id: "week", label: "This Week" },
  { id: "completed", label: "Completed" },
];

export function priorityMeta(p: string) {
  return PRIORITIES.find((x) => x.value === p) || PRIORITIES[1];
}

export function statusMeta(s: string) {
  return STATUSES.find((x) => x.value === s) || STATUSES[0];
}

export function associationLabel(task: TaskItem): string {
  if (task.association_type === "both") {
    return `${task.lead_name || "Lead"} · ${task.project_name || "Project"}`;
  }
  if (task.association_type === "lead") return task.lead_name || `Lead #${task.lead_id}`;
  if (task.association_type === "project") return task.project_name || `Project #${task.project_id}`;
  return "Standalone";
}
