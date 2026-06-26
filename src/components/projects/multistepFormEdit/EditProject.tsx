import { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  Routes,
  Route,
} from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { EditFormProvider, useEditForm } from "./EditFormContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import ProjectSidebar from "../ProjectSidebar";
import EditStep1Form from "./EditStep1Form";
import EditStep2Form from "./EditStep2Form";
import EditStep3Form from "./EditStep3Form";
import EditStep4Form from "./EditStep4Form";
import EditStep5Form from "./EditStep5Form";
import EditStep6Form from "./EditStep6Form";

const EditProjectContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { updateFormData, setLastSavedStep, setProjectId, fetchInitialData } =
    useEditForm();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const getCurrentStep = () => {
    const path = location.pathname;
    const stepMatch = path.match(/step(\d+)/);
    return stepMatch ? parseInt(stepMatch[1]) : 1;
  };

  useEffect(() => {
    if (!projectId) {
      // toast({
        // title: "Error",
        // description: "No project ID provided",
        // variant: "destructive",
      // });
      navigate("/projects");
      setLoading(false);
      return;
    }

    setProjectId(projectId);
    fetchInitialData(projectId)
      .then(() => {
        setLoading(false);
        // toast({
          // title: "Success",
          // description: "Project data loaded successfully",
        // });
      })
      .catch((error) => {
        console.error("Error fetching project:", error.message);
        // toast({
          // title: "Error",
          // description: error.message || "Failed to fetch project data",
          // variant: "destructive",
        // });
        navigate("/projects");
        setLoading(false);
      });
  }, [projectId]);

  const handleCancel = () => {
    navigate("/projects");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="bg-card border-b shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Edit Project
              </h1>
              <p className="text-sm text-muted-foreground">
                Modify your project details in multiple steps
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" /> 
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 pb-3">
        {/* Progress Sidebar */}
        <div className="lg:col-span-1 border-r border-b bg-card">
          <div className="h-full overflow-y-auto">
            <ProjectSidebar currentStep={getCurrentStep()} isEditMode={true} />
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              <Routes>
                <Route path="step1" element={<EditStep1Form />} />
                <Route path="step2" element={<EditStep2Form />} />
                <Route path="step3" element={<EditStep3Form />} />
                <Route path="step4" element={<EditStep4Form />} />
                <Route path="step5" element={<EditStep5Form />} />
                <Route path="step6" element={<EditStep6Form />} />
                <Route path="*" element={<EditStep1Form />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProject = () => {
  return (
    <EditFormProvider>
      <EditProjectContent />
    </EditFormProvider>
  );
};

export default EditProject;
