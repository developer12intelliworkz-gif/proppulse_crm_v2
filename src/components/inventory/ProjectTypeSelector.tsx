import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch } from "@/store/hooks";
import { setProjectType } from "@/store/slices/inventorySlice";
import type { ProjectTypeKey } from "@/store/types/inventory";
import { PROJECT_TYPES } from "./inventoryConstants";
import { ChevronRight } from "lucide-react";

const ProjectTypeSelector = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
          Step 1 of 3
        </span>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Select Project Type
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Choose the category that best describes your real estate project to
          configure the inventory structure.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {(Object.entries(PROJECT_TYPES) as [ProjectTypeKey, (typeof PROJECT_TYPES)[string]][]).map(
          ([key, type]) => (
            <Card
              key={key}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
              onClick={() => dispatch(setProjectType(key))}
            >
              <CardContent className="p-6 flex flex-col items-start h-full">
                <span className="text-4xl mb-3">{type.icon}</span>
                <h3 className="font-bold text-lg mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {type.description}
                </p>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted">
                    {type.subcategories.length} categories
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
};

export default ProjectTypeSelector;
