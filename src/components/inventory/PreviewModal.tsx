import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/store/hooks";
import { selectInventoryMetrics } from "./inventorySelectors";
import {
  getSubcategory,
  isApartmentSubcategory,
  PROJECT_TYPES,
  STATUS_UI,
} from "./inventoryConstants";
import { formatFloorLabel, sortFloorsTopToBottom } from "@/utils/inventoryFloors";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

const PreviewModal = ({ open, onClose }: PreviewModalProps) => {
  const inventory = useAppSelector((s) => s.inventory);
  const metrics = useAppSelector(selectInventoryMetrics);
  const subcat = getSubcategory(inventory.projectType, inventory.subcategory);
  const typeInfo = inventory.projectType
    ? PROJECT_TYPES[inventory.projectType]
    : null;
  const isApartment = isApartmentSubcategory(inventory.subcategory);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Project Preview</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {typeInfo?.icon} {typeInfo?.label}
            {subcat && ` › ${subcat.label}`} · {inventory.projectName}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg border p-2">
              <p className="font-bold">{metrics.totalUnits}</p>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className="font-bold">{metrics.available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className="font-bold">
                ₹{metrics.totalValue.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>

          {isApartment ? (
            inventory.towers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No towers defined yet.
              </p>
            ) : (
              inventory.towers.map((tower) => (
                <div
                  key={tower.id}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <h4 className="font-semibold text-sm mb-3 flex justify-between">
                    {tower.name}
                    <span className="text-xs text-muted-foreground font-normal">
                      {tower.floors.length} floors · {tower.totalUnits} units
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {sortFloorsTopToBottom(tower.floors).map((floor) => (
                      <div
                        key={floor.number}
                        className="flex gap-3 text-xs bg-card p-2 rounded border"
                      >
                        <span className="font-medium text-primary w-28 shrink-0">
                          {formatFloorLabel(floor)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {floor.units.map((unit) => (
                            <Badge
                              key={unit.id}
                              variant="outline"
                              className={
                                STATUS_UI[unit.status]?.badge || ""
                              }
                            >
                              {unit.number}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          ) : inventory.units.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No units defined yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {inventory.units.map((unit) => (
                <Badge
                  key={unit.id}
                  variant="outline"
                  className={STATUS_UI[unit.status]?.badge}
                >
                  {unit.unitName}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal;
