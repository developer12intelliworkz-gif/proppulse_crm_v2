import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import {
  COMPANY_APPROVAL_OPTIONS,
  type CompanyApproval,
} from "@/constants/company";
import { useAuth } from "@/contexts/AuthContext";
import { resolveCompanyId } from "@/utils/tenant";
import {
  getCompanyDraft,
  saveCompanyDraft,
  saveCompanyLogoDraft,
  getCompanyLogoDraft,
  clearCompanyLogoDraft,
} from "@/utils/onboardingDraft";
import { buildCompanyLogoUrl } from "@/utils/companyLogoUrl";
import {
  getOptionalPhoneValidationError,
  sanitizePhoneInput,
} from "@/utils/phoneValidation";
import GoogleMapLocationPicker from "./GoogleMapLocationPicker";

export interface CompanyRegistrationData {
  companyName: string;
  panCard: string;
  gstNo: string;
  registeredOfficeAddress: string;
  headOfficeAddress: string;
  contactPerson: string;
  contactNumber1: string;
  contactNumber2: string;
  companyLocationPin: string;
  latitude: string;
  longitude: string;
  approvals: CompanyApproval[];
  logoUrl: string;
}

const emptyRegistration = (): CompanyRegistrationData => ({
  companyName: "",
  panCard: "",
  gstNo: "",
  registeredOfficeAddress: "",
  headOfficeAddress: "",
  contactPerson: "",
  contactNumber1: "",
  contactNumber2: "",
  companyLocationPin: "",
  latitude: "",
  longitude: "",
  approvals: [],
  logoUrl: "",
});

interface CompanyRegistrationTabProps {
  companyId?: string;
  mode?: "settings" | "onboarding";
}

const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="rounded-xl border border-border/80 bg-slate-50/40 p-5 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const CompanyRegistrationTab = ({
  companyId: companyIdProp,
  mode = "settings",
}: CompanyRegistrationTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnboarding = mode === "onboarding";
  const effectiveCompanyId = isOnboarding
    ? user?.company_id ?? undefined
    : (companyIdProp ?? resolveCompanyId(user));
  const { toast } = useToast();
  const [data, setData] = useState<CompanyRegistrationData>(emptyRegistration());
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CompanyRegistrationData, string>>
  >({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldClass = (field: keyof CompanyRegistrationData) =>
    fieldError(field) ? "mt-1 border-destructive" : "mt-1";

  const fieldError = (field: keyof CompanyRegistrationData) =>
    submitAttempted && errors[field] ? errors[field] : undefined;

  const validateSingleField = (
    field: keyof CompanyRegistrationData,
    value: string,
  ): string | undefined => {
    switch (field) {
      case "companyName":
        return value.trim() ? undefined : "Company name is required";
      case "contactNumber1":
        return getOptionalPhoneValidationError(value);
      case "contactNumber2":
        return getOptionalPhoneValidationError(value);
      default:
        return undefined;
    }
  };

  const collectFormErrors = (
    values: CompanyRegistrationData,
  ): Partial<Record<keyof CompanyRegistrationData, string>> => {
    const fields: (keyof CompanyRegistrationData)[] = [
      "companyName",
      "contactNumber1",
      "contactNumber2",
    ];
    const next: Partial<Record<keyof CompanyRegistrationData, string>> = {};
    for (const field of fields) {
      const error = validateSingleField(field, String(values[field] ?? ""));
      if (error) next[field] = error;
    }
    return next;
  };

  const loadRegistration = async (targetCompanyId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/companies/${targetCompanyId}`);
      const raw = response.data || {};
      const approvals = Array.isArray(raw.approvals) ? raw.approvals : [];

      setData({
        companyName: raw.name || "",
        panCard: raw.pan_card || "",
        gstNo: raw.gst_no || "",
        registeredOfficeAddress: raw.registered_office_address || "",
        headOfficeAddress: raw.head_office_address || "",
        contactPerson: raw.contact_person || "",
        contactNumber1: raw.contact_number_1 || "",
        contactNumber2: raw.contact_number_2 || "",
        companyLocationPin: raw.company_location_search || "",
        latitude:
          raw.latitude !== null && raw.latitude !== undefined
            ? String(raw.latitude)
            : "",
        longitude:
          raw.longitude !== null && raw.longitude !== undefined
            ? String(raw.longitude)
            : "",
        approvals: approvals.filter((a: string) =>
          COMPANY_APPROVAL_OPTIONS.includes(a as CompanyApproval),
        ),
        logoUrl: raw.logo_url || "",
      });
      setLogoPreview(buildCompanyLogoUrl(raw.logo_url) || "");
    } catch (error) {
      console.error("Failed to load company registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load company registration details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnboarding && !user?.company_id) {
      const draft = getCompanyDraft();
      setData(draft ?? emptyRegistration());
      const logoDraft = getCompanyLogoDraft();
      setLogoPreview(logoDraft || buildCompanyLogoUrl(draft?.logoUrl) || "");
      setLoading(false);
      return;
    }
    if (effectiveCompanyId) {
      void loadRegistration(effectiveCompanyId);
    } else {
      setLoading(false);
    }
  }, [effectiveCompanyId, isOnboarding, user?.company_id]);

  const updateField = <K extends keyof CompanyRegistrationData>(
    field: K,
    value: CompanyRegistrationData[K],
  ) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (submitAttempted) {
        setErrors(collectFormErrors(next));
      } else if (typeof value === "string") {
        const singleError = validateSingleField(field, value);
        setErrors((prevErrors) => {
          const updated = { ...prevErrors };
          if (singleError) updated[field] = singleError;
          else delete updated[field];
          return updated;
        });
      }
      return next;
    });
  };

  const toggleApproval = (approval: CompanyApproval) => {
    setData((prev) => {
      const exists = prev.approvals.includes(approval);
      return {
        ...prev,
        approvals: exists
          ? prev.approvals.filter((a) => a !== approval)
          : [...prev.approvals, approval],
      };
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    if (isOnboarding && !user?.company_id) {
      await saveCompanyLogoDraft(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = collectFormErrors(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      if (isOnboarding && !user?.company_id) {
        saveCompanyDraft(data);
        if (logoFile) {
          await saveCompanyLogoDraft(logoFile);
        }
        toast({
          title: "Step 1 complete",
          description: "Continue to brand setup on the next step.",
        });
        navigate("/onboarding/step2", { replace: true });
      } else if (effectiveCompanyId) {
        if (logoFile) {
          const fd = new FormData();
          fd.append("registration", JSON.stringify(data));
          fd.append("logo", logoFile);
          await axiosInstance.put(`/companies/${effectiveCompanyId}`, fd);
        } else {
          await axiosInstance.put(`/companies/${effectiveCompanyId}`, {
            registration: data,
          });
        }
        toast({
          title: "Saved",
          description: "Company registration details updated successfully.",
        });
        if (isOnboarding) {
          navigate("/onboarding/step2", { replace: true });
        } else {
          await loadRegistration(effectiveCompanyId);
        }
        setLogoFile(null);
      }
      setSubmitAttempted(false);
      setErrors({});
    } catch (error) {
      console.error("Failed to save company registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save company registration details.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    id: string,
    label: string,
    field: keyof CompanyRegistrationData,
    input: ReactNode,
    required = false,
  ) => (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {fieldError(field) && (
        <p className="text-sm text-destructive mt-0.5">{fieldError(field)}</p>
      )}
      {input}
    </div>
  );

  const formFields = (
    <div className="space-y-5">
      <FormSection title="Basic details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Company Logo</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground px-2 text-center">
                    Preview
                  </span>
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP or SVG. Max 2 MB.
                </p>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            {renderField(
              "company-name",
              "Company Name",
              "companyName",
              <Input
                id="company-name"
                value={data.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="Intelliworkz Business Solutions Pvt. Ltd."
                aria-invalid={!!fieldError("companyName")}
                className={fieldClass("companyName")}
              />,
              true,
            )}
          </div>
          <div>
            {renderField(
              "pan-card",
              "PAN Card",
              "panCard",
              <Input
                id="pan-card"
                value={data.panCard}
                onChange={(e) =>
                  updateField("panCard", e.target.value.toUpperCase())
                }
                placeholder="e.g. ABCDE1234F"
                className={fieldClass("panCard")}
              />,
            )}
          </div>
          <div>
            {renderField(
              "gst-no",
              "GST No",
              "gstNo",
              <Input
                id="gst-no"
                value={data.gstNo}
                onChange={(e) =>
                  updateField("gstNo", e.target.value.toUpperCase())
                }
                placeholder="GST registration number"
                className={fieldClass("gstNo")}
              />,
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Office addresses"
        description="Registered and corporate office locations."
      >
        <div className="space-y-4">
          {renderField(
            "registered-office",
            "Registered Office Address",
            "registeredOfficeAddress",
            <Textarea
              id="registered-office"
              value={data.registeredOfficeAddress}
              onChange={(e) =>
                updateField("registeredOfficeAddress", e.target.value)
              }
              placeholder="Legal registered office address"
              className={`${fieldClass("registeredOfficeAddress")} min-h-[72px]`}
            />,
          )}
          {renderField(
            "head-office",
            "Head Office Address",
            "headOfficeAddress",
            <Textarea
              id="head-office"
              value={data.headOfficeAddress}
              onChange={(e) =>
                updateField("headOfficeAddress", e.target.value)
              }
              placeholder="Corporate head office address"
              className={`${fieldClass("headOfficeAddress")} min-h-[72px]`}
            />,
          )}
        </div>
      </FormSection>

      <FormSection title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderField(
            "contact-person",
            "Contact Person",
            "contactPerson",
            <Input
              id="contact-person"
              value={data.contactPerson}
              onChange={(e) => updateField("contactPerson", e.target.value)}
              className={fieldClass("contactPerson")}
            />,
          )}
          {renderField(
            "contact-1",
            "Contact Number 1",
            "contactNumber1",
            <Input
              id="contact-1"
              type="tel"
              inputMode="tel"
              value={data.contactNumber1}
              onChange={(e) =>
                updateField(
                  "contactNumber1",
                  sanitizePhoneInput(e.target.value),
                )
              }
              placeholder="9427801299"
              aria-invalid={!!fieldError("contactNumber1")}
              className={fieldClass("contactNumber1")}
            />,
          )}
          {renderField(
            "contact-2",
            "Contact Number 2",
            "contactNumber2",
            <Input
              id="contact-2"
              type="tel"
              inputMode="tel"
              value={data.contactNumber2}
              onChange={(e) =>
                updateField(
                  "contactNumber2",
                  sanitizePhoneInput(e.target.value),
                )
              }
              placeholder="+91 (98765) 43210"
              aria-invalid={!!fieldError("contactNumber2")}
              className={fieldClass("contactNumber2")}
            />,
          )}
        </div>
      </FormSection>

      <FormSection
        title="Company location"
        description="Search or drag the pin to set coordinates."
      >
        <div className="space-y-4">
          <GoogleMapLocationPicker
            searchValue={data.companyLocationPin}
            latitude={data.latitude}
            longitude={data.longitude}
            onSearchChange={(v) => updateField("companyLocationPin", v)}
            onCoordinatesChange={(lat, lng) => {
              setData((prev) => {
                const next = { ...prev, latitude: lat, longitude: lng };
                if (submitAttempted) setErrors(collectFormErrors(next));
                return next;
              });
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              "latitude",
              "Latitude",
              "latitude",
              <Input
                id="latitude"
                type="number"
                step="any"
                value={data.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
                className={fieldClass("latitude")}
              />,
            )}
            {renderField(
              "longitude",
              "Longitude",
              "longitude",
              <Input
                id="longitude"
                type="number"
                step="any"
                value={data.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
                className={fieldClass("longitude")}
              />,
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Approvals">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {COMPANY_APPROVAL_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={data.approvals.includes(option)}
                onCheckedChange={() => toggleApproval(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </FormSection>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-sm text-muted-foreground">
        Loading company registration…
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Step 1 of 2
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            Company Registration
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Enter your legal entity details. These are saved only after you
            complete brand setup in the next step.
          </p>
        </div>

        <form
          id="company-registration-form"
          noValidate
          onSubmit={handleSave}
          className="flex flex-col"
        >
          <div className="px-6 py-6 space-y-1">{formFields}</div>

          <div className="shrink-0 border-t bg-slate-50/80 px-6 py-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[160px]">
              {saving ? "Please wait…" : "Next Step"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Company Registration</h2>
        <p className="text-sm text-muted-foreground">
          Legal entity details, office addresses, location, and regulatory
          approvals.
        </p>
      </div>

      <form
        id="company-registration-form"
        noValidate
        onSubmit={handleSave}
        className="space-y-6"
      >
        {formFields}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Registration"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanyRegistrationTab;
