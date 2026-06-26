import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
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
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

const EditProjectForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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
    if (id) {
      fetchProject();
    }
  }, [id]);

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

  //Uisng Axios
  const fetchProject = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${id}`);
      const project = response.data;
      const salesString = project.sales || "";
      const salesArray = salesString
        .split(",")
        .filter((value: string) => value)
        .map((value: string) => ({
          value,
          label:
            salesOptions.find((opt) => opt.value === value)?.label || value,
        }));

      setFormData({
        name: project.name || "",
        description: project.description || "",
        rera_project_id: project.rera_project_id || "",
        sales: salesArray,
        possession: project.possession
          ? new Date(project.possession).toISOString().split("T")[0]
          : "",
        search_address: project.search_address || "",
        address: project.address || "",
        street: project.street || "",
        country: project.country || "",
        state: project.state || "",
        city: project.city || "",
        zip: project.zip || "",
        locality: project.locality || "",
        latitude: project.latitude || "",
        longitude: project.longitude || "",
      });
    } catch (error: any) {
      console.error("Error fetching project:", error);
      // toast({
      // title: "Error",
      // description: "Failed to fetch project details.",
      // variant: "destructive",
      // });
      navigate("/dashboard");
    } finally {
      setFetchLoading(false);
    }
  };

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
      (address.house_number
        ? `${address.house_number}${address.road ? " " + address.road : ""}`
        : "") ||
      "";
    setFormData((prev) => ({
      ...prev,
      search_address: suggestion.display_name,
      address: suggestion.display_name,
      street,
      country: address.country || "India",
      state: address.state || "",
      city: address.city || address.suburb || "",
      zip: address.postcode || "",
      locality: address.neighbourhood || address.suburb || "",
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  // using axios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.put(`/projects/${id}`, formData);

      // toast({
      // title: "Success",
      // description: "Project updated successfully.",
      // });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error updating project:", error);
      // toast({
      // title: "Error",
      // description:
      // error?.response?.data?.error ||
      // error.message ||
      // "Failed to update project",
      // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
          <p className="text-gray-600">
            Update project details and information
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
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
              RERA Project ID
            </label>
            <Input
              name="rera_project_id"
              placeholder="RERA Project ID"
              value={formData.rera_project_id}
              onChange={handleChange}
            />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Users
            </label>
            <select
              name="sales"
              value={formData.sales}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {salesOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Possession Date
            </label>
            <Input
              type="date"
              name="possession"
              value={formData.possession}
              onChange={handleChange}
            />
          </div>
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
            placeholder="Complete address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <Input
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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
          <div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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
          <div>
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
            {loading ? "Updating..." : "Update Project"}
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

export default EditProjectForm;
