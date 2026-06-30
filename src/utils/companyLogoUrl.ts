import { SECURITY_CONFIG } from "@/config/security";

/** Build a full URL for a company logo path returned by the API. */
export const buildCompanyLogoUrl = (
  logoPath: string | null | undefined,
): string | null => {
  if (!logoPath || typeof logoPath !== "string" || !logoPath.trim()) {
    return null;
  }
  const trimmed = logoPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("blob:")) return trimmed;

  const base =
    (SECURITY_CONFIG.ONLY_URL || SECURITY_CONFIG.BASE || "").replace(
      /\/api\/?$/,
      "",
    ) || "";

  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
};
