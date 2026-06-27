import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FormContext } from "../../contexts/FormContext";
import { EditFormContext } from "./multistepFormEdit/EditFormContext";
import { Check, Clock, Lock, AlertTriangle } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    name: "Project Details",
    description: "Details & inventory type",
  },
  {
    id: 2,
    name: "Address Information",
    description: "Location and address details",
  },
  { id: 3, name: "Media Gallery", description: "Images and videos" },
  { id: 4, name: "Amenities", description: "Features and amenities" },
  {
    id: 5,
    name: "Brochures & Documents",
    description: "Marketing and RERA documents",
  },
  { id: 6, name: "Portal Integrations", description: "Third-party portals" },
];

interface ProjectSidebarProps {
  currentStep: number;
  isEditMode?: boolean;
}

const ProjectSidebar = ({
  currentStep,
  isEditMode = false,
}: ProjectSidebarProps) => {
  const formContext = useContext(FormContext);
  const editFormContext = useContext(EditFormContext);

  // Use appropriate context based on mode
  const lastSavedStep = isEditMode
    ? editFormContext?.lastSavedStep || 6
    : formContext?.lastSavedStep || 0;

  const formData = isEditMode
    ? editFormContext?.formData
    : formContext?.formData;

  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const isStepPending = (stepId: number) => {
    if (!formData) return false;
    // Step 1 is mandatory & validated
    if (stepId === 1) return false;
    
    if (stepId === 2) {
      return !formData.address || !formData.city;
    }
    if (stepId === 3) {
      return (
        (!formData.gallery_images || formData.gallery_images.length === 0) &&
        (!formData.gallery_videos || formData.gallery_videos.length === 0)
      );
    }
    if (stepId === 4) {
      return !formData.amenities || Object.values(formData.amenities).every(v => !v);
    }
    if (stepId === 5) {
      return (
        (!formData.marketing_brochure_urls || formData.marketing_brochure_urls.length === 0) &&
        (!formData.rera_document_urls || formData.rera_document_urls.length === 0)
      );
    }
    if (stepId === 6) {
      return !formData.portal_selection;
    }
    return false;
  };

  const getStepStatus = (stepId: number) => {
    if (stepId === currentStep) {
      return "current";
    }
    if (isEditMode) {
      return isStepPending(stepId) ? "pending" : "completed";
    }
    if (stepId < currentStep || stepId <= lastSavedStep) {
      return isStepPending(stepId) ? "pending" : "completed";
    }
    return "locked";
  };

  const getStepIcon = (stepId: number) => {
    const status = getStepStatus(stepId);

    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-white" />;
      case "pending":
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case "current":
        return <Clock className="w-4 h-4 text-white" />;
      case "locked":
        return <Lock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const canNavigateToStep = (stepId: number) => {
    if (isEditMode) {
      return true; // In edit mode, all steps are navigable
    }
    return stepId <= Math.max(currentStep, lastSavedStep + 1);
  };

  const getStepPath = (stepId: number) => {
    const basePath = isEditMode
      ? `/projects/edit/${projectId}`
      : "/projects/create";
    return `${basePath}/step${stepId}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Progress</h3>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Edit project details in any step"
            : "Complete each step to create your project"}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="border-t pt-3 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {Math.max(currentStep - 1, lastSavedStep)}/{steps.length}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                (Math.max(currentStep - 1, lastSavedStep) / steps.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const isClickable = canNavigateToStep(step.id);

          // In create mode, show current, completed, or pending steps
          if (!isEditMode && status !== "completed" && status !== "current" && status !== "pending") {
            return null;
          }

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex items-start p-3 rounded-lg border transition-all duration-200",
                status === "current" && "border-primary bg-primary/5 shadow-sm",
                status === "completed" && "border-green-200 bg-green-50/50 dark:bg-green-950/10",
                status === "pending" && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10",
                status === "locked" && "border-border bg-muted/50",
                isClickable && "cursor-pointer hover:shadow-md",
                !isClickable && "cursor-not-allowed"
              )}
              onClick={() => isClickable && navigate(getStepPath(step.id))}
            >
              {/* Step number/icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 relative z-10 text-white font-semibold",
                  status === "completed" && "bg-green-600",
                  status === "pending" && "bg-amber-500",
                  status === "current" && "bg-gray-900 dark:bg-slate-800",
                  status === "locked" &&
                    "bg-muted border-2 border-border text-muted-foreground"
                )}
              >
                <span className="text-xs font-medium">{step.id}</span>
              </div>
              {/* Step content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    status === "current" && "text-primary",
                    status === "completed" && "text-green-700 dark:text-green-500",
                    status === "pending" && "text-amber-700 dark:text-amber-500",
                    status === "locked" && "text-muted-foreground"
                  )}
                >
                  {step.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                {/* Status indicator */}
                <div className="flex items-center mt-2">
                  {status === "completed" && (
                    <span className="text-xs text-green-600 dark:text-green-500 font-medium">
                      ✓ Completed
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                  {status === "current" && (
                    <span className="text-xs text-primary font-medium">
                      In Progress
                    </span>
                  )}
                  {status === "locked" && (
                    <span className="text-xs text-muted-foreground">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectSidebar;
