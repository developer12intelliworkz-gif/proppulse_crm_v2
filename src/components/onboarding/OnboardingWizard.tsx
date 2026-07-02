import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingSidebar from "./OnboardingSidebar";
import CompanyRegistrationTab from "@/components/settings/CompanyRegistrationTab";
import BrandOnboardingStep from "@/pages/onboarding/BrandOnboardingStep";
import { cn } from "@/lib/utils";

const OnboardingWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentStep = location.pathname.includes("/step2") ? 2 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex flex-col">
      <OnboardingHeader step={currentStep === 2 ? "brand" : "company"} />

      {/* Mobile step indicator */}
      <div className="lg:hidden border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {[1, 2].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() =>
                step === 1
                  ? navigate("/onboarding/step1")
                  : navigate("/onboarding/step2")
              }
              className={cn(
                "flex-1 rounded-full py-2 text-xs font-medium transition-colors",
                currentStep === step
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step === 1 ? "Company" : "Brand"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-0">
        <div className="hidden lg:block min-h-0 border-r bg-card">
          <OnboardingSidebar currentStep={currentStep} />
        </div>

        <div className="min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Navigate to="step1" replace />} />
                <Route
                  path="step1"
                  element={<CompanyRegistrationTab mode="onboarding" />}
                />
                <Route path="step2" element={<BrandOnboardingStep />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
