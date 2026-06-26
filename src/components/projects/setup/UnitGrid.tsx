// src/components/projects/setup/UnitGrid.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Unit } from "./unitTypes";

interface UnitGridProps {
  units: Unit[];
  onUnitClick: (unit: Unit) => void;
  onAssignLead: (unit: Unit) => void;
  onDeleteUnit?: (unit: Unit) => void;
}

export const UnitGrid = ({
  units,
  onUnitClick,
  onAssignLead,
  onDeleteUnit,
}: UnitGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "booked":
        return "bg-orange-500";
      case "sold":
        return "bg-red-500";
      case "blocked":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800">
      <div className="text-center mb-6 text-white">
        <div className="text-sm uppercase tracking-widest text-slate-400">
          SCREEN
        </div>
        <div className="h-1 bg-gradient-to-r from-transparent via-white to-transparent my-3" />
      </div>

      <div className="grid grid-cols-8 gap-3 max-w-4xl mx-auto">
        {units.length === 0 ? (
          <p className="col-span-8 text-center py-12 text-slate-400">
            No units yet. Add some!
          </p>
        ) : (
          units.map((unit) => (
            <div
              key={unit.id}
              onClick={() => onUnitClick(unit)}
              className={`
                group aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer relative
                transition-all text-white font-medium text-sm shadow-md
                ${getStatusColor(unit.status)}
                hover:scale-110 hover:shadow-xl
              `}
            >
              {onDeleteUnit && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteUnit(unit);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
              <div className="text-lg font-bold">{unit.unit_number}</div>
              {unit.carpet_area_sqft && (
                <div className="text-xs opacity-75">
                  {unit.carpet_area_sqft} sqft
                </div>
              )}
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {unit.status.toUpperCase()}
              </Badge>

              {unit.status === "available" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignLead(unit);
                  }}
                  className="mt-2 text-[10px] bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full"
                >
                  Assign Lead
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center gap-8 mt-10 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" /> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded" /> Booked
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" /> Sold
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded" /> Blocked
        </div>
      </div>
    </div>
  );
};

export default UnitGrid;
