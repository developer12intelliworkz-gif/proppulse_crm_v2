/** Shared parsing for project create/update request bodies (multipart + JSON). */

export const parseBoolField = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

export const parseIntArrayField = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      }
    } catch {
      return [];
    }
  }
  return [];
};

export const normalizeMonthYearDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return trimmed;
};

export const parseNotifyEmails = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    if (value.startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }
  return [];
};

/** Returns error message if ZIP is missing/blank. */
export const validateZipRequired = (zip) => {
  if (!zip || !String(zip).trim()) {
    return "ZIP/Pincode is required";
  }
  return null;
};

const ADDRESS_BODY_FIELDS = [
  "search_address",
  "address",
  "street",
  "city",
  "state",
  "country",
  "zip",
  "locality",
  "latitude",
  "longitude",
];

/** True when request is saving address step data (meaningful address content). */
export const isAddressStepPayload = (body) => {
  const hasSearchOrCity = ["search_address", "city"].some(
    (field) => String(body[field] ?? "").trim() !== "",
  );
  if (!hasSearchOrCity) return false;

  return ADDRESS_BODY_FIELDS.some((field) => {
    const val = body[field];
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
};

export const resolveZipForValidation = (body, existingZip = null) => {
  if (body.zip !== undefined) return body.zip;
  return existingZip;
};
