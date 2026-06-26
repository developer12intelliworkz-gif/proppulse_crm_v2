import { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FormContext } from "../../../contexts/FormContext";
import { useAuth } from "../../../contexts/AuthContext";
import { mapSubcategoryToBackend } from "@/components/inventory/inventoryBackendMapping";
import { saveProjectInitialSetup } from "@/components/projects/setup/projectSetupHelpers";
import { loadProjectInventorySetup } from "../shared/loadProjectInventorySetup";
import ProjectInventoryTypeFields, {
  type ProjectInventoryTypeValue,
} from "../shared/ProjectInventoryTypeFields";
import ProjectLogoUpload from "../shared/ProjectLogoUpload";
import { projectLogoKey } from "@/utils/projectPendingFiles";
import MonthYearPicker from "../shared/MonthYearPicker";
import {
  currentMonthYear,
  formatDateToMonthYear,
  monthYearToApiDate,
} from "@/utils/monthYearDate";
import type { ProjectTypeKey } from "@/store/types/inventory";

const CREATE_STEP1_STORAGE_KEY = "create_project_step1_v1";

interface FormValues {
  name: string;
  description: string;
  rera_project_id: string;
  launched_on: string;
  possession: string;
  is_active: string;
  created_by: string;
}

const Step1Form = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const {
    formData,
    updateFormData,
    saveStepData,
    setLastSavedStep,
    salesOptions,
    projectId: contextProjectId,
  } = useContext(FormContext);
  const { user } = useAuth();

  const projectId = routeProjectId || contextProjectId;
  const isEditMode = !!routeProjectId;
  const minMonth = currentMonthYear();

  const creatorDisplayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    const match = salesOptions.find((o) => o.value === formData.created_by);
    return match?.label || "—";
  }, [user, salesOptions, formData.created_by]);

  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [inventorySetup, setInventorySetup] =
    useState<ProjectInventoryTypeValue>({
      projectType: "",
      subcategory: "",
    });
  const [errors, setErrors] = useState<
    Partial<{
      name: string;
      rera_project_id: string;
      launched_on: string;
      possession: string;
      created_by: string;
      projectType: string;
      subcategory: string;
    }>
  >({});

  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    description: "",
    rera_project_id: "",
    launched_on: "",
    possession: "",
    is_active: "true",
    created_by: user?.id || "",
  });

  // Restore Step 1 values on refresh (create flow only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(CREATE_STEP1_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        formValues?: Partial<FormValues>;
        inventorySetup?: Partial<ProjectInventoryTypeValue>;
      };
      if (parsed.formValues) {
        setFormValues((prev) => ({
          ...prev,
          ...parsed.formValues,
          created_by:
            parsed.formValues.created_by || prev.created_by || user?.id || "",
        }));
      }
      if (parsed.inventorySetup) {
        setInventorySetup((prev) => ({ ...prev, ...parsed.inventorySetup }));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!formData) return;

    setFormValues({
      name: formData.name || "",
      description: formData.description || "",
      rera_project_id: formData.rera_project_id || "",
      launched_on: formatDateToMonthYear(formData.launched_on),
      possession: formatDateToMonthYear(formData.possession),
      is_active:
        formData.is_active !== undefined ? String(formData.is_active) : "true",
      created_by: formData.created_by || user?.id || "",
    });
  }, [formData, user?.id]);

  // Persist Step 1 values on change (create flow only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      localStorage.setItem(
        CREATE_STEP1_STORAGE_KEY,
        JSON.stringify({ formValues, inventorySetup }),
      );
    } catch {
      // ignore
    }
  }, [formValues, inventorySetup, isEditMode]);

  useEffect(() => {
    if (!projectId) return;

    setSetupLoading(true);
    loadProjectInventorySetup(projectId)
      .then(({ setup }) => {
        if (setup) {
          setInventorySetup(setup);
        }
      })
      .finally(() => setSetupLoading(false));
  }, [projectId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) newErrors.name = "Please enter a project name";
    if (!formValues.launched_on)
      newErrors.launched_on = "Please select a launch date";
    if (!formValues.possession)
      newErrors.possession = "Please select a possession date";
    if (!formValues.created_by && !user?.id)
      newErrors.created_by = "User ID is missing";

    if (!inventorySetup.projectType) {
      newErrors.projectType = "Please select a project type";
    }
    if (!inventorySetup.subcategory) {
      newErrors.subcategory = "Please select a project subcategory";
    }

    const reraTrimmed = formValues.rera_project_id?.trim();
    if (reraTrimmed && !/^[a-zA-Z0-9-]+$/.test(reraTrimmed)) {
      newErrors.rera_project_id =
        "RERA Project ID must contain only letters, numbers, and hyphens";
    }

    if (formValues.launched_on && formValues.possession) {
      if (formValues.launched_on > formValues.possession) {
        newErrors.possession = "Possession must be after launch month";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const key = name as keyof typeof prev;
      if (!prev[key]) return prev;
      return { ...prev, [key]: "" };
    });
  };

  const setMonthYearField = (field: "launched_on" | "possession", value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
  };

  const handleDescriptionChange = (value: string) => {
    setFormValues((prev) => ({ ...prev, description: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const stepData = {
        name: formValues.name,
        description: formValues.description,
        rera_project_id: formValues.rera_project_id,
        created_by: user?.id || formValues.created_by,
        is_active: formValues.is_active === "true",
        inventory: true,
        status: "draft",
        expected_completion: "",
        sales: user?.id || formValues.created_by || "",
        launched_on: monthYearToApiDate(formValues.launched_on),
        possession: monthYearToApiDate(formValues.possession),
      };

      const savedId = await saveStepData(1, stepData);
      const pid = savedId || projectId;
      if (!pid) {
        throw new Error("Project was not created");
      }

      const backend = mapSubcategoryToBackend(
        inventorySetup.projectType as ProjectTypeKey,
        inventorySetup.subcategory,
      );
      await saveProjectInitialSetup(pid, {
        ...backend,
        inventory_subcategory: inventorySetup.subcategory,
      });

      updateFormData(stepData);
      setLastSavedStep(1);

      const basePath = isEditMode
        ? `/projects/edit/${pid}`
        : "/projects/create";
      navigate(`${basePath}/step2`);
    } catch (error) {
      console.error("Error saving step 1:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow"
    >
      <div>
        <h2 className="text-xl font-bold">Project Details</h2>
        <p className="text-sm text-muted-foreground">
          Basic project information and inventory type. Use{" "}
          <strong>Project Setup</strong> to build towers, floors, and units.
        </p>
      </div>

      {/* 1. RERA Number */}
      <div>
        <Label htmlFor="rera_project_id">RERA Number</Label>
        <Input
          id="rera_project_id"
          name="rera_project_id"
          placeholder="Enter RERA Project Number"
          value={formValues.rera_project_id}
          onChange={handleChange}
        />
        {errors.rera_project_id && (
          <p className="text-red-600 text-sm mt-1">{errors.rera_project_id}</p>
        )}
      </div>

      {/* 2. Project Name */}
      {setupLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading saved inventory type…
        </p>
      ) : (
        <>
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Project Name"
              value={formValues.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* 3. Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <ReactQuill
              value={formValues.description}
              onChange={handleDescriptionChange}
              theme="snow"
            />
          </div>

          {/* 4. Inventory Structure note */}
          {/* <div className="rounded-lg border bg-muted/20 p-4">
            <div className="font-medium">Inventory Structure</div>
            <div className="text-sm text-muted-foreground mt-1">
              Configure towers and units later from <strong>Project Setup</strong>.
            </div>
          </div> */}

          {/* 5–6. Project Type & Subcategory */}
          <ProjectInventoryTypeFields
            value={inventorySetup}
            onChange={(value) => {
              setInventorySetup(value);
              setErrors((prev) => ({
                ...prev,
                projectType: "",
                subcategory: "",
              }));
            }}
            errors={{
              projectType: errors.projectType,
              subcategory: errors.subcategory,
            }}
            disabled={loading}
          />
        </>
      )}

      {/* 7. Project Logo */}
      <ProjectLogoUpload
        logoUrl={formData.project_logo_url}
        storageKey={projectLogoKey(projectId || contextProjectId)}
      />

      <Separator />

      {/* 8. User */}
      <div>
        <Label htmlFor="created_by_user">User</Label>
        <Input
          id="created_by_user"
          readOnly
          value={creatorDisplayName}
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Project creator (auto-filled from your account)
        </p>
        {errors.created_by && (
          <p className="text-red-600 text-sm mt-1">{errors.created_by}</p>
        )}
      </div>

      {/* 9. Launched On */}
      <div>
        <Label htmlFor="launched_on">Launched On (Month & Year) *</Label>
        <MonthYearPicker
          value={formValues.launched_on}
          min={minMonth}
          onChange={(v) => setMonthYearField("launched_on", v)}
        />
        {errors.launched_on && (
          <p className="text-red-600 text-sm mt-1">{errors.launched_on}</p>
        )}
      </div>

      {/* 10. Possession */}
      <div>
        <Label htmlFor="possession">Possession (Month & Year) *</Label>
        <MonthYearPicker
          value={formValues.possession}
          min={formValues.launched_on || minMonth}
          onChange={(v) => setMonthYearField("possession", v)}
        />
        {errors.possession && (
          <p className="text-red-600 text-sm mt-1">{errors.possession}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            try {
              localStorage.removeItem(CREATE_STEP1_STORAGE_KEY);
            } catch {
              // ignore
            }
            navigate("/projects");
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || setupLoading}
          className="flex-1"
        >
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default Step1Form;
