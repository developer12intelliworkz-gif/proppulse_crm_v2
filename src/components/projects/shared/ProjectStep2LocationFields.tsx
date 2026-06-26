import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProjectLocationPicker from "./ProjectLocationPicker";
import type { ParsedProjectAddress } from "@/utils/parseGooglePlaceAddress";

export interface ProjectStep2FormValues {
  search_address: string;
  address: string;
  street: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  locality: string;
  latitude: string;
  longitude: string;
  office_address_line1: string;
  office_address_line2: string;
}

export type ProjectStep2FieldErrors = Partial<
  Record<keyof ProjectStep2FormValues, string>
>;

interface ProjectStep2LocationFieldsProps {
  formValues: ProjectStep2FormValues;
  errors: ProjectStep2FieldErrors;
  onChange: (patch: Partial<ProjectStep2FormValues>) => void;
  disabled?: boolean;
}

const ProjectStep2LocationFields = ({
  formValues,
  errors,
  onChange,
  disabled = false,
}: ProjectStep2LocationFieldsProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handlePlaceResolved = (parsed: ParsedProjectAddress) => {
    onChange(parsed);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Location</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional for now — use Google Maps when your API key is ready, or fill
          in the address fields manually. You can also skip this step and add
          location later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 order-2 lg:order-1">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formValues.address}
              onChange={handleInputChange}
              className="mt-2"
              disabled={disabled}
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">Street / Road</Label>
              <Input
                id="street"
                name="street"
                value={formValues.street}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="locality">Locality / Area</Label>
              <Input
                id="locality"
                name="locality"
                value={formValues.locality}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formValues.city}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                value={formValues.state}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={formValues.country}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
              {errors.country && (
                <p className="text-red-600 text-sm mt-1">{errors.country}</p>
              )}
            </div>
            <div>
              <Label htmlFor="zip">Pin Code / ZIP</Label>
              <Input
                id="zip"
                name="zip"
                value={formValues.zip}
                onChange={handleInputChange}
                className="mt-2"
                disabled={disabled}
              />
              {errors.zip && (
                <p className="text-red-600 text-sm mt-1">{errors.zip}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                value={formValues.latitude}
                onChange={handleInputChange}
                className="mt-2 bg-muted"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                value={formValues.longitude}
                onChange={handleInputChange}
                className="mt-2 bg-muted"
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <ProjectLocationPicker
            searchAddress={formValues.search_address}
            latitude={formValues.latitude}
            longitude={formValues.longitude}
            onSearchAddressChange={(v) => onChange({ search_address: v })}
            onPlaceResolved={handlePlaceResolved}
            onCoordinatesChange={(lat, lng) =>
              onChange({ latitude: lat, longitude: lng })
            }
            searchError={errors.search_address}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectStep2LocationFields;
