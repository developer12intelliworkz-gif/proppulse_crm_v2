import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TYPES } from "@/components/inventory/inventoryConstants";
import type { ProjectTypeKey } from "@/store/types/inventory";

export interface ProjectInventoryTypeValue {
  projectType: ProjectTypeKey | "";
  subcategory: string;
}

interface ProjectInventoryTypeFieldsProps {
  value: ProjectInventoryTypeValue;
  onChange: (value: ProjectInventoryTypeValue) => void;
  errors?: { projectType?: string; subcategory?: string };
  disabled?: boolean;
}

const ProjectInventoryTypeFields = ({
  value,
  onChange,
  errors = {},
  disabled = false,
}: ProjectInventoryTypeFieldsProps) => {
  const typeSelectValue = value.projectType ? String(value.projectType) : "__unset__";
  const subcategorySelectValue = value.subcategory ? value.subcategory : "__unset__";
  const typeOptions = useMemo(
    () =>
      Object.entries(PROJECT_TYPES).map(([key, type]) => ({
        value: key as ProjectTypeKey,
        label: `${type.icon} ${type.label}`,
        description: type.description,
      })),
    [],
  );

  const subcategoryOptions = useMemo(() => {
    if (!value.projectType) return [];
    const type = PROJECT_TYPES[value.projectType];
    return type.subcategories.map((sub) => ({
      value: sub.key,
      label: `${sub.icon} ${sub.label}`,
    }));
  }, [value.projectType]);

  const handleTypeChange = (nextType: string) => {
    if (nextType === value.projectType) return;
    onChange({
      projectType: nextType as ProjectTypeKey,
      subcategory: "",
    });
  };

  const handleSubcategoryChange = (subcategory: string) => {
    if (subcategory === value.subcategory) return;
    onChange({ ...value, subcategory });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold">Inventory structure</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Required — configure towers and units later from Project Setup.
        </p>
      </div>

      <div>
        <Label htmlFor="project-type">Project Type *</Label>
        <Select
          value={typeSelectValue}
          onValueChange={(v) => {
            if (v === "__unset__") return;
            handleTypeChange(v);
          }}
          disabled={disabled}
        >
          <SelectTrigger id="project-type" className="mt-1">
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unset__" disabled>
              Select project type
            </SelectItem>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.projectType && (
          <p className="text-sm text-destructive mt-1">{errors.projectType}</p>
        )}
      </div>

      <div>
        <Label htmlFor="project-subcategory">Project Subcategory *</Label>
        <Select
          key={`subcategory-${value.projectType}-${value.subcategory}`}
          value={subcategorySelectValue}
          onValueChange={(v) => {
            if (v === "__unset__") return;
            handleSubcategoryChange(v);
          }}
          disabled={disabled || !value.projectType}
        >
          <SelectTrigger id="project-subcategory" className="mt-1">
            <SelectValue
              placeholder={
                value.projectType
                  ? "Select subcategory"
                  : "Select project type first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unset__" disabled>
              {value.projectType ? "Select subcategory" : "Select project type first"}
            </SelectItem>
            {subcategoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subcategory && (
          <p className="text-sm text-destructive mt-1">{errors.subcategory}</p>
        )}
      </div>
    </div>
  );
};

export default ProjectInventoryTypeFields;
