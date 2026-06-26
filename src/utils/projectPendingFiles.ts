/** Pending upload files kept outside Redux (non-serializable). */

const pendingLogos = new Map<string, File>();

export const projectLogoKey = (projectId: string | null) =>
  projectId ?? "create";

export const setPendingProjectLogo = (
  key: string,
  file: File | null,
): void => {
  if (file) pendingLogos.set(key, file);
  else pendingLogos.delete(key);
};

export const getPendingProjectLogo = (key: string): File | null =>
  pendingLogos.get(key) ?? null;

export const clearPendingProjectLogo = (key: string): void => {
  pendingLogos.delete(key);
};
