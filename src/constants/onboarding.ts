export const COMPANY_INDUSTRY_OPTIONS = [
  "Residential Real Estate",
  "Commercial Real Estate",
  "Mixed Development",
  "Property Management",
  "Real Estate Brokerage",
  "Construction",
  "Other",
] as const;

export type CompanyIndustry = (typeof COMPANY_INDUSTRY_OPTIONS)[number];
