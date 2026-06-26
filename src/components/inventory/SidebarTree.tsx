import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSelectedFloorNumber,
  setSelectedTowerId,
  toggleUnitSelection,
} from "@/store/slices/inventorySlice";
import {
  getSubcategory,
  isApartmentSubcategory,
  STATUS_UI,
} from "./inventoryConstants";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFloorLabel, sortFloorsTopToBottom } from "@/utils/inventoryFloors";

const SidebarTree = () => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((s) => s.inventory);
  const {
    subcategory,
    towers,
    units,
    selectedTowerId,
    selectedFloorNumber,
    selectedUnits,
  } = inventory;

  const subcat = getSubcategory(inventory.projectType, subcategory);
  const isApartment = isApartmentSubcategory(subcategory);
  const [openTowers, setOpenTowers] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full h-full flex flex-col bg-card border-r">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm">Structure</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {isApartment ? (
          towers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No towers yet.
            </p>
          ) : (
            towers.map((tower) => (
              <Collapsible
                key={tower.id}
                open={openTowers[tower.id] !== false}
                onOpenChange={(open) =>
                  setOpenTowers((p) => ({ ...p, [tower.id]: open }))
                }
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted text-left border-l-2",
                      selectedTowerId === tower.id
                        ? "bg-primary/10 text-primary border-primary font-semibold"
                        : "border-transparent",
                    )}
                    onClick={() => dispatch(setSelectedTowerId(tower.id))}
                  >
                    <span className="font-medium truncate">{tower.name}</span>
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3">
                  {sortFloorsTopToBottom(tower.floors).map((floor) => (
                    <div key={floor.number} className="mt-1">
                      <button
                        type="button"
                        className={cn(
                          "w-full text-left py-1.5 px-2 rounded text-xs hover:bg-muted border-l-2 ml-1",
                          selectedTowerId === tower.id &&
                            selectedFloorNumber === floor.number
                            ? "bg-primary/10 text-primary border-primary font-semibold"
                            : "border-transparent",
                        )}
                        onClick={() => {
                          dispatch(setSelectedTowerId(tower.id));
                          dispatch(setSelectedFloorNumber(floor.number));
                        }}
                      >
                        {formatFloorLabel(floor)}{" "}
                        <span className="text-muted-foreground">
                          ({floor.units.length})
                        </span>
                      </button>
                      {floor.units.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          className={cn(
                            "w-full flex items-center gap-2 py-1 pl-4 pr-2 text-xs rounded hover:bg-muted",
                            selectedUnits.includes(unit.id) &&
                              "bg-primary/10 font-medium",
                          )}
                          onClick={() => {
                            dispatch(setSelectedTowerId(tower.id));
                            dispatch(setSelectedFloorNumber(floor.number));
                            dispatch(toggleUnitSelection(unit.id));
                          }}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              STATUS_UI[unit.status]?.dot || "bg-muted",
                            )}
                          />
                          <span className="truncate">{unit.number}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )
        ) : units.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No {subcat?.unitLabel?.toLowerCase() || "unit"}s yet.
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">
              {subcat?.label} ({units.length})
            </p>
            {units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center gap-2 py-1.5 px-2 text-xs rounded hover:bg-muted"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    STATUS_UI[unit.status]?.dot || "bg-muted",
                  )}
                />
                <span className="truncate">{unit.unitName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarTree;
