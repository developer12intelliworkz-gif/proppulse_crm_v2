import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";

const CreatePropertyForm = () => {
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    project_id: "",
    flat_no: "",
    floor: "",
    area_sqft: "",
    price: "",
    status: "available",
    description: "",
    bedrooms: "",
    bathrooms: "",
  });


  // Uisng Axios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPermission("create_projects")) {
      alert("Permission denied");
      return;
    }

    try {
      const response = await axiosInstance.post("/properties", formData);

      if (response.status === 200 || response.status === 201) {
        alert("Property created successfully");
      }
    } catch (error: any) {
      console.error("Failed to create property:", error.message);
      alert("Failed to create property");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.project_id}
        onChange={(e) =>
          setFormData({ ...formData, project_id: e.target.value })
        }
        placeholder="Project ID"
      />
      <input
        value={formData.flat_no}
        onChange={(e) => setFormData({ ...formData, flat_no: e.target.value })}
        placeholder="Flat No"
      />
      <input
        type="number"
        value={formData.floor}
        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
        placeholder="Floor"
      />
      <input
        type="number"
        step="0.01"
        value={formData.area_sqft}
        onChange={(e) =>
          setFormData({ ...formData, area_sqft: e.target.value })
        }
        placeholder="Area (sqft)"
      />
      <input
        type="number"
        step="0.01"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        placeholder="Price"
      />
      <input
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        placeholder="Status"
      />
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description"
      />
      <input
        type="number"
        value={formData.bedrooms}
        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
        placeholder="Bedrooms"
      />
      <input
        type="number"
        value={formData.bathrooms}
        onChange={(e) =>
          setFormData({ ...formData, bathrooms: e.target.value })
        }
        placeholder="Bathrooms"
      />
      <button type="submit">Create</button>
    </form>
  );
};

export default CreatePropertyForm;
