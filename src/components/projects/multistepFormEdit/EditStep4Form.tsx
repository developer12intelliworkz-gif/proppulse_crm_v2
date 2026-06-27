import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEditForm } from './EditFormContext';
import { Building2, Layers } from 'lucide-react';
import AmenitiesSection from '../shared/AmenitiesSection';
import UnitTypesSection, {
  type UnitTypesSectionHandle,
} from '../shared/UnitTypesSection';

const EditStep4Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData } = useEditForm();
  const unitTypesRef = useRef<UnitTypesSectionHandle>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ unitTypes: '' });

  const handleAmenitiesChange = useCallback(
    (amenities: Record<string, boolean>) => {
      updateFormData({ amenities });
    },
    [updateFormData],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { unitTypes: '' };
    if (!unitTypesRef.current?.validate()) {
      newErrors.unitTypes = 'At least one unit type is required';
    }
    setErrors(newErrors);
    if (newErrors.unitTypes) return;

    setLoading(true);
    try {
      const stepData = { specifications: formData.specifications || [] };
      await saveStepData(4, stepData);
      updateFormData(stepData);
      navigate(`/projects/edit/${projectId}/step5`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error saving step 4:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-1 max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Amenities & Unit Types</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Update amenities and unit type labels for this project.
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
                  <CardDescription>Project-level amenity selection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AmenitiesSection
                projectId={projectId ?? null}
                onAmenitiesChange={handleAmenitiesChange}
              />
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
                  <CardDescription>Labels used in the inventory builder</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UnitTypesSection ref={unitTypesRef} projectId={projectId ?? null} />
              {errors.unitTypes && (
                <p className="text-sm text-destructive mt-3">{errors.unitTypes}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/edit/${projectId}/step3`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Next"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditStep4Form;
