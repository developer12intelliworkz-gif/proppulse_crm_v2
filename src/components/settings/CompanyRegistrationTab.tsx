import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  Share2,
  Mail,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "@/utils/onboardingDraft";
import { buildCompanyLogoUrl } from "@/utils/companyLogoUrl";
import {
  getEmailValidationError,
  getGstValidationError,
  getPanValidationError,
  getUrlValidationError,
} from "@/utils/companyValidation";
import GoogleMapLocationPicker from "./GoogleMapLocationPicker";
import ContactManager from "./ContactManager";
import {
  type AddressFields,
  type CompanyRegistrationData,
  buildDefaultEmailFooter,
  emptyRegistration,
  mapApiToRegistration,
} from "./companyRegistrationTypes";

export type { CompanyRegistrationData } from "./companyRegistrationTypes";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const DESCRIPTION_MAX = 500;
const PAGE_MAX_WIDTH = "max-w-[1200px]";
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const ALLOWED_LOGO_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.svg";

const SOCIAL_FIELDS = [
  { key: "facebook" as const, label: "Facebook" },
  { key: "twitter" as const, label: "Twitter / X" },
  { key: "linkedIn" as const, label: "LinkedIn" },
  { key: "instagram" as const, label: "Instagram" },
  { key: "youtube" as const, label: "YouTube" },
  { key: "googleBusiness" as const, label: "Google Business" },
];

interface CompanyRegistrationTabProps {
  companyId?: string;
  mode?: "settings" | "onboarding";
}

const SectionCard = ({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  className?: string;
  children: ReactNode;
}) => (
  <Card className={cn("shadow-sm", className)}>
    <CardHeader className="px-4 py-3 pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
  </Card>
);

const Field = ({
  id,
  label,
  helper,
  required,
  error,
  className,
  children,
}: {
  id?: string;
  label: string;
  helper?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div id={id} className={cn("space-y-1", className)}>
    <Label className="text-sm font-medium">
      {label}
      {required && <span className="text-destructive"> *</span>}
    </Label>
    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    {error && <p className="text-sm text-destructive">{error}</p>}
    {children}
  </div>
);

const AddressFieldsBlock = ({
  prefix,
  address,
  onChange,
  errors,
  disabled = false,
  requiredFields = false,
}: {
  prefix: string;
  address: AddressFields;
  onChange: (field: keyof AddressFields, value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  requiredFields?: boolean;
}) => {
  const fields: { key: keyof AddressFields; label: string; required?: boolean }[] = [
    { key: "address1", label: "Address Line 1", required: requiredFields },
    { key: "address2", label: "Address Line 2" },
    { key: "city", label: "City", required: requiredFields },
    { key: "state", label: "State", required: requiredFields },
    { key: "country", label: "Country", required: requiredFields },
    { key: "zip", label: "ZIP / Pincode", required: requiredFields },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
      {fields.map(({ key, label, required }) => (
        <Field
          key={key}
          id={`field-${prefix}.${key}`}
          label={label}
          required={required}
          error={errors[`${prefix}.${key}`]}
          className={key === "address1" || key === "address2" ? "sm:col-span-2" : undefined}
        >
          <Input
            value={address[key]}
            onChange={(e) => onChange(key, e.target.value)}
            disabled={disabled}
            className={errors[`${prefix}.${key}`] ? "border-destructive" : ""}
          />
        </Field>
      ))}
    </div>
  );
};

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
  const formRef = useRef<HTMLFormElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoBlobUrlRef = useRef<string | null>(null);

  const [data, setData] = useState<CompanyRegistrationData>(emptyRegistration());
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [footerTouched, setFooterTouched] = useState(false);

  const fieldError = (key: string) =>
    submitAttempted && errors[key] ? errors[key] : undefined;

  const revokeLogoBlobUrl = () => {
    if (logoBlobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(logoBlobUrlRef.current);
    }
    logoBlobUrlRef.current = null;
  };

  const resolveSavedLogoPreview = (logoUrl: string) =>
    buildCompanyLogoUrl(logoUrl) || "";

  const setPreviewFromSavedLogo = (logoUrl: string) => {
    revokeLogoBlobUrl();
    setSavedLogoUrl(logoUrl);
    setLogoPreview(resolveSavedLogoPreview(logoUrl));
    setLogoFile(null);
    setLogoRemoved(false);
    setLogoError("");
  };

  const buildRegistrationPayload = () => {
    const { logoUrl: _logoUrl, ...rest } = data;
    return {
      ...rest,
      clearLogo: logoRemoved && !logoFile,
    };
  };

  useEffect(() => () => revokeLogoBlobUrl(), []);

  const collectFormErrors = (values: CompanyRegistrationData): Record<string, string> => {
    const next: Record<string, string> = {};

    if (!values.companyName.trim()) {
      next.companyName = "Company name is required";
    }

    const panErr = getPanValidationError(values.panCard);
    if (panErr) next.panCard = panErr;

    const gstErr = getGstValidationError(values.gstNo);
    if (gstErr) next.gstNo = gstErr;

    const websiteErr = getUrlValidationError(values.website);
    if (websiteErr) next.website = websiteErr;

    const emailErr = getEmailValidationError(values.customReportingEmail);
    if (emailErr) next.customReportingEmail = emailErr;

    const reg = values.registeredOffice;
    if (!reg.address1.trim()) next["registeredOffice.address1"] = "Required";
    if (!reg.city.trim()) next["registeredOffice.city"] = "Required";
    if (!reg.state.trim()) next["registeredOffice.state"] = "Required";
    if (!reg.country.trim()) next["registeredOffice.country"] = "Required";
    if (!reg.zip.trim()) next["registeredOffice.zip"] = "Required";

    for (const [key, url] of Object.entries(values.socialUrls)) {
      const err = getUrlValidationError(url);
      if (err) next[`socialUrls.${key}`] = err;
    }

    values.contacts.forEach((contact, index) => {
      if (!contact.firstName.trim()) {
        next[`contacts.${index}.firstName`] = "First name is required";
      }
      if (!contact.phone.trim()) {
        next[`contacts.${index}.phone`] = "Phone is required";
      }
      if (!contact.email.trim()) {
        next[`contacts.${index}.email`] = "Email is required";
      }
    });

    const primaryCount = values.contacts.filter((c) => c.isPrimary).length;
    if (values.contacts.length > 0 && primaryCount !== 1) {
      next.contacts = "Exactly one contact must be marked as primary";
    }

    return next;
  };

  const scrollToFirstError = (formErrors: Record<string, string>) => {
    const firstKey = Object.keys(formErrors)[0];
    if (!firstKey) return;
    const el =
      document.getElementById(`field-${firstKey}`) ||
      document.getElementById(firstKey);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const loadRegistration = async (targetCompanyId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/companies/${targetCompanyId}`);
      const mapped = mapApiToRegistration(response.data || {});
      mapped.approvals = mapped.approvals.filter((a) =>
        COMPANY_APPROVAL_OPTIONS.includes(a as CompanyApproval),
      );
      setData(mapped);
      setFooterTouched(Boolean(mapped.emailFooter.trim()));
      setPreviewFromSavedLogo(mapped.logoUrl);
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
      const initial = draft ?? emptyRegistration();
      setData(initial);
      const logoDraft = getCompanyLogoDraft();
      if (logoDraft) {
        revokeLogoBlobUrl();
        setLogoPreview(logoDraft);
        setSavedLogoUrl(initial.logoUrl);
      } else {
        setPreviewFromSavedLogo(initial.logoUrl);
      }
      setLoading(false);
      return;
    }
    if (effectiveCompanyId) {
      void loadRegistration(effectiveCompanyId);
    } else {
      setLoading(false);
    }
  }, [effectiveCompanyId, isOnboarding, user?.company_id]);

  useEffect(() => {
    if (footerTouched || isOnboarding) return;
    const suggested = buildDefaultEmailFooter(
      data.companyName || data.displayName,
      data.registeredOffice,
    );
    if (suggested.trim() && !data.emailFooter.trim()) {
      setData((prev) => ({ ...prev, emailFooter: suggested }));
    }
  }, [
    data.companyName,
    data.displayName,
    data.registeredOffice,
    footerTouched,
    isOnboarding,
  ]);

  const updateField = <K extends keyof CompanyRegistrationData>(
    field: K,
    value: CompanyRegistrationData[K],
  ) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (submitAttempted) setErrors(collectFormErrors(next));
      return next;
    });
  };

  const updateRegisteredOffice = (field: keyof AddressFields, value: string) => {
    setData((prev) => {
      const registeredOffice = { ...prev.registeredOffice, [field]: value };
      const next = {
        ...prev,
        registeredOffice,
        headOffice: prev.headOfficeSameAsRegistered
          ? { ...registeredOffice }
          : prev.headOffice,
      };
      if (submitAttempted) setErrors(collectFormErrors(next));
      return next;
    });
  };

  const updateHeadOffice = (field: keyof AddressFields, value: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        headOffice: { ...prev.headOffice, [field]: value },
        headOfficeSameAsRegistered: false,
      };
      if (submitAttempted) setErrors(collectFormErrors(next));
      return next;
    });
  };

  const setSameAsRegistered = (checked: boolean) => {
    setData((prev) => {
      const next = {
        ...prev,
        headOfficeSameAsRegistered: checked,
        headOffice: checked ? { ...prev.registeredOffice } : prev.headOffice,
      };
      if (submitAttempted) setErrors(collectFormErrors(next));
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

  const validateLogoFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
    if (!ALLOWED_LOGO_TYPES.has(file.type) && (!ext || !allowedExt.has(ext))) {
      return "Only PNG, JPG, WebP, or SVG files are allowed.";
    }
    if (file.size > MAX_LOGO_BYTES) {
      return "Logo must be 2 MB or smaller.";
    }
    return null;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateLogoFile(file);
    if (validationError) {
      setLogoError(validationError);
      e.target.value = "";
      return;
    }

    setLogoError("");
    setLogoRemoved(false);
    revokeLogoBlobUrl();
    const objectUrl = URL.createObjectURL(file);
    logoBlobUrlRef.current = objectUrl;
    setLogoFile(file);
    setLogoPreview(objectUrl);

    if (isOnboarding && !user?.company_id) {
      await saveCompanyLogoDraft(file);
    }
  };

  const handleRemoveLogo = () => {
    const hadPendingFile = Boolean(logoFile);
    revokeLogoBlobUrl();
    setLogoFile(null);
    setLogoError("");
    if (logoInputRef.current) logoInputRef.current.value = "";

    if (hadPendingFile) {
      setLogoPreview(resolveSavedLogoPreview(savedLogoUrl));
      setLogoRemoved(false);
      return;
    }

    setLogoRemoved(true);
    setLogoPreview("");
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = collectFormErrors(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return;
    }

    setSaving(true);
    try {
      if (isOnboarding && !user?.company_id) {
        saveCompanyDraft(data);
        if (logoFile) await saveCompanyLogoDraft(logoFile);
        toast({
          title: "Step 1 complete",
          description: "Continue to brand setup on the next step.",
        });
        navigate("/onboarding/step2", { replace: true });
      } else if (effectiveCompanyId) {
        const registrationPayload = buildRegistrationPayload();

        if (logoFile) {
          const fd = new FormData();
          fd.append("registration", JSON.stringify(registrationPayload));
          fd.append("logo", logoFile);
          await axiosInstance.put(`/companies/${effectiveCompanyId}`, fd);
        } else {
          await axiosInstance.put(`/companies/${effectiveCompanyId}`, {
            registration: registrationPayload,
          });
        }
        toast({
          title: "Saved",
          description: "Company registration updated successfully.",
        });
        if (isOnboarding) {
          navigate("/onboarding/step2", { replace: true });
        } else {
          await loadRegistration(effectiveCompanyId);
        }
        setLogoFile(null);
        setLogoRemoved(false);
        setLogoError("");
        setSubmitAttempted(false);
        setErrors({});
      }
    } catch (error: unknown) {
      console.error("Failed to save company registration:", error);
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String((error.response.data as { error: unknown }).error)
          : "Failed to save company registration details.";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSaveButton = (className?: string) => (
    <Button
      type="submit"
      form="company-registration-form"
      disabled={saving}
      className={className ?? "min-w-[160px]"}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Saving…
        </>
      ) : isOnboarding ? (
        "Next Step"
      ) : (
        "Save Registration"
      )}
    </Button>
  );

  const formSections = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:[grid-template-columns:1fr_1fr]">
      <SectionCard
        icon={Building2}
        title="Brand & Identity"
        className="lg:col-span-2"
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          <Field
            id="field-logo"
            label="Company Logo"
            helper="PNG, JPG, WebP, or SVG. Max 2 MB."
            error={logoError}
            className="md:col-span-2"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative h-24 w-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Company logo preview"
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                      aria-label="Remove logo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground px-2 text-center">
                    No logo
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  ref={logoInputRef}
                  type="file"
                  accept={`image/png,image/jpeg,image/webp,image/svg+xml,${ALLOWED_LOGO_EXTENSIONS}`}
                  onChange={handleLogoChange}
                  disabled={saving}
                />
              </div>
            </div>
          </Field>

          <Field
            id="field-companyName"
            label="Company Name"
            helper="Legal entity name"
            required
            error={fieldError("companyName")}
          >
            <Input
              value={data.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className={fieldError("companyName") ? "border-destructive" : ""}
            />
          </Field>

          <Field
            id="field-displayName"
            label="Business / Display Name"
            helper="Trade name or short name used in UI and documents"
          >
            <Input
              value={data.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
            />
          </Field>

          <Field
            id="field-description"
            label="Description"
            helper={`Max ${DESCRIPTION_MAX} characters`}
            className="md:col-span-2"
          >
            <Textarea
              value={data.description}
              onChange={(e) =>
                updateField("description", e.target.value.slice(0, DESCRIPTION_MAX))
              }
              className="min-h-[64px]"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {data.description.length}/{DESCRIPTION_MAX}
            </p>
          </Field>

          <Field
            id="field-panCard"
            label="PAN Card"
            helper="Alphanumeric PAN format"
            error={fieldError("panCard")}
          >
            <Input
              value={data.panCard}
              onChange={(e) =>
                updateField("panCard", e.target.value.toUpperCase())
              }
              placeholder="ABCDE1234F"
              className={fieldError("panCard") ? "border-destructive" : ""}
            />
          </Field>

          <Field
            id="field-gstNo"
            label="GST No"
            helper="Optional"
            error={fieldError("gstNo")}
          >
            <Input
              value={data.gstNo}
              onChange={(e) => updateField("gstNo", e.target.value.toUpperCase())}
              className={fieldError("gstNo") ? "border-destructive" : ""}
            />
          </Field>

          <Field
            id="field-website"
            label="Website"
            error={fieldError("website")}
          >
            <Input
              value={data.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://example.com"
              className={fieldError("website") ? "border-destructive" : ""}
            />
          </Field>

          <Field id="field-timeZone" label="Time Zone">
            <Select
              value={data.timeZone}
              onValueChange={(v) => updateField("timeZone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field id="field-currency" label="Currency">
            <Select
              value={data.currency}
              onValueChange={(v) => updateField("currency", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">₹ INR</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field
            id="field-customReportingEmail"
            label="Custom Reporting Email"
            helper="Email used for system-generated reports"
            error={fieldError("customReportingEmail")}
          >
            <Input
              type="email"
              value={data.customReportingEmail}
              onChange={(e) => updateField("customReportingEmail", e.target.value)}
              className={
                fieldError("customReportingEmail") ? "border-destructive" : ""
              }
            />
          </Field>

          <Field
            id="field-disclaimer"
            label="Disclaimer"
            helper="Legal disclaimer shown in reports and documents"
            className="md:col-span-2"
          >
            <Textarea
              value={data.disclaimer}
              onChange={(e) => updateField("disclaimer", e.target.value)}
              className="min-h-[64px]"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        icon={MapPin}
        title="Office Addresses"
        className="lg:col-span-2"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold mb-2 px-1">
              Registered Office Address
            </h4>
            <AddressFieldsBlock
              prefix="registeredOffice"
              address={data.registeredOffice}
              onChange={updateRegisteredOffice}
              errors={errors}
              requiredFields
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-sm font-semibold">Head / Corporate Office</h4>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={data.headOfficeSameAsRegistered}
                  onCheckedChange={(c) => setSameAsRegistered(c === true)}
                />
                Same as Registered Office
              </label>
            </div>
            <AddressFieldsBlock
              prefix="headOffice"
              address={data.headOffice}
              onChange={updateHeadOffice}
              errors={errors}
              disabled={data.headOfficeSameAsRegistered}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={MapPin} title="Location Pin" className="lg:col-span-2">
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
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field id="field-latitude" label="Latitude">
            <Input
              type="number"
              step="any"
              value={data.latitude}
              onChange={(e) => updateField("latitude", e.target.value)}
            />
          </Field>
          <Field id="field-longitude" label="Longitude">
            <Input
              type="number"
              step="any"
              value={data.longitude}
              onChange={(e) => updateField("longitude", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Users} title="Contact Person(s)">
        {fieldError("contacts") && (
          <p className="text-sm text-destructive mb-3">{fieldError("contacts")}</p>
        )}
        <ContactManager
          contacts={data.contacts}
          onChange={(contacts) => updateField("contacts", contacts)}
          errors={errors}
        />
      </SectionCard>

      <SectionCard icon={Share2} title="Social Media URLs">
        <div className="grid grid-cols-1 gap-3">
          {SOCIAL_FIELDS.map(({ key, label }) => (
            <Field
              key={key}
              id={`field-socialUrls.${key}`}
              label={label}
              error={fieldError(`socialUrls.${key}`)}
            >
              <Input
                value={data.socialUrls[key]}
                onChange={(e) =>
                  updateField("socialUrls", {
                    ...data.socialUrls,
                    [key]: e.target.value,
                  })
                }
                placeholder="https://"
                className={
                  fieldError(`socialUrls.${key}`) ? "border-destructive" : ""
                }
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Mail} title="Communication & Compliance">
        <div className="grid grid-cols-1 gap-3">
          <Field
            id="field-marketingDomains"
            label="Marketing Domain"
            helper="Domain(s) for promotional email sending (comma-separated)"
          >
            <Input
              value={data.marketingDomains}
              onChange={(e) => updateField("marketingDomains", e.target.value)}
              placeholder="example.com, mail.example.com"
            />
          </Field>

          <Field
            id="field-emailFooter"
            label="Email Footer"
            helper="Auto-suggested from company name and address; editable"
          >
            <Textarea
              value={data.emailFooter}
              onChange={(e) => {
                setFooterTouched(true);
                updateField("emailFooter", e.target.value);
              }}
              className="min-h-[80px]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="field-dltEntityId" label="DLT Entity ID">
              <Input
                value={data.dltEntityId}
                onChange={(e) => updateField("dltEntityId", e.target.value)}
              />
            </Field>

            <Field id="field-telemarketerId" label="Telemarketer ID">
              <Input
                value={data.telemarketerId}
                onChange={(e) => updateField("telemarketerId", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={ShieldCheck} title="Regulatory Approvals">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {COMPANY_APPROVAL_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <Switch
                  checked={data.approvals.includes(option)}
                  onCheckedChange={() => toggleApproval(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <Separator />
          <Field
            id="field-approvalNotes"
            label="Approval Notes"
            helper="Optional remarks about regulatory approvals"
          >
            <Textarea
              value={data.approvalNotes}
              onChange={(e) => updateField("approvalNotes", e.target.value)}
              className="min-h-[56px]"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
            Enter your legal entity details. These are saved when you complete
            brand setup in the next step.
          </p>
        </div>

        <form
          ref={formRef}
          id="company-registration-form"
          noValidate
          onSubmit={handleSave}
          className="flex flex-col"
        >
          <div className={cn("mx-auto w-full px-6 py-6", PAGE_MAX_WIDTH)}>
            {formSections}
          </div>
          <div className="shrink-0 border-t bg-slate-50/80 px-6 py-4 flex justify-end">
            {renderSaveButton()}
          </div>
        </form>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      id="company-registration-form"
      noValidate
      onSubmit={handleSave}
    >
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6",
            PAGE_MAX_WIDTH,
          )}
        >
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Company Registration
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Legal entity details, branding, and regulatory information
            </p>
          </div>
          <div className="shrink-0">{renderSaveButton()}</div>
        </div>
      </div>

      <div className={cn("mx-auto w-full px-4 py-4 sm:px-6", PAGE_MAX_WIDTH)}>
        {formSections}
        <div className="mt-4 flex justify-end border-t pt-3">
          {renderSaveButton()}
        </div>
      </div>
    </form>
  );
};

export default CompanyRegistrationTab;
