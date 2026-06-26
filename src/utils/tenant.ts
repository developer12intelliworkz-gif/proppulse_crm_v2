import { DEFAULT_COMPANY_ID } from "@/constants/company";
import type { User } from "@/store/types/auth";

/** Resolve company id from authenticated user, with legacy fallback when unset. */
export function resolveCompanyId(user?: User | null): string {
  return user?.company_id || DEFAULT_COMPANY_ID;
}
