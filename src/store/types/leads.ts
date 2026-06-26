export interface LocalLead {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  lead_type: string;
  address: string | null;
  property_type: string | null;
  budget: string | null;
  message: string | null;
  status: string;
  interested_project_id: number | null;
  project_name: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  interest_level: string | null;
}

export function mapApiLeadToLocalLead(apiLead: Record<string, unknown>): LocalLead {
  return {
    id: Number(apiLead.id) || 0,
    name: (apiLead.name as string) || null,
    email: (apiLead.email as string) || null,
    phone: (apiLead.phone as string) || null,
    lead_type: (apiLead.lead_type as string) || "unknown",
    address: (apiLead.address as string) || null,
    property_type: (apiLead.property_type as string) || null,
    budget: (apiLead.budget as string) || null,
    message: (apiLead.message as string) || null,
    status: (apiLead.status as string) || "new",
    interested_project_id: (apiLead.interested_project_id as number) || null,
    project_name: (apiLead.project_name as string) || null,
    created_at: (apiLead.created_at as string) || new Date().toISOString(),
    assigned_to: (apiLead.assigned_to as string) || null,
    assigned_to_name: (apiLead.assigned_to_name as string) || null,
    interest_level: (apiLead.interest_level as string) || null,
  };
}
