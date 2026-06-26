import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FormContext } from "../../../contexts/FormContext";
import ProjectStep2LocationFields, {
  type ProjectStep2FormValues,
  type ProjectStep2FieldErrors,
} from "../shared/ProjectStep2LocationFields";
import {
  emptyStep2Errors,
  isStep2Valid,
  validateProjectStep2,
} from "../shared/projectStep2Validation";

const fromFormData = (formData: {
  search_address?: string;
  address?: string;
  street?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  locality?: string;
  latitude?: string;
  longitude?: string;
  office_address_line1?: string;
  office_address_line2?: string;
}): ProjectStep2FormValues => ({
  search_address: formData.search_address || "",
  address: formData.address || "",
  street: formData.street || "",
  country: formData.country || "",
  state: formData.state || "",
  city: formData.city || "",
  zip: formData.zip || "",
  locality: formData.locality || "",
  latitude: formData.latitude || "",
  longitude: formData.longitude || "",
  office_address_line1: formData.office_address_line1 || "",
  office_address_line2: formData.office_address_line2 || "",
});

const Step2Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData } = useContext(FormContext);
  const isEditMode = !!projectId;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ProjectStep2FieldErrors>(emptyStep2Errors());
  const [formValues, setFormValues] = useState<ProjectStep2FormValues>(() =>
    fromFormData(formData),
  );

  useEffect(() => {
    setFormValues(fromFormData(formData));
  }, [formData]);

  const patchForm = useCallback((patch: Partial<ProjectStep2FormValues>) => {
    setFormValues((prev) => ({ ...prev, ...patch }));
    const cleared = Object.keys(patch).filter(
      (k) => k in emptyStep2Errors(),
    ) as (keyof ProjectStep2FieldErrors)[];
    if (cleared.length) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of cleared) next[key] = "";
        return next;
      });
    }
  }, []);

  const validate = () => {
    const newErrors = validateProjectStep2(formValues);
    setErrors(newErrors);
    return isStep2Valid(newErrors);
  };

  const continueToStep3 = async () => {
    setLoading(true);
    try {
      await saveStepData(2, formValues);
      updateFormData(formValues);
      const basePath = isEditMode
        ? `/projects/edit/${projectId}`
        : "/projects/create";
      navigate(`${basePath}/step3`);
    } catch (error) {
      console.error("Error saving step 2:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await continueToStep3();
  };

  const handleSkip = async () => {
    setErrors(emptyStep2Errors());
    await continueToStep3();
  };

  const handleBack = () => {
    const basePath = isEditMode
      ? `/projects/edit/${projectId}`
      : "/projects/create";
    navigate(`${basePath}/step1`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 bg-white rounded-xl shadow-lg"
    >
      <ProjectStep2LocationFields
        formValues={formValues}
        errors={errors}
        onChange={patchForm}
        disabled={loading}
      />

      <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          size="lg"
          className="flex-1"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleSkip()}
          size="lg"
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Saving..." : "Skip for now"}
        </Button>
        <Button type="submit" disabled={loading} size="lg" className="flex-1">
          {loading ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
};

export default Step2Form;
