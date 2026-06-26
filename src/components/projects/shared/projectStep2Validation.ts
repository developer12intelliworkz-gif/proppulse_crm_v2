import type {
  ProjectStep2FieldErrors,
  ProjectStep2FormValues,
} from "./ProjectStep2LocationFields";

export const emptyStep2Errors = (): ProjectStep2FieldErrors => ({
  search_address: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zip: "",
});

/** Step 2 is skippable until Google Maps is configured. Manual address is optional. */
export function validateProjectStep2(
  values: ProjectStep2FormValues,
): ProjectStep2FieldErrors {
  const errors = emptyStep2Errors();

  const manualFields = [
    values.address,
    values.city,
    values.state,
    values.country,
    values.zip,
    values.street,
    values.locality,
  ];
  const hasManual = manualFields.some((v) => String(v ?? "").trim() !== "");

  // Fully empty step — allowed (skip for now).
  if (!hasManual) {
    return errors;
  }

  // Manual address entry without Google Maps — validate filled address set.
  if (!values.address.trim()) {
    errors.address = "Address is required when entering location manually";
  }
  if (!values.city.trim()) errors.city = "City is required";
  if (!values.state.trim()) errors.state = "State is required";
  if (!values.country.trim()) errors.country = "Country is required";
  if (!values.zip.trim()) errors.zip = "Pin code / ZIP is required";

  return errors;
}

export function isStep2Valid(errors: ProjectStep2FieldErrors): boolean {
  return Object.values(errors).every((v) => !v);
}
