import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectSetupRoute, ProjectSetupView } from "./projectSetupHelpers";

interface ProjectSetupStepperProps {
  route: ProjectSetupRoute;
  currentView: ProjectSetupView;
}

const ProjectSetupStepper = ({ route, currentView }: ProjectSetupStepperProps) => {
  const steps = [
    {
      key: "initial_setup",
      label: "Type & Structure",
      done: route.stepsCompleted.initialSetup,
      active: currentView === "initial_setup",
    },
    {
      key: "level3_hierarchy",
      label: route.level3Label
        ? `${route.level3Label} Setup`
        : "Hierarchy Setup",
      done: route.stepsCompleted.level3Hierarchy,
      active: currentView === "level3_hierarchy",
    },
    {
      key: "units",
      label: "Units",
      done: route.stepsCompleted.units,
      active: currentView === "units",
    },
  ];

  return (
    <nav
      aria-label="Project setup progress"
      className="mb-8 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3"
    >
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-muted-foreground hidden sm:inline">→</span>
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm",
              step.active && "font-semibold text-primary",
              step.done && !step.active && "text-muted-foreground",
              !step.done && !step.active && "text-muted-foreground/80",
            )}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle
                className={cn(
                  "h-4 w-4 shrink-0",
                  step.active && "text-primary",
                )}
              />
            )}
            <span>{step.label}</span>
          </div>
        </div>
      ))}
    </nav>
  );
};

export default ProjectSetupStepper;
