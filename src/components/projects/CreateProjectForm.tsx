import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MapPin, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axiosInstance from "@/api/axiosInstance";

interface AddressSuggestion {
  place_id: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    highway?: string;
    street?: string;
    residential?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    state?: string;
    state_district?: string;
    country?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

const CreateProjectForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rera_project_id: "",
    sales: "",
    possession: "",
    search_address: "",
    address: "",
    street: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    locality: "",
    latitude: "",
    longitude: "",
  });

  const salesOptions = [
    { value: "", label: "All" },
    { value: "", label: "None" },
    { value: "nancy_gandhi", label: "NANCY GANDHI (Sales) (Sales Team)" },
    { value: "hardik_shah", label: "HARDIK SHAH (Manager) (Sales Team)" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5&countrycodes=in`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching addresses:", error);
      // toast({
      // title: "Error",
      // description: "Failed to fetch address suggestions.",
      // variant: "destructive",
      // });
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, search_address: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 300);
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    const address = suggestion.address;
    const street =
      address.road ||
      address.highway ||
      address.street ||
      address.residential ||
      (address.house_number
        ? `${address.house_number}${address.road ? " " + address.road : ""}`
        : "") ||
      "";
    const locality =
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.state_district ||
      "";
    const city =
      address.city ||
      address.town ||
      address.village || // Added village to ensure city is populated
      address.state_district ||
      "";

    // Warn if critical fields are missing
    if (!street && !locality && !address.postcode && !city) {
      // toast({
      // title: "Warning",
      // description:
      // "Selected address lacks specific details (street, locality, city, or zip). Try a more specific search, e.g., '123 Bandra Road, Mumbai'.",
      // variant: "default",
      // });
    }

    setFormData((prev) => ({
      ...prev,
      search_address: suggestion.display_name,
      address: suggestion.display_name,
      street,
      country: address.country || "India",
      state: address.state || "",
      city,
      zip: address.postcode || "",
      locality,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const clearSearchAddress = () => {
    setFormData((prev) => ({
      ...prev,
      search_address: "",
      address: "",
      street: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      locality: "",
      latitude: "",
      longitude: "",
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/projects", {
        ...formData,
        created_by: user?.id,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      const project = response.data;

      // toast({
      // title: "Success",
      // description: "Project created successfully.",
      // });

      navigate("/dashboard");
    } catch (error: any) {
      // toast({
      // title: "Error",
      // description:
      // error?.response?.data?.error ||
      // error.message ||
      // "Failed to create project",
      // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Project</h2>
          <p className="text-gray-600">Enter details to create a new project</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <Input
            name="name"
            placeholder="Project Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <ReactQuill
            value={formData.description}
            onChange={handleDescriptionChange}
            theme="snow"
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
            }}
            className="bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RERA Project ID
          </label>
          <Input
            name="rera_project_id"
            placeholder="RERA Project ID"
            value={formData.rera_project_id}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Users
          </label>
          <select
            name="sales"
            value={formData.sales}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            style={{
              backgroundColor: formData.sales ? "#6B46C1" : "transparent",
              color: formData.sales ? "#FFFFFF" : "#6B7280",
            }}
          >
            <option value="">All</option>
            <option value="">None</option>
            <option value="nancy_gandhi">
              NANCY GANDHI (Sales) (Sales Team)
            </option>
            <option value="hardik_shah">
              HARDIK SHAH (Manager) (Sales Team)
            </option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Possession
          </label>
          <Input
            type="date"
            name="possession"
            value={formData.possession}
            onChange={handleChange}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Address
          </label>
          <div className="relative">
            <Input
              name="search_address"
              placeholder="Search for address"
              value={formData.search_address}
              onChange={handleSearchAddressChange}
            />
            {formData.search_address && (
              <button
                type="button"
                onClick={clearSearchAddress}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {searchLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : addressSuggestions.length > 0 ? (
                addressSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleAddressSelect(suggestion)}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    {suggestion.display_name}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Input
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street
            </label>
            <Input
              name="street"
              placeholder="Street"
              value={formData.street}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <Input
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <Input
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code
            </label>
            <Input
              name="zip"
              placeholder="Zip Code"
              value={formData.zip}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locality
            </label>
            <Input
              name="locality"
              placeholder="Locality"
              value={formData.locality}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <Input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <Input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectForm;
