import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import CompanyRegistrationTab from "./CompanyRegistrationTab";
import { useAuth } from "@/contexts/AuthContext";
import { resolveCompanyId } from "@/utils/tenant";

const CompanyDetails = ({
  companyId: companyIdProp,
}: {
  companyId?: string;
}) => {
  const { user } = useAuth();
  const companyId = companyIdProp ?? resolveCompanyId(user);
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      <div className="shrink-0 border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground sm:text-xl">
              Company Details
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Registration, branding, and compliance
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <CompanyRegistrationTab companyId={companyId} />
      </div>
    </div>
  );
};

export default CompanyDetails;
