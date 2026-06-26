// // CreateLeadForm.tsx
// import React, { useState, useEffect, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useAuth } from "@/contexts/AuthContext";
// import axiosInstance from "@/api/axiosInstance";
// import { Input } from "@/components/ui/input";
// import { Search } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// /* ──────────────────────────────────────────────────────────────
//    Utility – strip HTML (fallback when no HTML renderer is used) push today
//    ──────────────────────────────────────────────────────────────                            */
// const extractTextFromHTML = (html: string) => {
//   const temp = document.createElement("div");
//   temp.innerHTML = html;
//   return temp.textContent || temp.innerText || "";
// };

// /* ──────────────────────────────────────────────────────────────
//    Types
//    ────────────────────────────────────────────────────────────── */
// interface Project {
//   id: number;
//   name: string;
//   description?: string;
//   address?: string;
//   country?: string;
//   state?: string;
//   city?: string;
//   pincode?: string;
//   latitude?: number;
//   longitude?: number;
//   amenities?: { [key: string]: boolean };
// }

// /* ── Form data – added interest_level ── */
// interface FormData {
//   id?: number;
//   name: string;
//   email: string;
//   phone: string;
//   lead_type: string;
//   address: string;
//   property_type: string;
//   budget: string;
//   message: string;
//   interested_project_id: string;
//   status: string;
//   assigned_to?: string;
//   interest_level: string; // <-- NEW
// }

// /* ── Errors – added interest_level ── */
// interface FormErrors {
//   name?: string;
//   email?: string;
//   phone?: string;
//   lead_type?: string;
//   assigned_to?: string;
//   interest_level?: string; // <-- NEW
// }

// interface LeadType {
//   id: string;
//   name: string;
// }

// interface ProjectDetailsProps {
//   projectId: string | null;
//   token: string | null;
//   isAuthenticated: boolean;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

// /* ──────────────────────────────────────────────────────────────
//    ProjectDetails – unchanged
//    ────────────────────────────────────────────────────────────── */
// const ProjectDetails: React.FC<ProjectDetailsProps> = ({
//   projectId,
//   token,
//   isAuthenticated,
// }) => {
//   const [project, setProject] = useState<Project | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isAuthenticated || !token || !projectId || projectId === "none") {
//       setProject(null);
//       setError(null);
//       return;
//     }

//     const fetchProjectDetails = async () => {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const response = await axiosInstance.get(`/projects/${projectId}`);
//         const data = response.data.data || response.data;
//         if (!data) throw new Error("No data returned from API");
//         if (data.amenities && typeof data.amenities === "string") {
//           data.amenities = JSON.parse(data.amenities);
//         } else if (!data.amenities) {
//           data.amenities = {};
//         }
//         setProject(data);
//       } catch (err: any) {
//         console.error("Error fetching project details:", err);
//         setError(
//           err.response?.statusText ||
//             err.message ||
//             "Failed to fetch project details",
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchProjectDetails();
//   }, [projectId, token, isAuthenticated]);

//   if (!projectId || projectId === "none") {
//     return (
//       <div className="p-4">
//         <p className="text-gray-500">Select a project to view details.</p>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="p-4">
//         <p>Loading project details...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
//   }

//   if (!project) {
//     return (
//       <div className="p-4">
//         <p className="text-gray-500">No project details available.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4">
//       <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
//       <p className="text-gray-600 mb-2">
//         {project.description
//           ? extractTextFromHTML(project.description)
//           : "No description available."}
//       </p>
//       <div className="space-y-2">
//         {project.address && (
//           <p>
//             <strong>Address:</strong> {project.address}
//           </p>
//         )}
//         {project.country && (
//           <p>
//             <strong>Country:</strong> {project.country}
//           </p>
//         )}
//         {project.state && (
//           <p>
//             <strong>State:</strong> {project.state}
//           </p>
//         )}
//         {project.city && (
//           <p>
//             <strong>City:</strong> {project.city}
//           </p>
//         )}
//         {project.pincode && (
//           <p>
//             <strong>Pincode:</strong> {project.pincode}
//           </p>
//         )}
//         {(project.latitude || project.longitude) && (
//           <p>
//             <strong>Location:</strong> Lat {project.latitude}, Long{" "}
//             {project.longitude}
//           </p>
//         )}
//         {project.amenities && Object.keys(project.amenities).length > 0 && (
//           <div>
//             <strong>Amenities:</strong>
//             <ul className="list-disc pl-5 mt-1">
//               {Object.entries(project.amenities).map(
//                 ([amenity, available]) =>
//                   available && <li key={amenity}>{amenity}</li>,
//               )}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// /* ──────────────────────────────────────────────────────────────
//    CreateLeadForm – main component
//    ────────────────────────────────────────────────────────────── */
// const CreateLeadForm: React.FC<{
//   onClose: () => void;
//   onLeadCreated: () => void;
//   projects: Project[];
//   initialData?: FormData;
//   isEditMode?: boolean;
//   leadId?: number;
// }> = ({
//   onClose,
//   onLeadCreated,
//   projects,
//   initialData,
//   isEditMode = false,
//   leadId,
// }) => {
//   const { user, token, hasPermission, isAuthenticated } = useAuth();
//   const [formData, setFormData] = useState<FormData>(
//     initialData || {
//       name: "",
//       email: "",
//       phone: "",
//       lead_type: "meta",
//       address: "",
//       property_type: "",
//       budget: "",
//       message: "",
//       interested_project_id: "none",
//       status: "new",
//       assigned_to: "",
//       interest_level: "", // <-- NEW
//     },
//   );

//   const [errors, setErrors] = useState<FormErrors>({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [formError, setFormError] = useState<string | null>(null);
//   const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
//   const [leadTypesLoading, setLeadTypesLoading] = useState(true);
//   const [leadTypesError, setLeadTypesError] = useState<string | null>(null);
//   const { toast } = useToast();

//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(
//     initialData?.assigned_to?.toString() || null,
//   );
//   const searchInputRef = useRef<HTMLInputElement>(null);

//   /* ── Sync interest_level from initialData (edit mode) ── */
//   useEffect(() => {
//     if (initialData?.interest_level) {
//       setFormData((prev) => ({
//         ...prev,
//         interest_level: initialData.interest_level,
//       }));
//     }
//   }, [initialData]);

//   /* ── Fetch users ── */
//   useEffect(() => {
//     const fetchUsers = async () => {
//       setIsLoading(true);
//       try {
//         const response = await axiosInstance.get("/users");
//         const fetchedUsers = response.data || [];
//         setUsers(fetchedUsers);
//         setFilteredUsers(fetchedUsers);

//         if (isEditMode && initialData?.assigned_to) {
//           const valid = fetchedUsers.find(
//             (u: User) => u.id.toString() === initialData.assigned_to.toString(),
//           );
//           if (valid) setSelectedUserId(valid.id.toString());
//         }
//       } catch (err) {
//         console.error("Failed to fetch users:", err);
//         toast({
//           title: "Error",
//           description: "Failed to fetch users. Please try again.",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchUsers();
//   }, [isEditMode, initialData, toast]);

//   /* ── Filter users by search term ── */
//   useEffect(() => {
//     const term = searchTerm.toLowerCase();
//     setFilteredUsers(
//       users.filter(
//         (u) =>
//           u.name.toLowerCase().includes(term) ||
//           u.email.toLowerCase().includes(term),
//       ),
//     );
//   }, [searchTerm, users]);

//   /* ── Fetch lead types ── */
//   useEffect(() => {
//     const fetchLeadTypes = async () => {
//       if (!token || !isAuthenticated) {
//         setLeadTypesError("Authentication required to fetch lead types.");
//         setLeadTypesLoading(false);
//         return;
//       }
//       setLeadTypesLoading(true);
//       setLeadTypesError(null);
//       try {
//         const response = await axiosInstance.get("/leadtype");
//         setLeadTypes(response.data || []);
//       } catch (err: any) {
//         console.error("Error fetching lead types:", err);
//         setLeadTypesError(
//           err.response?.data?.message ||
//             err.response?.statusText ||
//             err.message ||
//             "Failed to fetch lead types",
//         );
//       } finally {
//         setLeadTypesLoading(false);
//       }
//     };
//     fetchLeadTypes();
//   }, [token, isAuthenticated]);

//   const isAgent = user?.role === "agent";
//   const canEdit =
//     hasPermission("create_leads") || hasPermission("assign_leads");

//   /* ── Validation – added interest_level (required for testing) ── */
//   const validateForm = () => {
//     const newErrors: FormErrors = {};

//     if (!formData.name.trim()) newErrors.name = "Name is required";
//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = "Please enter a valid email address";
//     }
//     if (!formData.phone.trim()) {
//       newErrors.phone = "Phone number is required";
//     } else if (!/^\d{10}$/.test(formData.phone)) {
//       newErrors.phone = "Please enter a valid 10-digit phone number";
//     }
//     if (!formData.lead_type) newErrors.lead_type = "Lead type is required";
//     if (!selectedUserId)
//       newErrors.assigned_to = "Please assign the lead to a user";

//     // <-- NEW: Interest level required (remove if you want it optional)
//     if (!formData.interest_level)
//       newErrors.interest_level = "Interest level is required";

//     return newErrors;
//   };

//   /* ── Generic input handler – added interest_level ── */
//   const handleInputChange = (field: keyof FormData, value: string) => {
//     setFormData({ ...formData, [field]: value });

//     const newErrors: FormErrors = { ...errors };
//     if (field === "interest_level") {
//       if (!value) newErrors.interest_level = "Interest level is required";
//       else delete newErrors.interest_level;
//     }
//     // (other field validations stay unchanged – omitted for brevity)
//     setErrors(newErrors);
//   };

//   /* ── Submit ── */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!token || !canEdit) {
//       setFormError("You do not have permission to perform this action.");
//       toast({
//         title: "Error",
//         description: "You do not have permission to perform this action.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const validationErrors = validateForm();
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors);
//       toast({
//         title: "Validation Error",
//         description: "Please correct the errors in the form.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);
//     setFormError(null);

//     const leadData = {
//       name: formData.name || null,
//       email: formData.email || null,
//       phone: formData.phone || null,
//       lead_type: formData.lead_type,
//       address: formData.address || null,
//       property_type: formData.property_type || null,
//       budget: formData.budget || null,
//       message: formData.message || null,
//       status: formData.status,
//       interested_project_id:
//         formData.interested_project_id === "none"
//           ? null
//           : parseInt(formData.interested_project_id),
//       assigned_to: selectedUserId || null,
//       interest_level: formData.interest_level || null, // <-- NEW
//     };

//     try {
//       let response;
//       if (isEditMode && leadId) {
//         response = await axiosInstance.put(`/leads/${leadId}`, leadData);
//         toast({
//           title: "Success",
//           description: `Lead updated! Interest Level: ${formData.interest_level}`,
//         });
//       } else {
//         response = await axiosInstance.post("/leads", leadData);
//         toast({
//           title: "Success",
//           description: `Lead created! Interest Level: ${formData.interest_level}`,
//         });
//       }
//       onLeadCreated();
//       onClose();
//     } catch (error: any) {
//       console.error("Error saving lead:", error);
//       const errorMessage =
//         error.response?.data?.error ||
//         error.response?.data?.message ||
//         error.message ||
//         "An unexpected error occurred";
//       setFormError(`Error saving lead: ${errorMessage}`);
//       toast({
//         title: "Error",
//         description: `Failed to ${
//           isEditMode ? "update" : "create"
//         } lead: ${errorMessage}`,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const capitalize = (str: string) =>
//     str.charAt(0).toUpperCase() + str.slice(1);

//   /* ── Render ── */
//   return (
//     <div className="flex flex-col md:flex-row h-full">
//       {/* LEFT – Project Details */}
//       <div className="md:w-1/2 p-4 border-r md:border-r-gray-200 sticky top-0 bg-white z-10 h-full overflow-y-auto">
//         <ProjectDetails
//           projectId={formData.interested_project_id}
//           token={token}
//           isAuthenticated={isAuthenticated}
//         />
//       </div>

//       {/* RIGHT – Form */}
//       <div className="md:w-1/2 p-4 overflow-y-auto">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {formError && (
//             <div className="bg-red-100 text-red-700 p-2 rounded">
//               {formError}
//             </div>
//           )}

//           {/* Name */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Name*
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => handleInputChange("name", e.target.value)}
//               placeholder="Enter name"
//               className={`w-full border rounded-md p-2 ${
//                 errors.name ? "border-red-500" : ""
//               }`}
//               disabled={isLoading || isAgent || !canEdit}
//             />
//             {errors.name && (
//               <p className="text-red-500 text-xs mt-1">{errors.name}</p>
//             )}
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Email*
//             </label>
//             <input
//               type="email"
//               value={formData.email}
//               onChange={(e) => handleInputChange("email", e.target.value)}
//               placeholder="Enter email"
//               className={`w-full border rounded-md p-2 ${
//                 errors.email ? "border-red-500" : ""
//               }`}
//               disabled={isLoading || isAgent || !canEdit}
//             />
//             {errors.email && (
//               <p className="text-red-500 text-xs mt-1">{errors.email}</p>
//             )}
//           </div>

//           {/* Phone */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Phone*
//             </label>
//             <input
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => handleInputChange("phone", e.target.value)}
//               placeholder="Enter 10-digit phone number"
//               className={`w-full border rounded-md p-2 ${
//                 errors.phone ? "border-red-500" : ""
//               }`}
//               disabled={isLoading || isAgent || !canEdit}
//             />
//             {errors.phone && (
//               <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
//             )}
//           </div>

//           {/* Address */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Address
//             </label>
//             <input
//               type="text"
//               value={formData.address}
//               onChange={(e) => handleInputChange("address", e.target.value)}
//               placeholder="Enter address"
//               className="w-full border rounded-md p-2"
//               disabled={isLoading || isAgent || !canEdit}
//             />
//           </div>

//           {/* Interested Project */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Interested Project
//             </label>
//             <Select
//               value={formData.interested_project_id}
//               onValueChange={(v) =>
//                 handleInputChange("interested_project_id", v)
//               }
//               disabled={isLoading || isAgent || !canEdit}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select project" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="none">None</SelectItem>
//                 {projects.map((p) => (
//                   <SelectItem key={p.id} value={p.id.toString()}>
//                     {p.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Property Type */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Property Type
//             </label>
//             <input
//               type="text"
//               value={formData.property_type}
//               onChange={(e) =>
//                 handleInputChange("property_type", e.target.value)
//               }
//               placeholder="Enter property type"
//               className="w-full border rounded-md p-2"
//               disabled={isLoading || isAgent || !canEdit}
//             />
//           </div>

//           {/* Assigned To (searchable) */}
//           <div className="space-y-2">
//             <Select
//               value={selectedUserId || ""}
//               onValueChange={(v) => setSelectedUserId(v)}
//               disabled={isLoading || isAgent || !canEdit}
//               onOpenChange={() => {
//                 setTimeout(() => searchInputRef.current?.focus(), 100);
//               }}
//             >
//               <SelectTrigger id="user-select">
//                 <SelectValue placeholder="Select a user" />
//               </SelectTrigger>
//               <SelectContent>
//                 <div className="px-3 py-2 sticky top-0 bg-white z-10">
//                   <div className="relative">
//                     <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <Input
//                       ref={searchInputRef}
//                       placeholder="Search by name or email..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-10"
//                       onClick={(e) => e.stopPropagation()}
//                     />
//                   </div>
//                 </div>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((u) => (
//                     <SelectItem key={u.id} value={u.id}>
//                       {u.name} ({u.email})
//                     </SelectItem>
//                   ))
//                 ) : (
//                   <div className="px-3 py-2 text-gray-500">No users found</div>
//                 )}
//               </SelectContent>
//             </Select>
//             {errors.assigned_to && (
//               <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>
//             )}
//           </div>

//           {/* Budget */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Budget
//             </label>
//             <input
//               type="text"
//               value={formData.budget}
//               onChange={(e) => handleInputChange("budget", e.target.value)}
//               placeholder="Enter budget (e.g., 5000000)"
//               className="w-full border rounded-md p-2"
//               disabled={isLoading || isAgent || !canEdit}
//             />
//           </div>

//           {/* Message */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Message
//             </label>
//             <input
//               type="text"
//               value={formData.message}
//               onChange={(e) => handleInputChange("message", e.target.value)}
//               placeholder="Enter message"
//               className="w-full border rounded-md p-2"
//               disabled={isLoading || isAgent || !canEdit}
//             />
//           </div>

//           {/* Lead Type */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Lead Type
//             </label>
//             <Select
//               value={formData.lead_type}
//               onValueChange={(v) => handleInputChange("lead_type", v)}
//               disabled={isLoading || isAgent || !canEdit || leadTypesLoading}
//             >
//               <SelectTrigger>
//                 <SelectValue
//                   placeholder={
//                     leadTypesLoading ? "Loading..." : "Select lead type"
//                   }
//                 />
//               </SelectTrigger>
//               <SelectContent>
//                 {leadTypesError ? (
//                   <div className="p-2 text-red-500">{leadTypesError}</div>
//                 ) : (
//                   leadTypes.map((lt) => (
//                     <SelectItem key={lt.id} value={lt.name}>
//                       {lt.name}
//                     </SelectItem>
//                   ))
//                 )}
//               </SelectContent>
//             </Select>
//             {errors.lead_type && (
//               <p className="text-red-500 text-xs mt-1">{errors.lead_type}</p>
//             )}
//           </div>

//           {/* Status */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Status
//             </label>
//             <Select
//               value={capitalize(formData.status)}
//               onValueChange={(v) =>
//                 handleInputChange("status", v.toLowerCase())
//               }
//               disabled={isLoading || isAgent || !canEdit}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent>
//                 {[
//                   "New",
//                   "Contacted",
//                   "Qualified",
//                   "Working",
//                   "Proposal Sent",
//                   // "Customer",
//                   "Lost",
//                 ].map((s) => (
//                   <SelectItem key={s} value={s}>
//                     {s}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* ── INTEREST LEVEL DROPDOWN (NEW) ── */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Interest Level <span className="text-red-500">*</span>
//             </label>
//             <Select
//               value={formData.interest_level}
//               onValueChange={(v) => handleInputChange("interest_level", v)}
//               disabled={isLoading || isAgent || !canEdit}
//             >
//               <SelectTrigger
//                 className={errors.interest_level ? "border-red-500" : ""}
//               >
//                 <SelectValue placeholder="Select interest level" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Hot">Hot (Ready to buy)</SelectItem>
//                 <SelectItem value="Warm">Warm (Interested)</SelectItem>
//                 <SelectItem value="Cold">Cold (Just inquiring)</SelectItem>
//               </SelectContent>
//             </Select>
//             {errors.interest_level && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.interest_level}
//               </p>
//             )}
//           </div>

//           {/* Submit / Cancel */}
//           <div className="flex justify-end gap-2">
//             <Button
//               type="submit"
//               disabled={
//                 isLoading ||
//                 isAgent ||
//                 !canEdit ||
//                 Object.keys(errors).length > 0
//               }
//             >
//               {isLoading
//                 ? isEditMode
//                   ? "Updating..."
//                   : "Creating..."
//                 : isEditMode
//                   ? "Update"
//                   : "Create"}
//             </Button>
//             <Button
//               variant="outline"
//               onClick={onClose}
//               disabled={isLoading || isAgent || !canEdit}
//             >
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateLeadForm;

// CreateLeadForm.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import {
  getPhoneValidationError,
  sanitizePhoneInput,
} from "@/utils/phoneValidation";

/* Utility */
const extractTextFromHTML = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

/* Types */
interface Project {
  id: number;
  name: string;
  description?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  amenities?: { [key: string]: boolean };
}

interface FormData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  lead_type: string;
  address: string;
  property_type: string;
  budget: string;
  message: string;
  interested_project_id: string;
  status: string;
  assigned_to?: string;
  interest_level: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  lead_type?: string;
  assigned_to?: string;
}

interface LeadType {
  id: string;
  name: string;
  is_assignable?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

/* ProjectDetails Component */
const ProjectDetails: React.FC<{
  projectId: string | null;
  token: string | null;
  isAuthenticated: boolean;
}> = ({ projectId, token, isAuthenticated }) => {
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || projectId === "none" || !isAuthenticated || !token) {
      setProject(null);
      setError(null);
      return;
    }

    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/projects/${projectId}`);
        const data = response.data.data || response.data;
        setProject(data);
      } catch (err: any) {
        console.error("Error fetching project details:", err);
        setError("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, token, isAuthenticated]);

  if (!projectId || projectId === "none") {
    return <p className="text-gray-500 italic">No project selected</p>;
  }
  if (isLoading) return <p>Loading project details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!project) return <p>No project details available.</p>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{project.name}</h3>
      <p>
        {project.description
          ? extractTextFromHTML(project.description)
          : "No description available."}
      </p>
      {project.address && (
        <p>
          <strong>Address:</strong> {project.address}
        </p>
      )}
      {project.city && (
        <p>
          <strong>City:</strong> {project.city}
        </p>
      )}
      {project.state && (
        <p>
          <strong>State:</strong> {project.state}
        </p>
      )}
    </div>
  );
};

/* Main Component */
const CreateLeadForm: React.FC<{
  onClose: () => void;
  onLeadCreated: () => void;
  projects: Project[];
  initialData?: FormData;
  isEditMode?: boolean;
  leadId?: number;
}> = ({
  onClose,
  onLeadCreated,
  projects,
  initialData,
  isEditMode = false,
  leadId,
}) => {
  const { user, token, hasPermission, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      lead_type: "meta",
      address: "",
      property_type: "",
      budget: "",
      message: "",
      interested_project_id: "none",
      status: "new",
      assigned_to: "",
      interest_level: "",
    },
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [leadTypesLoading, setLeadTypesLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialData?.assigned_to?.toString() || null,
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initial data for edit mode
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedUserId(initialData.assigned_to?.toString() || null);
    }
  }, [initialData]);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/users");
        const fetchedUsers = response.data || [];
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (err) {
        // toast({
        // title: "Error",
        // description: "Failed to fetch users",
        // variant: "destructive",
        // });
      }
    };
    fetchUsers();
  }, [toast]);

  // Filter Users
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      ),
    );
  }, [searchTerm, users]);

  // Fetch Lead Types
  useEffect(() => {
    const fetchLeadTypes = async () => {
      if (!token || !isAuthenticated) return;
      try {
        const response = await axiosInstance.get("/leadtype");
        setLeadTypes(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLeadTypesLoading(false);
      }
    };
    fetchLeadTypes();
  }, [token, isAuthenticated]);

  // Normalize lead_type to name (API may return name; dropdown options use name)
  useEffect(() => {
    if (leadTypes.length === 0 || !formData.lead_type) return;
    const byName = leadTypes.find(
      (lt) =>
        lt.name === formData.lead_type ||
        lt.name?.toLowerCase() === formData.lead_type?.toLowerCase(),
    );
    if (byName) return;
    const byId = leadTypes.find(
      (lt) => String(lt.id) === String(formData.lead_type),
    );
    if (byId) {
      setFormData((prev) => ({ ...prev, lead_type: byId.name }));
    }
  }, [leadTypes, formData.lead_type]);

  const canEdit =
    hasPermission("create_leads") || hasPermission("assign_leads");

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Valid email is required";
    }
    const phoneError = getPhoneValidationError(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    if (!formData.lead_type) newErrors.lead_type = "Lead source is required";
    return newErrors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const nextValue = field === "phone" ? sanitizePhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // toast({
      // title: "Validation Error",
      // description: "Please fix the errors in the form.",
      // variant: "destructive",
      // });
      return;
    }

    setIsLoading(true);
    setFormError(null);

    const leadData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      lead_type: formData.lead_type,
      address: formData.address || null,
      property_type: formData.property_type || null,
      budget: formData.budget || null,
      message: formData.message || null,
      status: formData.status,
      interested_project_id:
        formData.interested_project_id === "none"
          ? null
          : parseInt(formData.interested_project_id),
      assigned_to: (selectedUserId === "none" || !selectedUserId) ? null : selectedUserId,
      interest_level: formData.interest_level || null,
    };

    try {
      if (isEditMode && leadId) {
        await axiosInstance.put(`/leads/${leadId}`, leadData);
        // toast({ title: "Success", description: "Lead updated successfully!" });
      } else {
        await axiosInstance.post("/leads", leadData);
        // toast({ title: "Success", description: "Lead created successfully!" });
      }

      onLeadCreated();
      onClose();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Server error";
      setFormError(errorMsg);
      // toast({
      // title: "Error",
      // description: errorMsg,
      // variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  const assignableLeadTypes = leadTypes.filter(
    (lt) => lt.is_assignable !== false,
  );
  const selectableLeadTypes = (() => {
    if (
      isEditMode &&
      formData.lead_type &&
      !assignableLeadTypes.some((lt) => lt.name === formData.lead_type)
    ) {
      const current = leadTypes.find((lt) => lt.name === formData.lead_type);
      return current ? [...assignableLeadTypes, current] : assignableLeadTypes;
    }
    return assignableLeadTypes;
  })();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Project Details */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Project Details</h2>
        <ProjectDetails
          projectId={formData.interested_project_id}
          token={token}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Right: Form */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isEditMode ? "Edit Lead" : "Create New Lead"}
        </h2>

        {formError && <p className="text-red-500 mb-4">{formError}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter full name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <Input
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter address"
              disabled={isLoading}
            />
          </div>

          {/* Interested Project */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Interested Project
            </label>
            <Select
              value={formData.interested_project_id}
              onValueChange={(v) =>
                handleInputChange("interested_project_id", v)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Property Type
              </label>
              <Input
                value={formData.property_type}
                onChange={(e) =>
                  handleInputChange("property_type", e.target.value)
                }
                placeholder="e.g. Apartment, Villa"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget</label>
              <Input
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
                placeholder="e.g. 5000000"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Assigned To *
            </label>
            <Select
              value={selectedUserId || ""}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
              onOpenChange={() =>
                setTimeout(() => searchInputRef.current?.focus(), 100)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Search and select user" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <SelectItem value="none">Unassigned</SelectItem>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))
                ) : (
                  <p className="p-2 text-sm text-gray-500">No users found</p>
                )}
              </SelectContent>
            </Select>
            {errors.assigned_to && (
              <p className="text-red-500 text-sm mt-1">{errors.assigned_to}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <Input
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              placeholder="Additional notes"
              disabled={isLoading}
            />
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Lead Source *
            </label>
            <Select
              value={formData.lead_type}
              onValueChange={(v) => handleInputChange("lead_type", v)}
              disabled={isLoading || leadTypesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                {selectableLeadTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.name}>
                    {formatPascalCaseDisplayName(lt.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={formData.status}
              onValueChange={(v) =>
                handleInputChange("status", v.toLowerCase())
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "New",
                  "Contacted",
                  "Qualified",
                  "Working",
                  "Proposal Sent",
                  "Lost",
                ].map((s) => (
                  <SelectItem key={s} value={s.toLowerCase()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interest Level */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Interest Level
            </label>
            <Select
              value={formData.interest_level}
              onValueChange={(v) => handleInputChange("interest_level", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interest level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot (Ready to buy)</SelectItem>
                <SelectItem value="warm">Warm (Interested)</SelectItem>
                <SelectItem value="cold">Cold (Just inquiring)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canEdit}>
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Lead"
                  : "Create Lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadForm;
