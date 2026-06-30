import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import {
  getPhoneValidationError,
  sanitizePhoneInput,
} from "@/utils/phoneValidation";
import {
  getFacebookUrlValidationError,
  getInstagramUrlValidationError,
  getUrlValidationError,
  sanitizeUrlInput,
} from "@/utils/urlValidation";
import { buildCompanyLogoUrl } from "@/utils/companyLogoUrl";
import {
  dataUrlToFile,
  getCompanyLogoDraft,
} from "@/utils/onboardingDraft";
import type { CompanyRegistrationData } from "./CompanyRegistrationTab";

const resolveLogoUrl = (path: string | null) =>
  buildCompanyLogoUrl(path) || "";

export interface BrandRecord {
  id: string;
  company_id: string;
  brand_logo: string | null;
  brand_display_name: string;
  website: string | null;
  contact_number: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
}

interface BrandFormState {
  brand_display_name: string;
  website: string;
  contact_number: string;
  facebook_link: string;
  instagram_link: string;
  brand_logo: string;
}

const emptyForm = (): BrandFormState => ({
  brand_display_name: "",
  website: "",
  contact_number: "",
  facebook_link: "",
  instagram_link: "",
  brand_logo: "",
});

export interface BrandRegistrationFormProps {
  companyId: string;
  editingBrand?: BrandRecord | null;
  pendingCompanyRegistration?: CompanyRegistrationData | null;
  formId?: string;
  hideFooter?: boolean;
  onCancel?: () => void;
  onSaved?: (brand: BrandRecord, meta: { isCreate: boolean }) => void;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  footerExtra?: ReactNode;
}

const BrandRegistrationForm = ({
  companyId,
  editingBrand = null,
  pendingCompanyRegistration = null,
  formId = "brand-registration-form",
  hideFooter = false,
  onCancel,
  onSaved,
  submitLabel,
  cancelLabel = "Cancel",
  showCancel = true,
  footerExtra,
}: BrandRegistrationFormProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<BrandFormState>(() =>
    editingBrand
      ? {
          brand_display_name: editingBrand.brand_display_name || "",
          website: editingBrand.website || "",
          contact_number: editingBrand.contact_number || "",
          facebook_link: editingBrand.facebook_link || "",
          instagram_link: editingBrand.instagram_link || "",
          brand_logo: editingBrand.brand_logo || "",
        }
      : emptyForm(),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(
    editingBrand?.brand_logo ? resolveLogoUrl(editingBrand.brand_logo) : "",
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BrandFormState, string>>
  >({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldClass = (field: keyof BrandFormState) =>
    errors[field] ? "mt-1 border-destructive" : "mt-1";

  const fieldError = (field: keyof BrandFormState) =>
    submitAttempted && errors[field] ? errors[field] : undefined;

  const validateForm = (
    values: BrandFormState = form,
  ): Partial<Record<keyof BrandFormState, string>> => {
    const newErrors: Partial<Record<keyof BrandFormState, string>> = {};

    if (!values.brand_display_name.trim()) {
      newErrors.brand_display_name = "Brand display name is required";
    }

    const websiteError = getUrlValidationError(values.website, "Website");
    if (websiteError) newErrors.website = websiteError;

    const phoneError = getPhoneValidationError(values.contact_number);
    if (phoneError) {
      newErrors.contact_number =
        phoneError === "Phone number is required"
          ? "Contact number is required"
          : phoneError;
    }

    const facebookError = getFacebookUrlValidationError(values.facebook_link);
    if (facebookError) newErrors.facebook_link = facebookError;

    const instagramError = getInstagramUrlValidationError(
      values.instagram_link,
    );
    if (instagramError) newErrors.instagram_link = instagramError;

    return newErrors;
  };

  const handleInputChange = <K extends keyof BrandFormState>(
    field: K,
    value: BrandFormState[K],
  ) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (submitAttempted) {
        setErrors(validateForm(next));
      }
      return next;
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSubmitAttempted(true);
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        brand_display_name: form.brand_display_name.trim(),
        website: form.website.trim(),
        contact_number: form.contact_number.trim(),
        facebook_link: form.facebook_link.trim(),
        instagram_link: form.instagram_link.trim(),
        brand_logo: form.brand_logo,
      };

      let saved: BrandRecord;

      if (pendingCompanyRegistration && !editingBrand) {
        const brandPayload = {
          brand_display_name: form.brand_display_name.trim(),
          website: form.website.trim(),
          contact_number: form.contact_number.trim(),
          facebook_link: form.facebook_link.trim(),
          instagram_link: form.instagram_link.trim(),
        };
        const fd = new FormData();
        fd.append(
          "registration",
          JSON.stringify(pendingCompanyRegistration),
        );
        fd.append("payload", JSON.stringify(brandPayload));
        if (logoFile) fd.append("brand_logo", logoFile);

        const companyLogoDraft = getCompanyLogoDraft();
        if (companyLogoDraft) {
          const companyLogoFile = dataUrlToFile(companyLogoDraft);
          if (companyLogoFile) {
            fd.append("company_logo", companyLogoFile);
          }
        }

        const res = await axiosInstance.post("/onboarding/complete", fd);
        saved = res.data?.data?.brand ?? res.data?.brand;
      } else if (logoFile || editingBrand) {
        const fd = new FormData();
        if (logoFile) fd.append("brand_logo", logoFile);
        fd.append("payload", JSON.stringify(payload));
        if (editingBrand) {
          const res = await axiosInstance.put(`/brands/${editingBrand.id}`, fd);
          saved = res.data?.data ?? res.data;
        } else {
          const res = await axiosInstance.post("/brands", fd);
          saved = res.data?.data ?? res.data;
        }
      } else if (editingBrand) {
        const res = await axiosInstance.put(
          `/brands/${editingBrand.id}`,
          payload,
        );
        saved = res.data?.data ?? res.data;
      } else {
        const res = await axiosInstance.post("/brands", payload);
        saved = res.data?.data ?? res.data;
      }

        toast({
          title: "Saved",
          description: pendingCompanyRegistration
            ? "Setup complete."
            : editingBrand
              ? "Brand updated successfully."
              : "Brand created successfully.",
        });
      setErrors({});
      setSubmitAttempted(false);
      onSaved?.(saved, { isCreate: !editingBrand });
    } catch (error: unknown) {
      console.error("Failed to save brand:", error);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to save brand.";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSave}
      className="space-y-4"
    >
      <div className="space-y-4 py-2">
        <div>
          <Label>Brand Logo</Label>
          <div className="mt-2 flex items-start gap-4">
            <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Brand logo preview"
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
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="brand-name">Brand Display Name *</Label>
          {fieldError("brand_display_name") && (
            <p className="text-sm text-destructive mt-0.5">
              {fieldError("brand_display_name")}
            </p>
          )}
          <Input
            id="brand-name"
            value={form.brand_display_name}
            onChange={(e) =>
              handleInputChange("brand_display_name", e.target.value)
            }
            disabled={saving}
            aria-invalid={!!fieldError("brand_display_name")}
            className={fieldClass("brand_display_name")}
          />
        </div>

        <div>
          <Label htmlFor="brand-website">Website *</Label>
          {fieldError("website") && (
            <p className="text-sm text-destructive mt-0.5">
              {fieldError("website")}
            </p>
          )}
          <Input
            id="brand-website"
            type="text"
            inputMode="url"
            value={form.website}
            onChange={(e) =>
              handleInputChange("website", sanitizeUrlInput(e.target.value))
            }
            placeholder="https://example.com"
            disabled={saving}
            aria-invalid={!!fieldError("website")}
            className={fieldClass("website")}
          />
        </div>

        <div>
          <Label htmlFor="brand-contact">Contact Number *</Label>
          {fieldError("contact_number") && (
            <p className="text-sm text-destructive mt-0.5">
              {fieldError("contact_number")}
            </p>
          )}
          <Input
            id="brand-contact"
            type="tel"
            inputMode="tel"
            value={form.contact_number}
            onChange={(e) =>
              handleInputChange(
                "contact_number",
                sanitizePhoneInput(e.target.value),
              )
            }
            placeholder="+91 (98765) 43210"
            disabled={saving}
            aria-invalid={!!fieldError("contact_number")}
            className={fieldClass("contact_number")}
          />
        </div>

        <div>
          <Label htmlFor="brand-facebook">Facebook Link</Label>
          {fieldError("facebook_link") && (
            <p className="text-sm text-destructive mt-0.5">
              {fieldError("facebook_link")}
            </p>
          )}
          <Input
            id="brand-facebook"
            type="text"
            inputMode="url"
            value={form.facebook_link}
            onChange={(e) =>
              handleInputChange(
                "facebook_link",
                sanitizeUrlInput(e.target.value),
              )
            }
            placeholder="https://facebook.com/..."
            disabled={saving}
            aria-invalid={!!fieldError("facebook_link")}
            className={fieldClass("facebook_link")}
          />
        </div>

        <div>
          <Label htmlFor="brand-instagram">Instagram Link</Label>
          {fieldError("instagram_link") && (
            <p className="text-sm text-destructive mt-0.5">
              {fieldError("instagram_link")}
            </p>
          )}
          <Input
            id="brand-instagram"
            type="text"
            inputMode="url"
            value={form.instagram_link}
            onChange={(e) =>
              handleInputChange(
                "instagram_link",
                sanitizeUrlInput(e.target.value),
              )
            }
            placeholder="https://instagram.com/..."
            disabled={saving}
            aria-invalid={!!fieldError("instagram_link")}
            className={fieldClass("instagram_link")}
          />
        </div>
      </div>

      {!hideFooter && (
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            {cancelLabel}
          </Button>
        )}
        {footerExtra}
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : submitLabel ?? (editingBrand ? "Update Brand" : "Save Brand")}
        </Button>
      </div>
      )}
    </form>
  );
};

export default BrandRegistrationForm;
