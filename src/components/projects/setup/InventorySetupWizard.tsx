import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelection,
  setProjectId,
  setProjectName,
  updateTowerUnit,
  updateUnit,
} from "@/store/slices/inventorySlice";
import UnitSelectionBar from "@/components/inventory/UnitSelectionBar";
import BulkUnitEditSheet from "@/components/inventory/BulkUnitEditSheet";
import WizardProgress from "@/components/inventory/WizardProgress";
import ApartmentBuilder from "@/components/inventory/ApartmentBuilder";
import SimpleUnitBuilder from "@/components/inventory/SimpleUnitBuilder";
import PlotBuilder from "@/components/inventory/PlotBuilder";
import StatsDashboard from "@/components/inventory/StatsDashboard";
import SidebarTree from "@/components/inventory/SidebarTree";
import PreviewModal from "@/components/inventory/PreviewModal";
import {
  getSubcategory,
  isApartmentSubcategory,
  isPlottingSubcategory,
  PROJECT_TYPES,
} from "@/components/inventory/inventoryConstants";
import {
  saveInventoryWithFeedback,
} from "@/components/inventory/inventoryPersist";
import { AlertCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface InventorySetupWizardProps {
  projectId: string;
  projectName: string;
  onReset?: () => void;
  resetting?: boolean;
}

const InventorySetupWizard = ({
  projectId,
  projectName,
  onReset,
  resetting,
}: InventorySetupWizardProps) => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((s) => s.inventory);
  const { projectType, subcategory } = inventory;

  const [showPreview, setShowPreview] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [persistError, setPersistError] = useState("");
  const selectedUnits = useAppSelector((s) => s.inventory.selectedUnits);

  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  useEffect(() => {
    dispatch(setProjectId(projectId));
    dispatch(setProjectName(projectName));
  }, [dispatch, projectId, projectName]);

  const subcat = getSubcategory(projectType, subcategory);
  const typeInfo = projectType ? PROJECT_TYPES[projectType] : null;
  const canUseBuilder = Boolean(projectType && subcategory);

  const renderBuilder = () => {
    if (isApartmentSubcategory(subcategory)) return <ApartmentBuilder />;
    if (isPlottingSubcategory(subcategory)) return <PlotBuilder />;
    return <SimpleUnitBuilder />;
  };

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = useRef<string>("");

  const persistInventory = async (inventoryState: typeof inventory) => {
    const result = await saveInventoryWithFeedback(
      projectId,
      inventoryState,
      "auto-save",
    );
    if (!result.ok) {
      setPersistError(result.errors.join("; "));
    } else {
      setPersistError("");
    }
    return result;
  };

  useEffect(() => {
    if (!canUseBuilder || !projectId) return;

    const hasStructure =
      inventory.towers.length > 0 || inventory.units.length > 0;
    if (!hasStructure) return;

    const currentSerialized = JSON.stringify({
      towers: inventory.towers,
      units: inventory.units,
    });

    if (!lastSavedStateRef.current) {
      lastSavedStateRef.current = currentSerialized;
      return;
    }

    if (lastSavedStateRef.current === currentSerialized) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      lastSavedStateRef.current = currentSerialized;
      void persistInventory(inventoryRef.current).catch((err) => {
        console.error("[inventory:auto-save] failed", err);
        setPersistError("Auto-save failed. Check console for details.");
      });
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    canUseBuilder,
    projectId,
    inventory.towers,
    inventory.units,
    inventory.subcategory,
  ]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)] rounded-lg border bg-card overflow-hidden">
      <div className="border-b bg-card px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-bold text-lg truncate">{projectName}</h2>
          {typeInfo && subcat && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {typeInfo.icon} {typeInfo.label} · {subcat.icon} {subcat.label}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Configure towers, floors, and units
          </p>
        </div>

        {canUseBuilder && <WizardProgress />}

        {canUseBuilder && (
          <div className="flex items-center gap-2 flex-wrap">
            {onReset && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={resetting}
              >
                Reset setup
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {canUseBuilder && (
          <aside className="hidden md:flex w-56 lg:w-64 shrink-0 overflow-hidden border-r">
            <SidebarTree />
          </aside>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!canUseBuilder && (
            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Project type not configured</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Set the project type and category when creating or editing this
                  project. They are not configured in the layout builder.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/edit/${projectId}`}>
                    Edit project profile
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {canUseBuilder && (
            <div className="space-y-6">
              {persistError && (
                <Alert variant="destructive">
                  <AlertDescription>{persistError}</AlertDescription>
                </Alert>
              )}
              <StatsDashboard />
              <UnitSelectionBar onBulkEdit={() => setShowBulkEdit(true)} />
              {renderBuilder()}
            </div>
          )}
        </main>
      </div>

      {showPreview && (
        <PreviewModal open={showPreview} onClose={() => setShowPreview(false)} />
      )}

      <BulkUnitEditSheet
        open={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        projectId={projectId}
        inventory={inventory}
        selectedUnitIds={selectedUnits}
        onSaved={({ patches, succeeded, failed }) => {
          for (const patch of patches) {
            if (patch.towerId !== undefined && patch.floorNumber !== undefined) {
              dispatch(
                updateTowerUnit({
                  towerId: patch.towerId,
                  floorNumber: patch.floorNumber,
                  unitId: patch.unitId,
                  fields: patch.fields,
                }),
              );
            } else {
              dispatch(
                updateUnit({ unitId: patch.unitId, fields: patch.fields }),
              );
            }
          }

          if (failed.length === 0) {
            toast.success(`Updated ${succeeded} unit(s) successfully`);
          } else if (succeeded > 0) {
            toast.warning(
              `Updated ${succeeded} unit(s). ${failed.length} failed: ${failed
                .slice(0, 3)
                .map((f) => f.label)
                .join(", ")}${failed.length > 3 ? "…" : ""}`,
            );
          } else {
            toast.error(
              `Could not update units: ${failed
                .slice(0, 2)
                .map((f) => `${f.label} (${f.error})`)
                .join("; ")}`,
            );
          }

          dispatch(clearSelection());
        }}
      />
    </div>
  );
};

export default InventorySetupWizard;
