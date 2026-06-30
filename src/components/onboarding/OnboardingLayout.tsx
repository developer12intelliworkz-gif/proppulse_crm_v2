import { ReactNode } from "react";
import OnboardingHeader from "./OnboardingHeader";

const OnboardingLayout = ({
  children,
  step,
  wide = false,
}: {
  children: ReactNode;
  step?: "company" | "brand";
  wide?: boolean;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col">
    <OnboardingHeader step={step} />
    <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
      <div
        className={`w-full mx-auto flex flex-col min-h-0 ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  </div>
);

export default OnboardingLayout;
