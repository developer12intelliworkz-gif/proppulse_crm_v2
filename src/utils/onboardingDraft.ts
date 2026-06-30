import type { CompanyRegistrationData } from "@/components/settings/CompanyRegistrationTab";

const DRAFT_KEY = "onboarding_company_draft";
const LOGO_DRAFT_KEY = "onboarding_company_logo_draft";

export function saveCompanyDraft(data: CompanyRegistrationData): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

export function getCompanyDraft(): CompanyRegistrationData | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanyRegistrationData;
  } catch {
    return null;
  }
}

export function clearCompanyDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function hasPendingCompanyDraft(): boolean {
  return getCompanyDraft() !== null;
}

export async function saveCompanyLogoDraft(file: File): Promise<void> {
  const dataUrl = await readFileAsDataUrl(file);
  sessionStorage.setItem(LOGO_DRAFT_KEY, dataUrl);
}

export function getCompanyLogoDraft(): string | null {
  return sessionStorage.getItem(LOGO_DRAFT_KEY);
}

export function clearCompanyLogoDraft(): void {
  sessionStorage.removeItem(LOGO_DRAFT_KEY);
}

export function dataUrlToFile(
  dataUrl: string,
  filename = "company-logo.png",
): File | null {
  try {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
