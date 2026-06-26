import axiosInstance from "@/api/axiosInstance";

export const bulkDeleteLeads = async (ids: number[]) => {
  // Concurrently delete each selected lead via individual HTTP DELETE requests
  await Promise.all(
    ids.map((id) => axiosInstance.delete(`/leads/${id}`))
  );
};
