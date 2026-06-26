/** Default company ID — used when user has no company_id (legacy single-tenant). */
export const DEFAULT_COMPANY_ID = "60c06a65-d9cb-4df7-89fc-4a77004a353d";

export const COMPANY_APPROVAL_OPTIONS = [
  "Plan Pass",
  "Fire NOC",
  "Bank Approvals",
] as const;

export type CompanyApproval = (typeof COMPANY_APPROVAL_OPTIONS)[number];
