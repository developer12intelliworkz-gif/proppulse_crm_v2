import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSubcategory, setWizardStep } from "@/store/slices/inventorySlice";
import { PROJECT_TYPES } from "./inventoryConstants";
import { ArrowLeft } from "lucide-react";

interface ProjectSubcategorySelectorProps {
  onSelect?: (subKey: string) => void;
  syncing?: boolean;
}

const ProjectSubcategorySelector = ({
  onSelect,
  syncing = false,
}: ProjectSubcategorySelectorProps) => {
  const dispatch = useAppDispatch();
  const projectType = useAppSelector((s) => s.inventory.projectType);
  const type = projectType ? PROJECT_TYPES[projectType] : null;

  if (!type) return null;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="self-start mb-4"
        onClick={() => dispatch(setWizardStep(1))}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
          Step 2 of 3
        </span>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl">{type.icon}</span>
          <h2 className="text-2xl font-bold">{type.label}</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Select the project subcategory to configure the layout builder
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        {type.subcategories.map((sub) => (
          <Card
            key={sub.key}
            className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              syncing ? "pointer-events-none opacity-60" : ""
            }`}
            onClick={() => {
              dispatch(setSubcategory(sub.key));
              onSelect?.(sub.key);
            }}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2">
              <span className="text-3xl">{sub.icon}</span>
              <span className="font-semibold text-sm leading-tight">
                {sub.label}
              </span>
              {sub.hasTowers && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                  Tower Setup
                </span>
              )}
              {sub.isPlotting && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                  Plot Grid
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectSubcategorySelector;
