import type { LocalLead } from "@/store/types/leads";

/** Parse lead created_at for reliable sorting (handles ISO strings and date-only values). */
export function getLeadCreatedTimestamp(lead: {
  created_at?: string | null;
  id?: number;
}): number {
  if (!lead.created_at) return 0;
  const parsed = new Date(lead.created_at).getTime();
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

/** Newest lead first; ties broken by higher id (most recently inserted). */
export function sortLeadsByNewestFirst<T extends LocalLead>(leads: T[]): T[] {
  return [...leads].sort((a, b) => {
    const timeDiff = getLeadCreatedTimestamp(b) - getLeadCreatedTimestamp(a);
    if (timeDiff !== 0) return timeDiff;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}
