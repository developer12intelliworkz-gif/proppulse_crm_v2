import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const CustomFields = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/settings");
  };
  return (
    <div className="bg-card border-b shadow-sm flex-shrink-0">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Custom Fields
            </h1>
            <p className="text-sm text-muted-foreground">
              Define and manage custom fields for your projects and tasks
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFields;
