import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import BrandRegistrationForm, {
  type BrandRecord,
} from "@/components/settings/BrandRegistrationForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import {
  clearCompanyDraft,
  getCompanyDraft,
} from "@/utils/onboardingDraft";

const BrandOnboardingPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { refreshBrands } = useBrand();
  const companyId = user?.company_id ?? "";
  const companyDraft = getCompanyDraft();
  const useDraftFlow = !companyId && !!companyDraft;

  useEffect(() => {
    if (!companyId && !companyDraft) {
      navigate("/onboarding/company", { replace: true });
    }
  }, [companyId, companyDraft, navigate]);

  const handleSaved = async (brand: BrandRecord) => {
    if (useDraftFlow) {
      clearCompanyDraft();
    }

    if (user) {
      setUser({
        ...user,
        company_id: brand.company_id,
        brand_id: brand.id,
      });
    }

    await refreshBrands();
    navigate("/dashboard", { replace: true });
  };

  if (!companyId && !companyDraft) {
    return null;
  }

  return (
    <OnboardingLayout step="brand">
      <div className="flex flex-col max-h-[calc(100vh-5.5rem)] bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Brand</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 2 of 2 — Register a brand linked to your company profile.
            {useDraftFlow
              ? " Company details are saved when you submit this form."
              : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          <BrandRegistrationForm
            companyId={companyId || "pending"}
            pendingCompanyRegistration={
              useDraftFlow ? companyDraft : null
            }
            showCancel={false}
            submitLabel="Save Brand & Finish"
            onSaved={handleSaved}
          />
        </div>

        {useDraftFlow && (
          <div className="shrink-0 border-t bg-muted/30 px-5 sm:px-6 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/onboarding/company")}
            >
              Back to company details
            </Button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};

export default BrandOnboardingPage;
