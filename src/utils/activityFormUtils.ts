/** Status options for Follow-Up and Site Visit activities only. */
export const ACTIVITY_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed", label: "Missed" },
  { value: "overdue", label: "Overdue" },
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUS_OPTIONS)[number]["value"];

export function activityStatusLabel(status?: string | null): string {
  if (!status) return "Scheduled";
  return (
    ACTIVITY_STATUS_OPTIONS.find((s) => s.value === status)?.label ||
    status.replace(/_/g, " ")
  );
}

export function activityStatusBadgeClass(status?: string | null): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "overdue":
    case "missed":
      return "bg-red-100 text-red-800";
    case "rescheduled":
      return "bg-purple-100 text-purple-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function splitDateTime(value?: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  if (value.includes("T")) {
    const [date, timePart] = value.split("T");
    return { date: date || "", time: (timePart || "").slice(0, 5) };
  }
  return { date: value.slice(0, 10), time: "" };
}

export function normalizeFollowupForm(raw?: Record<string, unknown>) {
  const scheduleOn = String(raw?.scheduleOn || "");
  const fromSchedule = splitDateTime(scheduleOn);
  return {
    scheduleDate:
      String(raw?.scheduleDate || "") || fromSchedule.date || String(raw?.followupDate || ""),
    scheduleTime:
      String(raw?.scheduleTime || "") || fromSchedule.time || String(raw?.time || "").slice(0, 5),
    leadsTimezone: String(raw?.leadsTimezone || "asiakolkata"),
    followupType: String(raw?.followupType || "call"),
    subject: String(raw?.subject ?? ""),
    agenda: String(raw?.agenda ?? ""),
    status: String(raw?.status || "scheduled"),
  };
}

export function normalizeSiteVisitForm(raw?: Record<string, unknown>) {
  const scheduleOn = String(raw?.scheduleOn || "");
  const endsOn = String(raw?.endsOn || "");
  const fromSchedule = splitDateTime(scheduleOn);
  const fromEnds = splitDateTime(endsOn);
  return {
    project: String(raw?.project || "selectproject"),
    siteVisitType: String(raw?.siteVisitType || "selecttype"),
    leadsTimezone: String(raw?.leadsTimezone || "asiakolkata"),
    teams: String(raw?.teams || "selectteam"),
    scheduleDate: String(raw?.scheduleDate || "") || fromSchedule.date,
    scheduleTime: String(raw?.scheduleTime || "") || fromSchedule.time,
    endsDate: String(raw?.endsDate || "") || fromEnds.date,
    endsTime: String(raw?.endsTime || "") || fromEnds.time,
    siteVisitConfirmation: String(raw?.siteVisitConfirmation || "true"),
    channelPartner: String(raw?.channelPartner || "none"),
    agenda: String(raw?.agenda ?? ""),
    scheduleFollowup: String(raw?.scheduleFollowup || ""),
    status: String(raw?.status || "scheduled"),
  };
}

export function buildFollowupDetails(
  state: ReturnType<typeof normalizeFollowupForm>,
) {
  const scheduleOn = `${state.scheduleDate}T${state.scheduleTime}`;
  return {
    scheduleOn,
    leadsTimezone: state.leadsTimezone,
    followupType: state.followupType,
    subject: state.subject || "Follow-up",
    agenda: state.agenda || "",
    status: state.status || "scheduled",
  };
}

export function buildSiteVisitDetails(
  state: ReturnType<typeof normalizeSiteVisitForm>,
) {
  const scheduleOn = `${state.scheduleDate}T${state.scheduleTime}`;
  let endsOn =
    state.endsDate && state.endsTime
      ? `${state.endsDate}T${state.endsTime}`
      : "";
  if (!endsOn && scheduleOn) {
    endsOn = scheduleOn;
  }
  return {
    project: state.project,
    siteVisitType: state.siteVisitType,
    leadsTimezone: state.leadsTimezone,
    teams: state.teams || "selectteam",
    scheduleOn,
    endsOn,
    siteVisitConfirmation: state.siteVisitConfirmation || "true",
    channelPartner: state.channelPartner === "none" ? "" : state.channelPartner,
    agenda: state.agenda || "",
    scheduleFollowup: state.scheduleFollowup || "",
    status: state.status || "scheduled",
  };
}
