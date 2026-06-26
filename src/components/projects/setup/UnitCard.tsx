// src/components/projects/setup/UnitCard.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // ← Yeh import missing tha
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Square } from "lucide-react";

interface UnitCardProps {
  unit: {
    id: string;
    unit_number: string;
    unit_name?: string;
    carpet_area_sqft?: number;
    super_builtup_area_sqft?: number;
    status: string;
    facing?: string;
    is_corner?: boolean;
    plc_applicable?: boolean;
    floor_rise_applicable?: boolean;
  };
  onEdit?: (unitId: string) => void;
  onDelete?: (unitId: string) => void;
}

export const UnitCard = ({ unit, onEdit, onDelete }: UnitCardProps) => {
  const statusVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    available: "default",
    booked: "secondary",
    sold: "destructive",
    blocked: "outline",
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border hover:border-primary/50 group">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg tracking-tight">
              {unit.unit_number}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unit.unit_name || "—"}
            </p>
          </div>

          <Badge
            variant={statusVariant[unit.status] || "secondary"}
            className="capitalize"
          >
            {unit.status}
          </Badge>
        </div>

        {/* Area Info */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {unit.carpet_area_sqft && (
            <div className="flex items-center gap-1.5">
              <Square className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Carpet: <strong>{unit.carpet_area_sqft} sq.ft</strong>
              </span>
            </div>
          )}

          {unit.super_builtup_area_sqft && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Super: <strong>{unit.super_builtup_area_sqft} sq.ft</strong>
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {unit.is_corner && (
            <Badge
              variant="secondary"
              className="text-xs bg-amber-50 text-amber-800"
            >
              Corner
            </Badge>
          )}
          {unit.plc_applicable && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-50 text-blue-800"
            >
              PLC
            </Badge>
          )}
          {unit.floor_rise_applicable && (
            <Badge
              variant="secondary"
              className="text-xs bg-purple-50 text-purple-800"
            >
              Floor Rise
            </Badge>
          )}
          {unit.facing && (
            <Badge variant="outline" className="text-xs">
              {unit.facing}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onEdit(unit.id)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete(unit.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
