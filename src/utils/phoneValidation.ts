/** Digits, +, -, parentheses, and spaces only. */
export const PHONE_ALLOWED_PATTERN = /^[\d+\-() ]+$/;

/** Strip characters that are not valid in a phone number. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\-() ]/g, "");
}

/** Phone must be non-empty, contain at least one digit, and use only allowed characters. */
export function isValidPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    PHONE_ALLOWED_PATTERN.test(trimmed) &&
    /\d/.test(trimmed)
  );
}

export function getPhoneValidationError(value: string): string | undefined {
  if (!value.trim()) return "Phone number is required";
  return getOptionalPhoneValidationError(value);
}

/** Validate phone when the field is optional (empty is OK). */
export function getOptionalPhoneValidationError(
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!PHONE_ALLOWED_PATTERN.test(trimmed)) {
    return "Phone number can only contain numbers, +, -, (), and spaces";
  }
  if (!/\d/.test(trimmed)) {
    return "Phone number must contain at least one digit";
  }
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < 7) {
    return "Phone number must be at least 7 digits";
  }
  if (digitCount > 15) {
    return "Phone number cannot exceed 15 digits";
  }
  return undefined;
}
