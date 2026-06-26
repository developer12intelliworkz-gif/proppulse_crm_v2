import { useContext, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormContext } from '../../../contexts/FormContext';
import { Building2, Layers } from 'lucide-react';
import AmenitiesSection from '../shared/AmenitiesSection';
import UnitTypesSection, {
  type UnitTypesSectionHandle,
} from '../shared/UnitTypesSection';

// Specifications temporarily disabled — re-enable when product needs them again.
// interface Specification {
//   title: string;
//   description: string;
// }

const Step4Form = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData, projectId: contextProjectId } = useContext(FormContext);
  const projectId = routeProjectId || contextProjectId;
  const isEditMode = !!routeProjectId;
  const unitTypesRef = useRef<UnitTypesSectionHandle>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ unitTypes: '' });

  const validate = () => {
    const newErrors = { unitTypes: '' };
    if (!unitTypesRef.current?.validate()) {
      newErrors.unitTypes = 'At least one unit type is required';
    }
    setErrors(newErrors);
    return !newErrors.unitTypes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const stepData = { specifications: formData.specifications || [] };
      await saveStepData(4, stepData);
      updateFormData(stepData);
      const basePath = isEditMode ? `/projects/edit/${projectId}` : '/projects/create';
      navigate(`${basePath}/step5`);
    } catch (error) {
      console.error('Error saving step 4:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const basePath = isEditMode ? `/projects/edit/${projectId}` : '/projects/create';
    navigate(`${basePath}/step3`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Amenities & Unit Types</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure what this project offers and which unit labels appear in the inventory builder.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Amenities</CardTitle>
                <CardDescription>
                  Add and select amenities available at this project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AmenitiesSection projectId={projectId} />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Unit Types</CardTitle>
                <CardDescription>
                  Required — used when creating inventory units (e.g. 1 BHK, 2 BHK, Office)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UnitTypesSection ref={unitTypesRef} projectId={projectId} />
            {errors.unitTypes && (
              <p className="text-sm text-destructive mt-3">{errors.unitTypes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default Step4Form;
