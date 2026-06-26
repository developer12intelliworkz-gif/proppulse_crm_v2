import type { Dispatch, SetStateAction } from "react";

/** Clear a single field error when the user edits that field. */
export const clearFieldError = <T extends Record<string, string>>(
  setErrors: Dispatch<SetStateAction<T>>,
  field: keyof T,
) => {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    return { ...prev, [field]: "" };
  });
};
