import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FormContext } from "../../../contexts/FormContext";

interface AddressSuggestion {
  place_id: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    suburb?: string;
  };
  lat: string;
  lon: string;
}

const AddressForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formData, updateFormData, resetForm } = useContext(FormContext);
  const [errors, setErrors] = useState({
    search_address: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
  });
  const [formValues, setFormValues] = useState({
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
  });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Simple debounce function
  const debounce = <F extends (...args: any[]) => void>(
    func: F,
    wait: number
  ) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=jsonv2&addressdetails=1&limit=5`,
          {
            headers: {
              "User-Agent": "YourAppName/1.0 (contact@example.com)", // Replace with your app name and contact
            },
          }
        );
        if (!response.ok)
          throw new Error("Failed to fetch address suggestions");
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        // toast({
          // title: "Error",
          // description: "Failed to fetch address suggestions.",
          // variant: "destructive",
        // });
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [toast]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormValues((prev) => ({ ...prev, search_address: value.trim() }));
    fetchSuggestions(value);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setFormValues({
      search_address: suggestion.display_name.trim(),
      address: suggestion.address.house_number
        ? `${suggestion.address.house_number} ${
            suggestion.address.road || ""
          }`.trim()
        : suggestion.address.road?.trim() || suggestion.display_name.trim(),
      street: suggestion.address.road?.trim() || "",
      country: suggestion.address.country?.trim() || "",
      state: suggestion.address.state?.trim() || "",
      city: suggestion.address.city?.trim() || "",
      zip: suggestion.address.postcode?.trim() || "",
      locality: suggestion.address.suburb?.trim() || "",
      latitude: suggestion.lat?.trim() || "",
      longitude: suggestion.lon?.trim() || "",
    });
    setSuggestions([]);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formValues.search_address)
      newErrors.search_address = "Search Address is required";
    if (!formValues.address) newErrors.address = "Address is required";
    if (!formValues.city) newErrors.city = "City is required";
    if (!formValues.state) newErrors.state = "State is required";
    if (!formValues.country) newErrors.country = "Country is required";
    if (!formValues.zip) newErrors.zip = "Zip is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // console.log('AddressForm data being saved:', JSON.stringify(formValues, null, 2));
      updateFormData(formValues);
      // console.log('Updated formData after AddressForm:', JSON.stringify(formData, null, 2));
      navigate("/projects/create/step3");
    } else {
      // toast({
        // title: "Error",
        // description: "Please fix the errors in the form before proceeding.",
        // variant: "destructive",
      // });
    }
  };

  const handleBack = () => {
    navigate("/projects/create/step1");
  };

  const handleCancel = () => {
    resetForm();
    navigate("/dashboard");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow"
    >
      <div className="relative">
        <Label
          htmlFor="search_address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Search Address *
        </Label>
        <Input
          id="search_address"
          name="search_address"
          placeholder="Search Address"
          value={formValues.search_address}
          onChange={handleSearchChange}
          autoComplete="off"
        />
        {errors.search_address && (
          <div className="text-red-600 text-sm mt-1">
            {errors.search_address}
          </div>
        )}
        {isLoadingSuggestions && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10">
            <div className="p-2 text-gray-600">Loading...</div>
          </div>
        )}
        {suggestions.length > 0 && !isLoadingSuggestions && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Address *
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="Address"
          value={formValues.address}
          onChange={handleChange}
        />
        {errors.address && (
          <div className="text-red-600 text-sm mt-1">{errors.address}</div>
        )}
      </div>

      <div>
        <Label
          htmlFor="street"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Street
        </Label>
        <Input
          id="street"
          name="street"
          placeholder="Street"
          value={formValues.street}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Country *
        </Label>
        <Input
          id="country"
          name="country"
          placeholder="Country"
          value={formValues.country}
          onChange={handleChange}
        />
        {errors.country && (
          <div className="text-red-600 text-sm mt-1">{errors.country}</div>
        )}
      </div>

      <div>
        <Label
          htmlFor="state"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          State *
        </Label>
        <Input
          id="state"
          name="state"
          placeholder="State"
          value={formValues.state}
          onChange={handleChange}
        />
        {errors.state && (
          <div className="text-red-600 text-sm mt-1">{errors.state}</div>
        )}
      </div>

      <div>
        <Label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          City *
        </Label>
        <Input
          id="city"
          name="city"
          placeholder="City"
          value={formValues.city}
          onChange={handleChange}
        />
        {errors.city && (
          <div className="text-red-600 text-sm mt-1">{errors.city}</div>
        )}
      </div>

      <div>
        <Label
          htmlFor="zip"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Zip *
        </Label>
        <Input
          id="zip"
          name="zip"
          placeholder="Zip"
          value={formValues.zip}
          onChange={handleChange}
        />
        {errors.zip && (
          <div className="text-red-600 text-sm mt-1">{errors.zip}</div>
        )}
      </div>

      <div>
        <Label
          htmlFor="locality"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Locality
        </Label>
        <Input
          id="locality"
          name="locality"
          placeholder="Locality"
          value={formValues.locality}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label
          htmlFor="latitude"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Latitude
        </Label>
        <Input
          id="latitude"
          name="latitude"
          placeholder="Latitude"
          value={formValues.latitude}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label
          htmlFor="longitude"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Longitude
        </Label>
        <Input
          id="longitude"
          name="longitude"
          placeholder="Longitude"
          value={formValues.longitude}
          onChange={handleChange}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Next
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
