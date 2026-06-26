const PHONE_ALLOWED_PATTERN = /^[\d+\-\s]+$/;

/** Allow digits, +, -, and spaces; strip alphabets and other invalid characters. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\-\s]/g, "");
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
  if (!PHONE_ALLOWED_PATTERN.test(value.trim())) {
    return "Phone number can only contain numbers, +, -, and spaces";
  }
  if (!/\d/.test(value)) {
    return "Phone number must contain at least one digit";
  }
  return undefined;
}
