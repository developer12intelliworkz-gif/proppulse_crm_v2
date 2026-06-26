export const LEADS_LIST_PATH = "/leads";
export const LEADS_RETURN_STORAGE_KEY = "leadsReturnTo";

export function buildLeadsListUrl(page: number, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
  }
  const qs = params.toString();
  return qs ? `${LEADS_LIST_PATH}?${qs}` : LEADS_LIST_PATH;
}

export function parseLeadsPageFromSearch(search: string): number {
  const p = Number(new URLSearchParams(search).get("page"));
  return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
}

export function rememberLeadsReturnTo(returnTo: string) {
  sessionStorage.setItem(LEADS_RETURN_STORAGE_KEY, returnTo);
}

export function getLeadsReturnTo(fallback = LEADS_LIST_PATH): string {
  return sessionStorage.getItem(LEADS_RETURN_STORAGE_KEY) || fallback;
}

export function clearLeadsReturnTo() {
  sessionStorage.removeItem(LEADS_RETURN_STORAGE_KEY);
}
