import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";

const PropertiesManagement = () => {
  const { hasPermission } = useAuth();
  const [properties, setProperties] = useState([]);


  // Using axios
  useEffect(() => {
    if (!hasPermission("manage_project")) return;

    const fetchProperties = async () => {
      try {
        const response = await axiosInstance.get("/properties");
        setProperties(response.data);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      }
    };

    fetchProperties();
  }, []);

  if (!hasPermission("manage_project")) return <p>Permission denied</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">Properties Management</h2>
      <ul>
        {properties.map((prop) => (
          <li key={prop.id}>
            {prop.flat_no} - {prop.status}
          </li>
        ))}
      </ul>
      {/* Add link or button to create/edit properties */}
      <a href="/properties/create">Create New Property</a>
    </div>
  );
};

export default PropertiesManagement;
