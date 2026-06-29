/** Simplified 5-stage pipeline */
export const PIPELINE_STAGES = [
  { id: "new", label: "New", short: "New", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "contacted", label: "Contacted", short: "Contacted", color: "bg-blue-100 text-blue-800 border-blue-200" },
  {
    id: "site_visit_negotiation",
    label: "Site Visit / Negotiation",
    short: "Site Visit",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  { id: "won", label: "Won", short: "Won", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "lost", label: "Lost", short: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

/** Maps DB lead status → pipeline stage */
export function derivePipelineStageFromLead(
  leadStatus: string,
  hasActiveFollowUp = false,
): PipelineStageId {
  const status = (leadStatus || "new").toLowerCase().trim();
  if (status === "closed") return "won";
  if (status === "lost") return "lost";
  if (["working", "proposal sent", "qualified", "site visit"].includes(status)) {
    return "site_visit_negotiation";
  }
  if (status === "contacted" || hasActiveFollowUp) return "contacted";
  return "new";
}

export const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "working", label: "Site Visit / Negotiation" },
  { value: "closed", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "wa", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "meeting", label: "In-Person Meeting" },
];

export const DISPOSITION_OPTIONS = [
  { value: "interested_hot", label: "Interested – Hot", closesLead: false },
  { value: "interested_warm", label: "Interested – Warm", closesLead: false },
  { value: "not_interested", label: "Not Interested", closesLead: true },
  { value: "no_answer", label: "No Answer / Switched Off", closesLead: false },
  { value: "call_back_later", label: "Call Back Later", closesLead: false, requiresNextDate: true },
  { value: "converted", label: "Converted / Booking Done", closesLead: true },
  { value: "junk", label: "Junk / Invalid Lead", closesLead: true },
] as const;

export const NOT_INTERESTED_REASONS = [
  { value: "budget", label: "Budget" },
  { value: "location", label: "Location" },
  { value: "timing", label: "Timing" },
  { value: "competitor", label: "Competitor" },
  { value: "other", label: "Other" },
];

export const TABLE_STATUS_LABELS: Record<string, string> = {
  overdue: "Overdue",
  pending: "Upcoming",
  completed: "Closed",
  rescheduled: "Upcoming",
};

export const KPI_FORMULAS = {
  todayFollowups:
    "Count of incomplete follow-ups scheduled for today (IST), excluding Won/Lost leads.",
  overdue:
    "Count of incomplete follow-ups past their scheduled date with no disposition logged, excluding Won/Lost leads. Sorted oldest first.",
  conversionRate:
    '(Leads with disposition "Converted / Booking Done" on any follow-up) ÷ (Leads with at least one follow-up logged) × 100. Capped at 100%.',
  monthDonePending:
    "Follow-ups completed this calendar month vs still pending (incomplete) this month.",
} as const;

/** @deprecated use DISPOSITION_OPTIONS */
export const OUTCOME_OPTIONS = DISPOSITION_OPTIONS.map((d) => d.label);

export function stageLabel(id: string) {
  return PIPELINE_STAGES.find((s) => s.id === id)?.label || id;
}

export function stageColor(id: string) {
  return PIPELINE_STAGES.find((s) => s.id === id)?.color || "bg-gray-100 text-gray-800";
}

export function priorityLabel(p: string) {
  const v = (p || "warm").toLowerCase();
  if (v === "high" || v === "hot") return "Hot";
  if (v === "low" || v === "cold") return "Cold";
  return "Warm";
}

export function priorityColor(p: string) {
  const v = (p || "warm").toLowerCase();
  if (v === "high" || v === "hot") return "bg-red-100 text-red-800 border-red-200";
  if (v === "low" || v === "cold") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

export function tableStatusColor(status: string, leadStatus?: string) {
  if (leadStatus === "closed" || leadStatus === "lost") return "bg-slate-100 text-slate-700";
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function deriveTableStatus(
  followUpStatus: string,
  leadStatus: string,
  nextDate: string | null | undefined,
  today: string,
): string {
  if (leadStatus === "closed" || leadStatus === "lost") return "Closed";
  if (followUpStatus === "overdue") return "Overdue";
  if (nextDate && nextDate.slice(0, 10) === today) return "Due Today";
  if (nextDate) return "Upcoming";
  return "Pending";
}

export function capConversionRate(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.min(100, Math.round(rate * 10) / 10);
}

export function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
