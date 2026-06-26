/** http(s) URL with a valid host — no spaces or invalid characters. */
export const HTTP_URL_PATTERN =
  /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;

/** Remove whitespace from URL inputs as the user types. */
export function sanitizeUrlInput(value: string): string {
  return value.replace(/\s/g, "");
}

export function isValidHttpUrl(value: string): boolean {
  return !getOptionalUrlValidationError(value);
}

/** Validate required URL field. */
export function getUrlValidationError(
  value: string,
  fieldLabel = "URL",
): string | undefined {
  if (!sanitizeUrlInput(value)) {
    return `${fieldLabel} is required`;
  }
  return getOptionalUrlValidationError(value, fieldLabel);
}

/** Validate URL when the field is optional (empty is OK). */
export function getOptionalUrlValidationError(
  value: string,
  fieldLabel = "URL",
): string | undefined {
  const trimmed = sanitizeUrlInput(value);
  if (!trimmed) return undefined;

  if (!/^https?:\/\//i.test(trimmed)) {
    return `${fieldLabel} must start with http:// or https://`;
  }

  if (!HTTP_URL_PATTERN.test(trimmed)) {
    return `Enter a valid ${fieldLabel.toLowerCase()} (e.g. https://example.com)`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return `${fieldLabel} must use http:// or https://`;
    }
  } catch {
    return `Enter a valid ${fieldLabel.toLowerCase()}`;
  }

  return undefined;
}

export function getFacebookUrlValidationError(value: string): string | undefined {
  const trimmed = sanitizeUrlInput(value);
  if (!trimmed) return undefined;

  const base = getOptionalUrlValidationError(value, "Facebook link");
  if (base) return base;

  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (!host.includes("facebook.com") && !host.includes("fb.com")) {
      return "Facebook link must be a facebook.com or fb.com URL";
    }
  } catch {
    return "Enter a valid Facebook link";
  }

  return undefined;
}

export function getInstagramUrlValidationError(value: string): string | undefined {
  const trimmed = sanitizeUrlInput(value);
  if (!trimmed) return undefined;

  const base = getOptionalUrlValidationError(value, "Instagram link");
  if (base) return base;

  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (!host.includes("instagram.com")) {
      return "Instagram link must be an instagram.com URL";
    }
  } catch {
    return "Enter a valid Instagram link";
  }

  return undefined;
}
