/**
 * Utility functions for generating lead SKUs based on a chronological order.
 */

export interface SkuLead {
  id: number;
  lead_type?: string | null;
  created_at?: string | null;
}

/**
 * Builds a chronological index map for all leads, sorted oldest first by created_at.
 */
export function buildLeadIndexMap(allLeads: SkuLead[]): Map<number, number> {
  const map = new Map<number, number>();
  if (allLeads && allLeads.length > 0) {
    const sorted = [...allLeads].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id; // stable fallback
    });
    sorted.forEach((x, idx) => {
      map.set(x.id, idx + 1);
    });
  }
  return map;
}

/**
 * Generates a fully capitalized SKU for a lead (e.g. MB01, 99A02, HS1466).
 */
export function getLeadSku(lead: SkuLead, leadIndexMap: Map<number, number>): string {
  const type = (lead.lead_type || "").toLowerCase().replace(/[\s_-]+/g, "");
  let prefix = "LD";
  if (type.includes("magicbricks")) prefix = "MB";
  else if (type.includes("99acres")) prefix = "99A";
  else if (type.includes("housing")) prefix = "HS";
  else if (type.includes("meta") || type.includes("facebook")) prefix = "MT";
  else if (type.includes("website")) prefix = "WB";
  else if (type.includes("own") || type.includes("crm")) prefix = "CRM";
  else if (type.includes("realitymart")) prefix = "RM";

  let serialNum = lead.id;
  if (leadIndexMap.has(lead.id)) {
    serialNum = leadIndexMap.get(lead.id)!;
  }

  // Ensure prefix and output is fully capitalized (e.g. "99A5258" instead of "99a5258")
  return `${prefix.toUpperCase()}${String(serialNum).padStart(2, "0")}`;
}
