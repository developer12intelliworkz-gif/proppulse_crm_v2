import axiosInstance from "@/api/axiosInstance";
import { hasPendingCompanyDraft } from "@/utils/onboardingDraft";

export type OnboardingStep = "company" | "brand" | null;

export interface OnboardingStatus {
  userCount: number;
  needsOnboarding: boolean;
  onboardingStep: OnboardingStep;
  hasCompany: boolean;
  brandCount: number | null;
  userCompanyId?: string | null;
  userBrandId?: string | null;
}

export interface UserBrand {
  id: string;
  brand_display_name: string;
  brand_logo: string | null;
  brand_description?: string | null;
  company_id: string;
  is_primary: boolean;
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await axiosInstance.get("/onboarding/status");
  return res.data;
}

export function resolveOnboardingPath(status: OnboardingStatus): string {
  if (!status.needsOnboarding) return "/dashboard";
  if (status.onboardingStep === "brand") return "/onboarding/step2";
  if (!status.hasCompany && hasPendingCompanyDraft()) return "/onboarding/step2";
  return "/onboarding/step1";
}

export async function getPostLoginPath(): Promise<string> {
  const status = await fetchOnboardingStatus();
  return resolveOnboardingPath(status);
}

export async function fetchMyBrands(): Promise<UserBrand[]> {
  const res = await axiosInstance.get("/onboarding/brands/me");
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function setActiveBrand(brandId: string): Promise<UserBrand[]> {
  const res = await axiosInstance.post("/onboarding/active-brand", {
    brand_id: brandId,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
