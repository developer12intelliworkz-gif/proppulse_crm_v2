export const PIPELINE_STAGES = [
  { id: "new_enquiry", label: "New Enquiry", short: "New", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "first_contact", label: "First Contact", short: "Contact", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "followup_scheduled", label: "Follow-up Scheduled", short: "Scheduled", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "in_negotiation", label: "In Negotiation", short: "Negotiation", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "proposal_sent", label: "Proposal Sent", short: "Proposal", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "followup_pending", label: "Follow-up Pending", short: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "closed_won", label: "Closed Won", short: "Won", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "closed_lost", label: "Closed Lost", short: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "nurturing", label: "Nurturing", short: "Nurture", color: "bg-teal-100 text-teal-800 border-teal-200" },
] as const;

export const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New Enquiry" },
  { value: "contacted", label: "First Contact" },
  { value: "qualified", label: "Qualified" },
  { value: "working", label: "In Negotiation" },
  { value: "proposal sent", label: "Proposal Sent" },
  { value: "lost", label: "Closed Lost" },
  { value: "closed", label: "Closed Won" },
];

export const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "wa", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
  { value: "sms", label: "SMS" },
];

export const OUTCOME_OPTIONS = [
  "Interested",
  "Not Interested",
  "Callback",
  "No Response",
  "Converted",
  "Lost",
];

export function stageLabel(id: string) {
  return PIPELINE_STAGES.find((s) => s.id === id)?.label || id;
}

export function stageColor(id: string) {
  return PIPELINE_STAGES.find((s) => s.id === id)?.color || "bg-gray-100 text-gray-800";
}

export function priorityColor(p: string) {
  const v = (p || "medium").toLowerCase();
  if (v === "high" || v === "hot") return "bg-red-100 text-red-800 border-red-200";
  if (v === "low" || v === "cold") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

export function statusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "overdue":
    case "missed":
      return "bg-red-100 text-red-800";
    case "rescheduled":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
