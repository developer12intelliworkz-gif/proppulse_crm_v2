import { useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Home, ChevronRight, CheckCircle2 } from "lucide-react";
import { FormProvider } from "../../contexts/FormContext";
import ProjectSidebar from "./ProjectSidebar";
import Step1Form from "./multistepForm/Step1Form";
import Step2Form from "./multistepForm/Step2Form";
import Step3Form from "./multistepForm/Step3Form";
import Step4Form from "./multistepForm/Step4Form";
import Step5Form from "./multistepForm/Step5Form";
import Step6Form from "./multistepForm/Step6Form";

const CreateProject = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentStep = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "step1":
        return 1;
      case "step2":
        return 2;
      case "step3":
        return 3;
      case "step4":
        return 4;
      case "step5":
        return 5;
      case "step6":
        return 6;
      default:
        return 1;
    }
  };

  const currentStep = getCurrentStep();

  const handleCancel = () => {
    navigate("/projects");
  };

  const stepNames = [
    "Project Details",
    "Address Information",
    "Media Gallery",
    "Amenities",
    "Brochures & Documents",
    "Portal Integrations",
  ];

  return (
    <FormProvider>
      <div className="h-full flex flex-col bg-background">
        {/* Fixed Header */}
        <div className="bg-card border-b shadow-sm flex-shrink-0">
          <div className="px-6 py-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <Link
                to="/dashboard"
                className="flex items-center hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link
                to="/projects"
                className="hover:text-primary transition-colors"
              >
                Projects
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">
                Create Project
              </span>
            </nav>

            {/* Header Content */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Create New Project
                </h1>
                <p className="text-muted-foreground mt-1">
                  Step {currentStep} of 6: {stepNames[currentStep - 1]}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="w-4 h-4" />
                  {/* Dashboard */}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 min-h-0">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1 border-r bg-card">
            <div className="h-full overflow-y-auto">
              <ProjectSidebar currentStep={currentStep} isEditMode={false} />
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3 bg-background">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <Routes>
                  <Route path="/" element={<Navigate to="step1" replace />} />
                  <Route path="step1" element={<Step1Form />} />
                  <Route path="step2" element={<Step2Form />} />
                  <Route path="step3" element={<Step3Form />} />
                  <Route path="step4" element={<Step4Form />} />
                  <Route path="step5" element={<Step5Form />} />
                  <Route path="step6" element={<Step6Form />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default CreateProject;
