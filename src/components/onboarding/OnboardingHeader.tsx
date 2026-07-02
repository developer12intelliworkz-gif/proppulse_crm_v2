import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { clearCompanyDraft } from "@/utils/onboardingDraft";

interface OnboardingHeaderProps {
  step?: "company" | "brand";
}

const OnboardingHeader = ({ step }: OnboardingHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearCompanyDraft();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            CRM Setup
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {step === "brand" ? "Step 2 of 2 — Brand" : "Step 1 of 2 — Company"}
            {user?.name ? ` · ${user.name}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="shrink-0"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
};

export default OnboardingHeader;
