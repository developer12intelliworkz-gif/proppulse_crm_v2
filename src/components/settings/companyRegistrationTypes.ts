import type { CompanyApproval } from "@/constants/company";

export interface AddressFields {
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface CompanyContact {
  salutation: string;
  firstName: string;
  lastName: string;
  contactType: string;
  email: string;
  phone: string;
  enableEmail: boolean;
  enableSms: boolean;
  isPrimary: boolean;
}

export interface SocialUrls {
  facebook: string;
  twitter: string;
  linkedIn: string;
  instagram: string;
  youtube: string;
  googleBusiness: string;
}

export interface CompanyRegistrationData {
  companyName: string;
  displayName: string;
  description: string;
  panCard: string;
  gstNo: string;
  website: string;
  timeZone: string;
  currency: string;
  disclaimer: string;
  customReportingEmail: string;
  logoUrl: string;
  registeredOffice: AddressFields;
  headOffice: AddressFields;
  headOfficeSameAsRegistered: boolean;
  companyLocationPin: string;
  latitude: string;
  longitude: string;
  contacts: CompanyContact[];
  socialUrls: SocialUrls;
  marketingDomains: string;
  emailFooter: string;
  dltEntityId: string;
  telemarketerId: string;
  approvals: CompanyApproval[];
  approvalNotes: string;
}

export const emptyAddress = (): AddressFields => ({
  address1: "",
  address2: "",
  city: "",
  state: "",
  country: "",
  zip: "",
});

export const emptyContact = (): CompanyContact => ({
  salutation: "Mr.",
  firstName: "",
  lastName: "",
  contactType: "Director",
  email: "",
  phone: "",
  enableEmail: true,
  enableSms: false,
  isPrimary: false,
});

export const emptyRegistration = (): CompanyRegistrationData => ({
  companyName: "",
  displayName: "",
  description: "",
  panCard: "",
  gstNo: "",
  website: "",
  timeZone: "Asia/Kolkata",
  currency: "INR",
  disclaimer: "",
  customReportingEmail: "",
  logoUrl: "",
  registeredOffice: emptyAddress(),
  headOffice: emptyAddress(),
  headOfficeSameAsRegistered: false,
  companyLocationPin: "",
  latitude: "",
  longitude: "",
  contacts: [],
  socialUrls: {
    facebook: "",
    twitter: "",
    linkedIn: "",
    instagram: "",
    youtube: "",
    googleBusiness: "",
  },
  marketingDomains: "",
  emailFooter: "",
  dltEntityId: "",
  telemarketerId: "",
  approvals: [],
  approvalNotes: "",
});

export function formatAddressLines(address: AddressFields): string {
  const lines = [
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildDefaultEmailFooter(
  companyName: string,
  address: AddressFields,
): string {
  return formatAddressLines({
    ...address,
    address1: companyName || address.address1,
  });
}

export function parseHeadOfficeAddress(raw: string | null | undefined): AddressFields {
  if (!raw?.trim()) return emptyAddress();
  try {
    const parsed = JSON.parse(raw) as Partial<AddressFields>;
    if (parsed && typeof parsed === "object" && "address1" in parsed) {
      return { ...emptyAddress(), ...parsed };
    }
  } catch {
    // legacy plain-text value
  }
  return { ...emptyAddress(), address1: raw.trim() };
}

export function mapApiToRegistration(raw: Record<string, unknown>): CompanyRegistrationData {
  const approvals = Array.isArray(raw.approvals) ? raw.approvals : [];
  const contacts = Array.isArray(raw.contacts)
    ? raw.contacts
        .filter((c) => c && typeof c === "object" && !Array.isArray(c))
        .map((c: Record<string, unknown>) => ({
          salutation: String(c.salutation || ""),
          firstName: String(c.first_name || ""),
          lastName: String(c.last_name || ""),
          contactType: String(c.contact_type || ""),
          email: String(c.email || ""),
          phone: String(c.phone || ""),
          enableEmail: Boolean(c.enable_notification_email),
          enableSms: Boolean(c.enable_notification_sms),
          isPrimary: Boolean(c.is_primary),
        }))
    : [];

  const registeredFromTable: AddressFields = {
    address1: String(raw.address_line1 || ""),
    address2: String(raw.address_line2 || ""),
    city: String(raw.city || ""),
    state: String(raw.state || ""),
    country: String(raw.country || ""),
    zip: String(raw.zip || ""),
  };

  const hasStructuredRegistered = Object.values(registeredFromTable).some(Boolean);
  const registeredOffice = hasStructuredRegistered
    ? registeredFromTable
    : parseHeadOfficeAddress(String(raw.registered_office_address || ""));

  return {
    companyName: String(raw.name || ""),
    displayName: String(raw.display_name || ""),
    description: String(raw.description || ""),
    panCard: String(raw.pan_card || ""),
    gstNo: String(raw.gst_no || ""),
    website: String(raw.website_url || ""),
    timeZone: String(raw.time_zone || "Asia/Kolkata"),
    currency: String(raw.currency || "INR"),
    disclaimer: String(raw.disclaimer || ""),
    customReportingEmail: String(raw.custom_reporting_email || ""),
    logoUrl: String(raw.logo_url || ""),
    registeredOffice,
    headOffice: parseHeadOfficeAddress(String(raw.head_office_address || "")),
    headOfficeSameAsRegistered: false,
    companyLocationPin: String(raw.company_location_search || ""),
    latitude:
      raw.latitude !== null && raw.latitude !== undefined
        ? String(raw.latitude)
        : "",
    longitude:
      raw.longitude !== null && raw.longitude !== undefined
        ? String(raw.longitude)
        : "",
    contacts,
    socialUrls: {
      facebook: String(raw.facebook_url || ""),
      twitter: String(raw.twitter_url || ""),
      linkedIn: String(raw.linkedin_url || ""),
      instagram: String(raw.instagram_url || ""),
      youtube: String(raw.youtube_url || ""),
      googleBusiness: String(raw.google_plus_url || ""),
    },
    marketingDomains: String(raw.domain || ""),
    emailFooter: String(raw.footer_text || ""),
    dltEntityId: String(raw.dlt_entity_id || ""),
    telemarketerId: String(raw.telemarketer_id || ""),
    approvals: approvals.filter((a): a is CompanyApproval => typeof a === "string"),
    approvalNotes: String(raw.approval_notes || ""),
  };
}
