// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/components/ui/use-toast";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import { useEditForm } from "./EditFormContext";
// import { useAuth } from "@/contexts/AuthContext";
// import Select from "react-select";

// type OptionType = {
//   label: string;
//   value: string;
// };

// interface FormValues {
//   name: string;
//   description: string;
//   rera_project_id: string;
//   sales: OptionType[]; // UI objects
//   notify_to_emails: string;
//   launched_on: string;
//   expected_completion: string;
//   possession: string;
//   is_active: string;
//   inventory: boolean;
//   created_by: string;
// }

// const EditStep1Form = () => {
//   const { projectId } = useParams<{ projectId?: string }>();
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { formData, updateFormData, saveStepData, salesOptions } =
//     useEditForm();
//   const { user } = useAuth();

//   const [inventoryWarning, setInventoryWarning] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({
//     name: "",
//     launched_on: "",
//     expected_completion: "",
//     possession: "",
//     created_by: "",
//     notify_to_emails: "",
//   });

//   const [formValues, setFormValues] = useState<FormValues>({
//     name: "",
//     description: "",
//     rera_project_id: "",
//     sales: [],
//     notify_to_emails: "",
//     launched_on: "",
//     expected_completion: "",
//     possession: "",
//     is_active: "true",
//     inventory: false,
//     created_by: user?.id || "",
//   });

//   const notifyOptions = [
//     { value: "", label: "Select an email" },
//     { value: "team@example.com", label: "Team (team@example.com)" },
//     { value: "manager@example.com", label: "Manager (manager@example.com)" },
//     { value: "aryan@gmail.com", label: "Team (aryan@gmail.com)" },
//     {
//       value: "arvind@intelliworkz.tech",
//       label: "Manager (arvind@intelliworkz.tech)",
//     },
//   ];

//   const formatDate = (date: string | null) => {
//     if (!date) return "";
//     const d = new Date(date);
//     return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
//   };

//   /* --------------------------------------------------------------
//      Load existing data → map saved IDs → full OptionType objects
//      -------------------------------------------------------------- */
//   useEffect(() => {
//     if (!formData || !salesOptions) return;

//     const mappedSales: OptionType[] = Array.isArray(formData.sales)
//       ? formData.sales
//           .filter((id): id is string => typeof id === "string")
//           .map((id) => salesOptions.find((opt) => opt.value === id))
//           .filter((opt): opt is OptionType => !!opt)
//       : [];

//     setFormValues({
//       name: formData.name ?? "",
//       description: formData.description ?? "",
//       rera_project_id: formData.rera_project_id ?? "",
//       sales: mappedSales,
//       notify_to_emails: formData.notify_to_emails ?? "",
//       launched_on: formatDate(formData.launched_on),
//       expected_completion: formatDate(formData.expected_completion),
//       possession: formatDate(formData.possession),
//       is_active: formData.is_active ? "true" : "false",
//       inventory: formData.inventory ?? false,
//       created_by: formData.created_by ?? user?.id ?? "",
//     });

//     setInventoryWarning(formData.inventory ?? false);
//   }, [formData, salesOptions, user]);

//   /* --------------------------------------------------------------
//      Validation
//      -------------------------------------------------------------- */
//   const validate = () => {
//     const e = {
//       name: "",
//       launched_on: "",
//       expected_completion: "",
//       possession: "",
//       created_by: "",
//       notify_to_emails: "",
//     };

//     if (!formValues.name) e.name = "Project Name is required";
//     if (!formValues.launched_on) e.launched_on = "Launched On is required";
//     if (!formValues.expected_completion)
//       e.expected_completion = "Expected Completion is required";
//     if (!formValues.possession) e.possession = "Possession is required";
//     if (!formValues.created_by) e.created_by = "User ID is required";

//     if (
//       formValues.launched_on &&
//       formValues.expected_completion &&
//       formValues.launched_on > formValues.expected_completion
//     )
//       e.expected_completion = "Expected Completion must be after Launched On";

//     if (
//       formValues.expected_completion &&
//       formValues.possession &&
//       formValues.expected_completion > formValues.possession
//     )
//       e.possession = "Possession must be after Expected Completion";

//     setErrors(e);
//     return Object.values(e).every((v) => !v);
//   };

//   /* --------------------------------------------------------------
//      Handlers
//      -------------------------------------------------------------- */
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormValues((p) => ({ ...p, [name]: value }));
//   };

//   const handleDescriptionChange = (value: string) => {
//     setFormValues((p) => ({ ...p, description: value }));
//   };

//   const handleRadioChange = (value: string) => {
//     setFormValues((p) => ({ ...p, is_active: value }));
//   };

//   const handleCheckboxChange = (checked: boolean) => {
//     setFormValues((p) => ({ ...p, inventory: checked }));
//     setInventoryWarning(checked);
//   };

//   /* --------------------------------------------------------------
//      Submit → send ONLY IDs to the backend
//      -------------------------------------------------------------- */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setLoading(true);
//     try {
//       const payload = {
//         ...formValues,
//         is_active: formValues.is_active === "true",
//         status: "draft",
//         sales: formValues.sales.map((opt) => opt.value), // ← IDs only
//       };

//       await saveStepData(1, payload);

//       // keep full objects in context for the next steps
//       updateFormData({
//         ...payload,
//         sales: formValues.sales,
//       });

//       toast({ title: "Success", description: "Step 1 updated successfully" });
//       navigate(`/projects/edit/${projectId}/step2`);
//     } catch (err: any) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: "Failed to save step 1.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* --------------------------------------------------------------
//      Render
//      -------------------------------------------------------------- */
//   return (
//     <div className="px-1">
//       <form
//         onSubmit={handleSubmit}
//         className="space-y-6 p-6 bg-white rounded-lg shadow-sm"
//       >
//         <h3 className="text-lg font-semibold mb-4 text-gray-900">
//           Project Details
//         </h3>

//         {/* Project Name */}
//         <div>
//           <Label htmlFor="name">Project Name *</Label>
//           <Input
//             id="name"
//             name="name"
//             placeholder="Project Name"
//             value={formValues.name}
//             onChange={handleChange}
//           />
//           {errors.name && (
//             <p className="text-red-600 text-sm mt-1">{errors.name}</p>
//           )}
//         </div>

//         {/* Description */}
//         <div>
//           <Label htmlFor="description">Description</Label>
//           <ReactQuill
//             value={formValues.description}
//             onChange={handleDescriptionChange}
//             theme="snow"
//           />
//         </div>

//         {/* RERA ID */}
//         <div>
//           <Label htmlFor="rera_project_id">RERA Project ID</Label>
//           <Input
//             id="rera_project_id"
//             name="rera_project_id"
//             value={formValues.rera_project_id}
//             onChange={handleChange}
//           />
//         </div>

//         {/* Users – react-select */}
//         <div>
//           <Label htmlFor="sales">Users</Label>
//           <Select
//             isMulti
//             closeMenuOnSelect={false}
//             id="sales"
//             name="sales"
//             options={salesOptions ?? []}
//             value={formValues.sales ?? []}
//             onChange={(selected) => {
//               setFormValues((p) => ({
//                 ...p,
//                 sales: (selected as OptionType[]) ?? [],
//               }));
//             }}
//             getOptionLabel={(o) => o.label}
//             getOptionValue={(o) => o.value}
//             className="basic-multi-select"
//             classNamePrefix="select"
//             placeholder="Select sales partners..."
//             noOptionsMessage={() => "No sales partners available"}
//           />
//         </div>

//         {/* Notify to Emails */}
//         {/* <div>
//           <Label htmlFor="notify_to_emails">Notify to Emails</Label>
//           <select
//             name="notify_to_emails"
//             value={formValues.notify_to_emails}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border rounded-md"
//           >
//             {notifyOptions.map((opt) => (
//               <option key={opt.value} value={opt.value}>
//                 {opt.label}
//               </option>
//             ))}
//           </select>
//         </div> */}

//         {/* Dates */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <Label htmlFor="launched_on">Launched On *</Label>
//             <Input
//               type="date"
//               id="launched_on"
//               name="launched_on"
//               value={formValues.launched_on}
//               onChange={handleChange}
//             />
//             {errors.launched_on && (
//               <p className="text-red-600 text-sm mt-1">{errors.launched_on}</p>
//             )}
//           </div>

//           <div>
//             <Label htmlFor="expected_completion">Expected Completion *</Label>
//             <Input
//               type="date"
//               id="expected_completion"
//               name="expected_completion"
//               value={formValues.expected_completion}
//               onChange={handleChange}
//             />
//             {errors.expected_completion && (
//               <p className="text-red-600 text-sm mt-1">
//                 {errors.expected_completion}
//               </p>
//             )}
//           </div>

//           <div>
//             <Label htmlFor="possession">Possession *</Label>
//             <Input
//               type="date"
//               id="possession"
//               name="possession"
//               value={formValues.possession}
//               onChange={handleChange}
//             />
//             {errors.possession && (
//               <p className="text-red-600 text-sm mt-1">{errors.possession}</p>
//             )}
//           </div>
//         </div>

//         {/* Is Active */}
//         <div>
//           <Label>Is Active</Label>
//           <RadioGroup
//             value={formValues.is_active}
//             onValueChange={handleRadioChange}
//             className="flex gap-4"
//           >
//             <div className="flex items-center space-x-2">
//               <RadioGroupItem value="true" id="active" />
//               <Label htmlFor="active">Active</Label>
//             </div>
//             <div className="flex items-center space-x-2">
//               <RadioGroupItem value="false" id="inactive" />
//               <Label htmlFor="inactive">Inactive</Label>
//             </div>
//           </RadioGroup>
//         </div>

//         {/* Inventory */}
//         <div className="flex items-center space-x-2">
//           <Checkbox
//             id="inventory"
//             checked={formValues.inventory}
//             onCheckedChange={handleCheckboxChange}
//           />
//           <Label htmlFor="inventory">Inventory</Label>
//         </div>
//         {inventoryWarning && (
//           <p className="text-sm text-red-600 mt-1">
//             Warning: Enabling inventory is irreversible.
//           </p>
//         )}

//         {/* Submit */}
//         <div className="flex gap-4 pt-4 border-t">
//           <Button type="submit" disabled={loading} className="flex-1">
//             {loading ? "Saving..." : "Save Changes"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default EditStep1Form;

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useEditForm } from "./EditFormContext";
import { useAuth } from "@/contexts/AuthContext";
import { mapSubcategoryToBackend } from "@/components/inventory/inventoryBackendMapping";
import {
  getApiErrorMessage,
  resetProjectInitialSetup,
  saveProjectInitialSetup,
} from "@/components/projects/setup/projectSetupHelpers";
import { loadProjectInventorySetup } from "../shared/loadProjectInventorySetup";
import ProjectInventoryTypeFields, {
  type ProjectInventoryTypeValue,
} from "../shared/ProjectInventoryTypeFields";
import InventoryTypeChangeConfirmDialog from "../shared/InventoryTypeChangeConfirmDialog";
import ProjectLogoUpload from "../shared/ProjectLogoUpload";
import { projectLogoKey } from "@/utils/projectPendingFiles";
import MonthYearPicker from "../shared/MonthYearPicker";
import {
  formatDateToMonthYear,
  monthYearToApiDate,
} from "@/utils/monthYearDate";
import type { ProjectTypeKey } from "@/store/types/inventory";

interface FormValues {
  name: string;
  description: string;
  rera_project_id: string;
  launched_on: string;
  expected_completion: string;
  possession: string;
  is_active: string;
  created_by: string;
}

const EditStep1Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData, salesOptions } =
    useEditForm();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [hasInventory, setHasInventory] = useState(false);
  const [savedInventorySetup, setSavedInventorySetup] =
    useState<ProjectInventoryTypeValue>({
      projectType: "",
      subcategory: "",
    });
  const [showInventoryChangeConfirm, setShowInventoryChangeConfirm] =
    useState(false);
  const [resettingInventory, setResettingInventory] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [inventorySetup, setInventorySetup] =
    useState<ProjectInventoryTypeValue>({
      projectType: "",
      subcategory: "",
    });
  const [errors, setErrors] = useState({
    name: "",
    launched_on: "",
    expected_completion: "",
    possession: "",
    created_by: "",
    rera_project_id: "",
    projectType: "",
    subcategory: "",
  });

  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    description: "",
    rera_project_id: "",
    launched_on: "",
    expected_completion: "",
    possession: "",
    is_active: "true",
    created_by: user?.id || "",
  });

  const creatorDisplayName = useMemo(() => {
    const id = formValues.created_by || user?.id;
    const match = salesOptions.find((o) => o.value === id);
    if (match?.label) return match.label;
    if (user?.name) return user.name;
    return user?.email || "—";
  }, [formValues.created_by, salesOptions, user]);

  const inventoryTypeChanged = useMemo(
    () =>
      inventorySetup.projectType !== savedInventorySetup.projectType ||
      inventorySetup.subcategory !== savedInventorySetup.subcategory,
    [inventorySetup, savedInventorySetup],
  );

  const applyLoadedInventorySetup = useCallback(
    (setup: ProjectInventoryTypeValue, projectHasInventory: boolean) => {
      setInventorySetup(setup);
      setSavedInventorySetup(setup);
      setHasInventory(projectHasInventory);
    },
    [],
  );

  /* --------------------------------------------------------------
     Load existing data
     -------------------------------------------------------------- */
  useEffect(() => {
    if (!formData) return;

    setFormValues({
      name: formData.name ?? "",
      description: formData.description ?? "",
      rera_project_id: formData.rera_project_id ?? "",
      launched_on: formatDateToMonthYear(formData.launched_on),
      expected_completion: formatDateToMonthYear(formData.expected_completion),
      possession: formatDateToMonthYear(formData.possession),
      is_active: formData.is_active ? "true" : "false",
      created_by: formData.created_by ?? user?.id ?? "",
    });
  }, [formData, user?.id]);

  useEffect(() => {
    if (!projectId) return;

    setSetupLoading(true);
    loadProjectInventorySetup(projectId)
      .then(({ setup, hasInventory: projectHasInventory }) => {
        if (setup) {
          applyLoadedInventorySetup(setup, projectHasInventory);
        } else {
          setHasInventory(projectHasInventory);
        }
      })
      .finally(() => setSetupLoading(false));
  }, [projectId, applyLoadedInventorySetup]);

  /* --------------------------------------------------------------
     Validation - RERA ID is now OPTIONAL
     -------------------------------------------------------------- */
  const validate = () => {
    const e = {
      name: "",
      launched_on: "",
      expected_completion: "",
      possession: "",
      created_by: "",
      notify_to_emails: "",
      rera_project_id: "",
      projectType: "",
      subcategory: "",
    };

    if (!inventorySetup.projectType) {
      e.projectType = "Please select a project type";
    }
    if (!inventorySetup.subcategory) {
      e.subcategory = "Please select a project subcategory";
    }

    if (!formValues.name.trim()) e.name = "Project Name is required";
    if (!formValues.launched_on) e.launched_on = "Launched On is required";
    if (!formValues.possession) e.possession = "Possession is required";
    if (!formValues.created_by) e.created_by = "User ID is required";

    // RERA ID format validation only if provided
    const reraTrimmed = formValues.rera_project_id?.trim();
    if (reraTrimmed && !/^[a-zA-Z0-9-]+$/.test(reraTrimmed)) {
      e.rera_project_id =
        "RERA Project ID must contain only letters, numbers, and hyphens";
    }

    if (
      formValues.launched_on &&
      formValues.possession &&
      formValues.launched_on > formValues.possession
    ) {
      e.possession = "Possession must be after Launched On";
    }

    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  /* --------------------------------------------------------------
     Handlers
     -------------------------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormValues((p) => ({ ...p, description: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormValues((p) => ({ ...p, is_active: value }));
  };

  const setMonthYearField = (field: "launched_on" | "possession", value: string) => {
    setFormValues((p) => ({ ...p, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const performSave = async () => {
    if (!projectId) return;

    const payload = {
      name: formValues.name,
      description: formValues.description,
      rera_project_id: formValues.rera_project_id,
      created_by: formValues.created_by || user?.id,
      is_active: formValues.is_active === "true",
      inventory: true,
      status: "draft",
      expected_completion: monthYearToApiDate(formValues.expected_completion),
      launched_on: monthYearToApiDate(formValues.launched_on),
      possession: monthYearToApiDate(formValues.possession),
    };

    await saveStepData(1, payload);

    const backend = mapSubcategoryToBackend(
      inventorySetup.projectType as ProjectTypeKey,
      inventorySetup.subcategory,
    );
    await saveProjectInitialSetup(projectId, {
      ...backend,
      inventory_subcategory: inventorySetup.subcategory,
    });

    setSavedInventorySetup(inventorySetup);
    updateFormData(payload);
    navigate(`/projects/edit/${projectId}/step2`);
  };

  const handleCancelInventoryChange = () => {
    setInventorySetup(savedInventorySetup);
    setShowInventoryChangeConfirm(false);
  };

  const handleConfirmInventoryChange = async () => {
    if (!projectId) return;

    setResettingInventory(true);
    setErrorMessage("");
    try {
      const { message } = await resetProjectInitialSetup(projectId);
      setHasInventory(false);
      setShowInventoryChangeConfirm(false);
      setStatusMessage(
        message ??
          "Previous inventory was cleared. Saving your new project type…",
      );

      setLoading(true);
      try {
        await performSave();
      } catch (saveErr: unknown) {
        console.error(saveErr);
        setErrorMessage(
          getApiErrorMessage(saveErr, "Inventory was cleared but saving failed."),
        );
      } finally {
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        getApiErrorMessage(err, "Could not reset project inventory."),
      );
      setInventorySetup(savedInventorySetup);
      setShowInventoryChangeConfirm(false);
    } finally {
      setResettingInventory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !projectId) return;

    setErrorMessage("");
    setStatusMessage("");

    if (inventoryTypeChanged && hasInventory) {
      setShowInventoryChangeConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await performSave();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, "Failed to save step 1."));
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------
     Render
     -------------------------------------------------------------- */
  return (
    <div className="px-1">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6 bg-white rounded-lg shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Project Details
          </h3>
          <p className="text-sm text-muted-foreground">
            Basic project information and inventory type. Use{" "}
            <strong>Project Setup</strong> to build towers, floors, and units.
          </p>
        </div>

        {statusMessage && (
          <Alert>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

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
            <p className="text-red-600 text-sm mt-1">
              {errors.rera_project_id}
            </p>
          )}
        </div>

        {setupLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading saved inventory type…
          </p>
        ) : (
          <>
            {/* 2. Project Name */}
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
                Configure towers and units later from{" "}
                <strong>Project Setup</strong>.
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
              disabled={loading || resettingInventory}
            />
          </>
        )}

        {/* 7. Project Logo */}
        <ProjectLogoUpload
          logoUrl={formData.project_logo_url}
          storageKey={projectLogoKey(projectId)}
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
          <p className="text-xs text-muted-foreground mt-1">Project creator</p>
          {errors.created_by && (
            <p className="text-red-600 text-sm mt-1">{errors.created_by}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="launched_on">Launched On (Month & Year) *</Label>
            <MonthYearPicker
              value={formValues.launched_on}
              onChange={(v) => setMonthYearField("launched_on", v)}
            />
            {errors.launched_on && (
              <p className="text-red-600 text-sm mt-1">{errors.launched_on}</p>
            )}
          </div>

          <div>
            <Label htmlFor="possession">Possession (Month & Year) *</Label>
            <MonthYearPicker
              value={formValues.possession}
              min={formValues.launched_on || undefined}
              onChange={(v) => setMonthYearField("possession", v)}
            />
            {errors.possession && (
              <p className="text-red-600 text-sm mt-1">{errors.possession}</p>
            )}
          </div>
        </div>

        {/* Is Active */}
        <div>
          <Label>Is Active</Label>
          <RadioGroup
            value={formValues.is_active}
            onValueChange={handleRadioChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="active" />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="inactive" />
              <Label htmlFor="inactive">Inactive</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={loading || setupLoading || resettingInventory}
            className="flex-1"
          >
            {loading || resettingInventory ? "Saving..." : "Next"}
          </Button>
        </div>
      </form>

      <InventoryTypeChangeConfirmDialog
        open={showInventoryChangeConfirm}
        onOpenChange={setShowInventoryChangeConfirm}
        confirming={resettingInventory}
        onConfirm={() => void handleConfirmInventoryChange()}
        onCancel={handleCancelInventoryChange}
      />
    </div>
  );
};

export default EditStep1Form;
