/**
 * Formats snake_case / kebab-case identifiers for display.
 * Examples: meta → Meta, own_crm → Own Crm, facebook_ads → Facebook Ads
 */
export const formatPascalCaseDisplayName = (name: string): string =>
  name
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

/** Alias used for role names — same transformation as lead source names. */
export const formatRoleDisplayName = formatPascalCaseDisplayName;
