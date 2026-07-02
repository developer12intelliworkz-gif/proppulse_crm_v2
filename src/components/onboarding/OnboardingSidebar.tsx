import { useNavigate } from "react-router-dom";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPendingCompanyDraft } from "@/utils/onboardingDraft";

const steps = [
  {
    id: 1,
    name: "Company Registration",
    description: "Legal entity & office details",
    path: "/onboarding/step1",
  },
  {
    id: 2,
    name: "Brand Setup",
    description: "Create your first brand",
    path: "/onboarding/step2",
  },
];

interface OnboardingSidebarProps {
  currentStep: number;
}

const OnboardingSidebar = ({ currentStep }: OnboardingSidebarProps) => {
  const navigate = useNavigate();
  const draftReady = hasPendingCompanyDraft();

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep || (stepId === 1 && currentStep > 1)) {
      return "completed";
    }
    if (stepId === currentStep) return "current";
    if (stepId === 2 && draftReady) return "available";
    return "upcoming";
  };

  const canNavigate = (stepId: number) => {
    if (stepId === 1) return true;
    if (stepId === 2) return draftReady || currentStep >= 2;
    return false;
  };

  return (
    <div className="h-full border-r bg-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Setup progress
      </h3>
      <ol className="space-y-3">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const clickable = canNavigate(step.id);

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && navigate(step.path)}
                className={cn(
                  "w-full text-left rounded-lg border p-4 transition-colors",
                  status === "current" && "border-primary bg-primary/5",
                  status === "completed" && "border-green-200 bg-green-50/50",
                  status === "available" &&
                    "border-muted hover:bg-muted/50 cursor-pointer",
                  status === "upcoming" && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      status === "completed" && "bg-green-600",
                      status === "current" && "bg-primary",
                      (status === "available" || status === "upcoming") &&
                        "bg-muted",
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Clock
                        className={cn(
                          "h-4 w-4",
                          status === "current"
                            ? "text-white"
                            : "text-muted-foreground",
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Step {step.id}: {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default OnboardingSidebar;
