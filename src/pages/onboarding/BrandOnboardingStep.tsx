import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandRegistrationForm, {
  type BrandRecord,
} from "@/components/settings/BrandRegistrationForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import {
  clearCompanyDraft,
  clearCompanyLogoDraft,
  getCompanyDraft,
} from "@/utils/onboardingDraft";
import { fetchOnboardingStatus } from "@/utils/onboarding";

const BRAND_FORM_ID = "onboarding-brand-form";

const BrandOnboardingStep = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { refreshBrands } = useBrand();
  const companyId = user?.company_id ?? "";
  const companyDraft = getCompanyDraft();
  const useDraftFlow = !companyId && !!companyDraft;
  const canAccessStep =
    Boolean(companyId) || Boolean(companyDraft);

  useEffect(() => {
    if (!canAccessStep) {
      navigate("/onboarding/step1", { replace: true });
    }
  }, [canAccessStep, navigate]);

  const handleSaved = async (brand: BrandRecord) => {
    if (useDraftFlow) {
      clearCompanyDraft();
      clearCompanyLogoDraft();
    }

    if (user) {
      setUser({
        ...user,
        company_id: brand.company_id,
        brand_id: brand.id,
      });
    }

    await refreshBrands();
    await fetchOnboardingStatus();
    navigate("/dashboard", { replace: true });
  };

  if (!canAccessStep) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          Step 2 of 2
        </p>
        <h2 className="text-xl font-semibold">Brand Setup</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Add your first brand.{" "}
          {useDraftFlow
            ? "Company details from the previous step are saved when you submit this form."
            : "Link a brand to your company profile."}
        </p>
      </div>

      <div className="px-6 py-6">
        <BrandRegistrationForm
          formId={BRAND_FORM_ID}
          hideFooter
          companyId={companyId || "pending"}
          pendingCompanyRegistration={useDraftFlow ? companyDraft : null}
          showCancel={false}
          onSaved={handleSaved}
        />
      </div>

      <div className="shrink-0 border-t bg-slate-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="sm:min-w-[140px]"
          onClick={() => navigate("/onboarding/step1")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Step
        </Button>
        <Button
          type="submit"
          form={BRAND_FORM_ID}
          className="sm:min-w-[160px]"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
};

export default BrandOnboardingStep;
