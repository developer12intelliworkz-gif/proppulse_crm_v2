const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function getPanValidationError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!PAN_REGEX.test(trimmed.toUpperCase())) {
    return "Enter a valid PAN (e.g. ABCDE1234F)";
  }
  return undefined;
}

export function getGstValidationError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Optional field — only validate format once a full GST length is entered
  if (trimmed.length < 15) return undefined;
  if (!GST_REGEX.test(trimmed.toUpperCase())) {
    return "Enter a valid 15-character GST number";
  }
  return undefined;
}

export function getUrlValidationError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (!url.hostname) return "Enter a valid URL";
    return undefined;
  } catch {
    return "Enter a valid URL";
  }
}

export function getEmailValidationError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address";
  }
  return undefined;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("://")) return trimmed;
  return `https://${trimmed}`;
}
