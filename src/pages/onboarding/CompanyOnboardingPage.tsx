import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import CompanyRegistrationTab from "@/components/settings/CompanyRegistrationTab";

const CompanyOnboardingPage = () => {
  return (
    <OnboardingLayout step="company" wide>
      <CompanyRegistrationTab mode="onboarding" />
    </OnboardingLayout>
  );
};

export default CompanyOnboardingPage;
