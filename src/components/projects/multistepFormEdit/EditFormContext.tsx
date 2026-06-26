// import React, {
//   createContext,
//   useContext,
//   useState,
//   useCallback,
//   useEffect,
// } from "react";
// import axiosInstance from "@/api/axiosInstance";

// interface Specification {
//   title: string;
//   description: string;
// }

// interface Brochure {
//   name: string;
//   active: boolean;
//   subject: string;
//   content: string;
// }

// interface PriceQuote {
//   active: boolean;
//   subject: string;
//   content: string;
// }

// export interface OptionType {
//   label: string;
//   value: string;
// }

// interface EditFormData {
//   name: string;
//   description: string;
//   rera_project_id: string;
//   sales: OptionType[];
//   notify_to_emails: string;
//   launched_on: string | null;
//   expected_completion: string | null;
//   possession: string | null;
//   is_active: boolean;
//   inventory: boolean;
//   search_address: string;
//   address: string;
//   street: string;
//   country: string;
//   state: string;
//   city: string;
//   zip: string;
//   locality: string;
//   latitude: string;
//   longitude: string;
//   enable_vr: boolean;
//   vr_upload?: File | null;
//   vr_upload_url?: string | null;
//   amenities: { [key: string]: boolean };
//   specifications: Specification[];
//   brochures: Brochure[];
//   price_quotes: PriceQuote[];
//   india_property_code: string;
//   magicbricks_code: string;
//   status: string;
//   created_by: string;
//   completed_steps: number[];
// }

// interface EditFormContextType {
//   formData: EditFormData;
//   projectId: string | null;
//   updateFormData: (newData: Partial<EditFormData>) => void;
//   resetForm: () => void;
//   saveStepData: (
//     step: number,
//     data: Partial<EditFormData>,
//     isFinal?: boolean
//   ) => Promise<string | null>;
//   lastSavedStep: number;
//   setLastSavedStep: (step: number) => void;
//   setProjectId: (id: string | null) => void;
//   fetchInitialData: (projectId: string) => Promise<void>;
//   salesOptions: OptionType[];
// }

// interface User {
//   id: string;
//   name: string;
//   role?: string;
// }

// const initialFormData: EditFormData = {
//   name: "",
//   description: "",
//   rera_project_id: "",
//   sales: [],
//   notify_to_emails: "",
//   launched_on: null,
//   expected_completion: null,
//   possession: null,
//   is_active: true,
//   inventory: false,
//   search_address: "",
//   address: "",
//   street: "",
//   country: "",
//   state: "",
//   city: "",
//   zip: "",
//   locality: "",
//   latitude: "",
//   longitude: "",
//   enable_vr: false,
//   vr_upload: null,
//   vr_upload_url: null,
//   amenities: {},
//   specifications: [],
//   brochures: [],
//   price_quotes: [],
//   india_property_code: "",
//   magicbricks_code: "",
//   status: "draft",
//   created_by: "",
//   completed_steps: [],
// };

// export const EditFormContext = createContext<EditFormContextType>({
//   formData: initialFormData,
//   projectId: null,
//   updateFormData: () => {},
//   resetForm: () => {},
//   saveStepData: async () => null,
//   lastSavedStep: 0,
//   setLastSavedStep: () => {},
//   setProjectId: () => {},
//   fetchInitialData: async () => {},
//   salesOptions: [],
// });

// function validateFormData(formData: EditFormData): {
//   valid: boolean;
//   errors: Record<string, string>;
// } {
//   const errors: Record<string, string> = {};

//   if (!formData.name) errors.name = "Project Name is required";
//   if (formData.launched_on && !/^\d{4}-\d{2}-\d{2}$/.test(formData.launched_on))
//     errors.launched_on =
//       "Launched On must be a valid date (YYYY-MM-DD) or null";
//   if (
//     formData.expected_completion &&
//     !/^\d{4}-\d{2}-\d{2}$/.test(formData.expected_completion)
//   )
//     errors.expected_completion =
//       "Expected Completion must be a valid date (YYYY-MM-DD) or null";
//   if (formData.possession && !/^\d{4}-\d{2}-\d{2}$/.test(formData.possession))
//     errors.possession = "Possession must be a valid date (YYYY-MM-DD) or null";
//   if (
//     formData.launched_on &&
//     formData.expected_completion &&
//     formData.launched_on > formData.expected_completion
//   ) {
//     errors.expected_completion =
//       "Expected Completion must be after Launched On";
//   }
//   if (
//     formData.expected_completion &&
//     formData.possession &&
//     formData.expected_completion > formData.possession
//   ) {
//     errors.possession = "Possession must be after Expected Completion";
//   }
//   if (!formData.created_by) errors.created_by = "User ID is required";
//   if (!Array.isArray(formData.sales))
//     errors.sales = "Sales must be an array of options";

//   if (!formData.address) errors.address = "Address is required";
//   if (!formData.city) errors.city = "City is required";
//   if (!formData.state) errors.state = "State is required";
//   if (!formData.country) errors.country = "Country is required";

//   if (formData.enable_vr && !formData.vr_upload && !formData.vr_upload_url)
//     errors.vr_upload = "VR Upload is required when VR is enabled";

//   if (!formData.specifications || formData.specifications.length === 0)
//     errors.specifications = "At least one specification is required";

//   if (formData.status === "completed") {
//     if (!formData.brochures || formData.brochures.length === 0)
//       errors.brochures =
//         "At least one brochure is required for completed projects";
//     if (!formData.price_quotes || formData.price_quotes.length === 0)
//       errors.price_quotes =
//         "At least one price quote is required for completed projects";
//   }

//   if (
//     formData.status === "completed" &&
//     !formData.india_property_code &&
//     !formData.magicbricks_code
//   ) {
//     errors.property_code =
//       "At least one property code (India Property or Magicbricks) is required for completed projects";
//   }

//   return { valid: Object.keys(errors).length === 0, errors };
// }

// export const EditFormProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [formData, setFormData] = useState<EditFormData>(initialFormData);
//   const [projectId, setProjectId] = useState<string | null>(null);
//   const [lastSavedStep, setLastSavedStep] = useState(0);
//   const [salesOptions, setSalesOptions] = useState<OptionType[]>([]);

//   const fetchUsers = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/users");
//       const userData = response.data.data || response.data;
//       if (Array.isArray(userData)) {
//         const salesUsers = userData
//           .filter(
//             (user: User) =>
//               user.role &&
//               typeof user.role === "string" &&
//               user.role.toLowerCase() === "sales"
//           )
//           .map((user: User) => ({
//             value: user.id,
//             label: `${user.name} (${user.role || "Unknown"})`,
//           }));
//         setSalesOptions(salesUsers);
//       }
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   const fetchInitialData = async (projectId: string) => {
//     try {
//       const response = await axiosInstance.get(`/projects/${projectId}`);
//       const project = response.data;
//       const salesString = project.sales || "";
//       const salesArray = salesString
//         .split(",")
//         .filter((value: string) => value)
//         .map((value: string) => ({
//           value,
//           label:
//             salesOptions.find((opt) => opt.value === value)?.label || value,
//         }));

//       const formattedData: EditFormData = {
//         name: project.name || "",
//         description: project.description || "",
//         rera_project_id: project.rera_project_id || "",
//         sales: salesArray,
//         notify_to_emails: Array.isArray(project.notify_to_emails)
//           ? project.notify_to_emails.join(",")
//           : project.notify_to_emails || "",
//         launched_on: project.launched_on || null,
//         expected_completion: project.expected_completion || null,
//         possession: project.possession || null,
//         is_active: project.is_active ?? true,
//         inventory: project.inventory ?? false,
//         search_address: project.search_address || "",
//         address: project.address || "",
//         street: project.street || "",
//         country: project.country || "",
//         state: project.state || "",
//         city: project.city || "",
//         zip: project.zip || "",
//         locality: project.locality || "",
//         latitude: project.latitude || "",
//         longitude: project.longitude || "",
//         enable_vr: project.enable_vr ?? false,
//         vr_upload: null,
//         vr_upload_url: project.vr_upload_url || null,
//         amenities:
//           typeof project.amenities === "object" && project.amenities !== null
//             ? project.amenities
//             : {},
//         specifications:
//           project.specifications?.map((spec: any) => ({
//             title: spec.title,
//             description: spec.description,
//           })) || [],
//         brochures:
//           project.brochures?.map((brochure: any) => ({
//             name: brochure.name,
//             active: brochure.active,
//             subject: brochure.subject,
//             content: brochure.content,
//           })) || [],
//         price_quotes:
//           project.price_quotes?.map((quote: any) => ({
//             active: quote.active,
//             subject: quote.subject,
//             content: quote.content,
//           })) || [],
//         india_property_code: project.india_property_code || "",
//         magicbricks_code: project.magicbricks_code || "",
//         status: project.status || "draft",
//         created_by: project.created_by || "",
//         completed_steps: Array.isArray(project.completed_steps)
//           ? project.completed_steps
//           : [],
//       };
//       updateFormData(formattedData);
//       setLastSavedStep(6);
//     } catch (error: any) {
//       console.error("Error fetching initial data:", error.message);
//       throw error;
//     }
//   };

//   const updateFormData = (newData: Partial<EditFormData>) => {
//     setFormData((prev) => ({
//       ...prev,
//       ...newData,
//     }));
//   };

//   const resetForm = () => {
//     setFormData(initialFormData);
//     setProjectId(null);
//     setLastSavedStep(0);
//   };

//   const saveStepData = async (
//     step: number,
//     data: Partial<EditFormData>,
//     isFinal = false
//   ): Promise<string | null> => {
//     try {
//       if (!projectId) {
//         throw new Error("No project ID found");
//       }
//       const updatedData = { ...formData, ...data };
//       const completedSteps = Array.from(
//         new Set([...updatedData.completed_steps, step])
//       );
//       const apiData = {
//         ...updatedData,
//         sales: updatedData.sales.map((option) => option.value).join(","),
//         notify_to_emails: updatedData.notify_to_emails || "", // Ensure string
//         completed_steps: completedSteps,
//         status: isFinal ? "completed" : updatedData.status || "draft",
//       };
//       const isValidDate = (dateStr: string | null) => {
//         if (!dateStr || dateStr.trim() === "") return null;
//         return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) &&
//           !isNaN(Date.parse(dateStr))
//           ? dateStr
//           : null;
//       };
//       const finalData = {
//         ...apiData,
//         launched_on: isValidDate(apiData.launched_on),
//         expected_completion: isValidDate(apiData.expected_completion),
//         possession: isValidDate(apiData.possession),
//       };

//       if (isFinal || finalData.status === "completed") {
//         const validation = validateFormData(updatedData);
//         if (!validation.valid) {
//           throw new Error(
//             "Validation failed: " + Object.values(validation.errors).join("; ")
//           );
//         }
//       }

//       let response;
//       if (finalData.vr_upload instanceof File) {
//         const formDataToSend = new FormData();
//         formDataToSend.append("vr_upload", finalData.vr_upload);
//         Object.keys(finalData).forEach((key) => {
//           if (key !== "vr_upload") {
//             const value = finalData[key];
//             if (key === "notify_to_emails" && (!value || value === "")) {
//               return; // Skip empty notify_to_emails
//             }
//             if (value === null || value === undefined) {
//               formDataToSend.append(key, "");
//             } else if (Array.isArray(value) || typeof value === "object") {
//               formDataToSend.append(key, JSON.stringify(value));
//             } else {
//               formDataToSend.append(key, value.toString());
//             }
//           }
//         });
//         response = await axiosInstance.put(
//           `/projects/${projectId}`,
//           formDataToSend,
//           {
//             headers: { "Content-Type": "multipart/form-data" },
//           }
//         );
//       } else {
//         // Ensure notify_to_emails is a string in JSON payload
//         finalData.notify_to_emails = finalData.notify_to_emails || "";
//         // console.log("JSON Payload:", finalData); // Debug
//         response = await axiosInstance.put(`/projects/${projectId}`, finalData);
//       }

//       updateFormData(updatedData);
//       setLastSavedStep(Math.max(step, lastSavedStep));
//       return response.data.id || projectId;
//     } catch (error: any) {
//       console.error("Full Error Response:", error.response?.data);
//       throw error;
//     }
//   };

//   const value = {
//     formData,
//     projectId,
//     updateFormData,
//     resetForm,
//     saveStepData,
//     lastSavedStep,
//     setLastSavedStep,
//     setProjectId,
//     fetchInitialData,
//     salesOptions,
//   };

//   return (
//     <EditFormContext.Provider value={value}>
//       {children}
//     </EditFormContext.Provider>
//   );
// };

// export const useEditForm = () => {
//   const context = useContext(EditFormContext);
//   if (!context) {
//     throw new Error("useEditForm must be used within an EditFormProvider");
//   }
//   return context;
// };

// src/contexts/EditFormContext.tsx

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useCallback,
//   useEffect,
// } from "react";
// import axiosInstance from "@/api/axiosInstance";
// import { useToast } from "@/components/ui/use-toast";

// interface Specification {
//   title: string;
//   description: string;
// }

// interface Brochure {
//   name: string;
//   active: boolean;
//   subject: string;
//   content: string;
// }

// interface PriceQuote {
//   active: boolean;
//   subject: string;
//   content: string;
// }

// export interface OptionType {
//   label: string;
//   value: string;
// }

// interface EditFormData {
//   name: string;
//   description: string;
//   rera_project_id: string;
//   sales: OptionType[];
//   notify_to_emails: string;
//   launched_on: string | null;
//   expected_completion: string | null;
//   possession: string | null;
//   is_active: boolean;
//   inventory: boolean;
//   search_address: string;
//   address: string;
//   street: string;
//   country: string;
//   state: string;
//   city: string;
//   zip: string;
//   locality: string;
//   latitude: string;
//   longitude: string;
//   enable_vr: boolean;
//   vr_upload?: File | null;
//   vr_upload_url?: string | null;
//   amenities: { [key: string]: boolean };
//   specifications: Specification[];
//   brochures: Brochure[];
//   price_quotes: PriceQuote[];
//   india_property_code: string;
//   magicbricks_code: string;
//   status: string;
//   created_by: string;
//   completed_steps: number[];

//   // ADD THESE TWO LINES
//   brochure_uploads: File[];
//   brochure_upload_urls: string[];
// }

// interface EditFormContextType {
//   formData: EditFormData;
//   projectId: string | null;
//   updateFormData: (newData: Partial<EditFormData>) => void;
//   resetForm: () => void;
//   saveStepData: (
//     step: number,
//     data: Partial<EditFormData>,
//     isFinal?: boolean
//   ) => Promise<string | null>;
//   lastSavedStep: number;
//   setLastSavedStep: (step: number) => void;
//   setProjectId: (id: string | null) => void;
//   fetchInitialData: (projectId: string) => Promise<void>;
//   salesOptions: OptionType[];
// }

// interface User {
//   id: string;
//   name: string;
//   role?: string;
// }

// const initialFormData: EditFormData = {
//   name: "",
//   description: "",
//   rera_project_id: "",
//   sales: [],
//   notify_to_emails: "",
//   launched_on: null,
//   expected_completion: null,
//   possession: null,
//   is_active: true,
//   inventory: false,
//   search_address: "",
//   address: "",
//   street: "",
//   country: "",
//   state: "",
//   city: "",
//   zip: "",
//   locality: "",
//   latitude: "",
//   longitude: "",
//   enable_vr: false,
//   vr_upload: null,
//   vr_upload_url: null,
//   amenities: {},
//   specifications: [],
//   brochures: [],
//   price_quotes: [],
//   india_property_code: "",
//   magicbricks_code: "",
//   status: "draft",
//   created_by: "",
//   completed_steps: [],

//   // ADD THESE
//   brochure_uploads: [] as File[],
//   brochure_upload_urls: [] as string[],
// };

// export const EditFormContext = createContext<EditFormContextType>({
//   formData: initialFormData,
//   projectId: null,
//   updateFormData: () => {},
//   resetForm: () => {},
//   saveStepData: async () => null,
//   lastSavedStep: 0,
//   setLastSavedStep: () => {},
//   setProjectId: () => {},
//   fetchInitialData: async () => {},
//   salesOptions: [],
// });

// export const EditFormProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [formData, setFormData] = useState<EditFormData>(initialFormData);
//   const [projectId, setProjectId] = useState<string | null>(null);
//   const [lastSavedStep, setLastSavedStep] = useState(0);
//   const [salesOptions, setSalesOptions] = useState<OptionType[]>([]);
//   const { toast } = useToast();

//   const fetchUsers = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/users");
//       const userData = response.data.data || response.data;
//       if (Array.isArray(userData)) {
//         const allowedUsers = userData
//           .filter((user: User) => {
//             const role = user.role?.toLowerCase();
//             return role === "admin" || role === "channel_partner";
//           })
//           .map((user: User) => ({
//             value: user.id,
//             label: `${user.name} (${user.role || "User"})`,
//           }));
//         setSalesOptions(allowedUsers);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   const fetchInitialData = async (projectId: string) => {
//     try {
//       const response = await axiosInstance.get(`/projects/${projectId}`);
//       const project = response.data;

//       const salesIds = (project.sales || "")
//         .split(",")
//         .map((s: string) => s.trim())
//         .filter(Boolean);

//       const salesArray: OptionType[] = salesIds.map((id: string) => {
//         const existing = salesOptions.find((opt) => opt.value === id);
//         return existing || { value: id, label: `User ${id}` };
//       });

//       const formattedData: EditFormData = {
//         name: project.name || "",
//         description: project.description || "",
//         rera_project_id: project.rera_project_id || "",
//         sales: salesArray,
//         notify_to_emails: Array.isArray(project.notify_to_emails)
//           ? project.notify_to_emails.join(",")
//           : project.notify_to_emails || "",
//         launched_on: project.launched_on || null,
//         expected_completion: project.expected_completion || null,
//         possession: project.possession || null,
//         is_active: project.is_active ?? true,
//         inventory: project.inventory ?? false,
//         search_address: project.search_address || "",
//         address: project.address || "",
//         street: project.street || "",
//         country: project.country || "",
//         state: project.state || "",
//         city: project.city || "",
//         zip: project.zip || "",
//         locality: project.locality || "",
//         latitude: project.latitude || "",
//         longitude: project.longitude || "",
//         enable_vr: project.enable_vr ?? false,
//         vr_upload: null,
//         vr_upload_url: project.vr_upload_url || null,
//         amenities: typeof project.amenities === "object" ? project.amenities : {},
//         specifications:
//           project.specifications?.map((s: any) => ({
//             title: s.title || "",
//             description: s.description || "",
//           })) || [],
//         brochures:
//           project.brochures?.map((b: any) => ({
//             name: b.name || "",
//             active: b.active ?? true,
//             subject: b.subject || "",
//             content: b.content || "",
//           })) || [],
//         price_quotes:
//           project.price_quotes?.map((q: any) => ({
//             active: q.active ?? true,
//             subject: q.subject || "",
//             content: q.content || "",
//           })) || [],
//         india_property_code: project.india_property_code || "",
//         magicbricks_code: project.magicbricks_code || "",
//         status: project.status || "draft",
//         created_by: project.created_by || "",
//         completed_steps: Array.isArray(project.completed_steps)
//           ? project.completed_steps
//           : [],

//         // ADD THESE
//         brochure_uploads: [] as File[],
//         brochure_upload_urls: project.brochure_upload_urls || [],
//       };

//       setFormData(formattedData);
//       setLastSavedStep(6);
//     } catch (error: any) {
//       console.error("Error fetching project:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load project data",
//         variant: "destructive",
//       });
//       throw error;
//     }
//   };

//   const updateFormData = (newData: Partial<EditFormData>) => {
//     setFormData((prev) => ({
//       ...prev,
//       ...newData,
//     }));
//   };

//   const resetForm = () => {
//     setFormData(initialFormData);
//     setProjectId(null);
//     setLastSavedStep(0);
//   };

//   const saveStepData = async (
//     step: number,
//     data: Partial<EditFormData>,
//     isFinal = false
//   ): Promise<string | null> => {
//     if (!projectId) throw new Error("Project ID is missing");

//     try {
//       const updatedData = { ...formData, ...data };
//       const completedSteps = Array.from(
//         new Set([...updatedData.completed_steps, step])
//       );

//       const hasVrFile = updatedData.vr_upload instanceof File;
//       const hasBrochureFiles =
//         updatedData.brochure_uploads && updatedData.brochure_uploads.length > 0;

//       let response;

//       if (hasVrFile || hasBrochureFiles) {
//         const formDataToSend = new FormData();

//         if (hasVrFile) {
//           formDataToSend.append("vr_upload", updatedData.vr_upload!);
//         }

//         if (hasBrochureFiles) {
//           updatedData.brochure_uploads!.forEach((file) => {
//             formDataToSend.append("brochure_uploads", file);
//           });
//         }

//         Object.keys(updatedData).forEach((key) => {
//           if (
//             key !== "vr_upload" &&
//             key !== "brochure_uploads" &&
//             key !== "brochure_upload_urls"
//           ) {
//             const value = updatedData[key as keyof EditFormData];
//             if (value === null || value === undefined) {
//               formDataToSend.append(key, "");
//             } else if (Array.isArray(value) || typeof value === "object") {
//               formDataToSend.append(key, JSON.stringify(value));
//             } else {
//               formDataToSend.append(key, String(value));
//             }
//           }
//         });

//         response = await axiosInstance.put(
//           `/projects/${projectId}`,
//           formDataToSend,
//           { headers: { "Content-Type": "multipart/form-data" } }
//         );
//       } else {
//         const apiData = {
//           ...updatedData,
//           sales: updatedData.sales.map((opt) => opt.value).join(","),
//           notify_to_emails: updatedData.notify_to_emails || "",
//           completed_steps: completedSteps,
//           status: isFinal ? "completed" : updatedData.status || "draft",
//         };

//         response = await axiosInstance.put(`/projects/${projectId}`, apiData);
//       }

//       updateFormData(updatedData);
//       setLastSavedStep(Math.max(step, lastSavedStep));

//       toast({
//         title: "Success",
//         description: "Saved successfully",
//       });

//       return response.data.id || projectId;
//     } catch (error: any) {
//       console.error("Save error:", error.response?.data || error);
//       toast({
//         title: "Error",
//         description: error.response?.data?.error || "Failed to save",
//         variant: "destructive",
//       });
//       throw error;
//     }
//   };

//   const value = {
//     formData,
//     projectId,
//     updateFormData,
//     resetForm,
//     saveStepData,
//     lastSavedStep,
//     setLastSavedStep,
//     setProjectId,
//     fetchInitialData,
//     salesOptions,
//   };

//   return (
//     <EditFormContext.Provider value={value}>
//       {children}
//     </EditFormContext.Provider>
//   );
// };

// export const useEditForm = () => {
//   const context = useContext(EditFormContext);
//   if (!context) {
//     throw new Error("useEditForm must be used within an EditFormProvider");
//   }
//   return context;
// };

// src/contexts/EditFormContext.tsx

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useCallback,
//   useEffect,
// } from "react";
// import axiosInstance from "@/api/axiosInstance";
// import { useToast } from "@/components/ui/use-toast";

// interface Specification {
//   title: string;
//   description: string;
// }
// interface Brochure {
//   name: string;
//   active: boolean;
//   subject: string;
//   content: string;
// }
// interface PriceQuote {
//   active: boolean;
//   subject: string;
//   content: string;
// }

// export interface OptionType {
//   label: string;
//   value: string;
// }

// interface EditFormData {
//   name: string;
//   description: string;
//   rera_project_id: string;
//   sales: OptionType[];
//   notify_to_emails: string;
//   launched_on: string | null;
//   expected_completion: string | null;
//   possession: string | null;
//   is_active: boolean;
//   inventory: boolean;
//   search_address: string;
//   address: string;
//   street: string;
//   country: string;
//   state: string;
//   city: string;
//   zip: string;
//   locality: string;
//   latitude: string;
//   longitude: string;
//   enable_vr: boolean;
//   vr_upload?: File | null;
//   vr_upload_url?: string | null;
//   amenities: { [key: string]: boolean };
//   specifications: Specification[];
//   brochures: Brochure[];
//   price_quotes: PriceQuote[];
//   india_property_code: string;
//   magicbricks_code: string;
//   status: string;
//   created_by: string;
//   completed_steps: number[];
//   brochure_uploads: File[];
//   brochure_upload_urls: string[];
// }

// const initialFormData: EditFormData = {
//   name: "",
//   description: "",
//   rera_project_id: "",
//   sales: [],
//   notify_to_emails: "",
//   launched_on: null,
//   expected_completion: null,
//   possession: null,
//   is_active: true,
//   inventory: false,
//   search_address: "",
//   address: "",
//   street: "",
//   country: "",
//   state: "",
//   city: "",
//   zip: "",
//   locality: "",
//   latitude: "",
//   longitude: "",
//   enable_vr: false,
//   vr_upload: null,
//   vr_upload_url: null,
//   amenities: {},
//   specifications: [],
//   brochures: [],
//   price_quotes: [],
//   india_property_code: "",
//   magicbricks_code: "",
//   status: "draft",
//   created_by: "",
//   completed_steps: [],
//   brochure_uploads: [] as File[],
//   brochure_upload_urls: [] as string[],
// };

// export const EditFormContext = createContext<any>(null);

// export const EditFormProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [formData, setFormData] = useState<EditFormData>(initialFormData);
//   const [projectId, setProjectId] = useState<string | null>(null);
//   const [lastSavedStep, setLastSavedStep] = useState(0);
//   const [salesOptions, setSalesOptions] = useState<OptionType[]>([]);
//   const { toast } = useToast();

//   // FETCH USERS FIRST
//   const fetchUsers = useCallback(async () => {
//     try {
//       const res = await axiosInstance.get("/users");
//       const users = res.data.data || res.data;
//       if (Array.isArray(users)) {
//         const options = users
//           .filter((u: any) =>
//             ["admin", "channel_partner"].includes(u.role?.toLowerCase())
//           )
//           .map((u: any) => ({
//             value: u.id,
//             label: `${u.name} (${u.role || "User"})`,
//           }));
//         setSalesOptions(options);
//       }
//     } catch (err) {
//       console.error("Failed to load users:", err);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   const fetchInitialData = async (id: string) => {
//     try {
//       const [projectRes, usersRes] = await Promise.all([
//         axiosInstance.get(`/projects/${id}`),
//         axiosInstance.get("/users"),
//       ]);

//       const project = projectRes.data;
//       const allUsers = usersRes.data.data || usersRes.data;

//       // Build sales options from fresh user data
//       const userMap = new Map<string, string>();
//       allUsers.forEach((u: any) => {
//         if (["admin", "channel_partner"].includes(u.role?.toLowerCase())) {
//           userMap.set(u.id, `${u.name} (${u.role || "User"})`);
//         }
//       });

//       const salesIds = (project.sales || "")
//         .split(",")
//         .map((s: string) => s.trim())
//         .filter(Boolean);
//       const salesArray = salesIds.map((sid: string) => ({
//         value: sid,
//         label: userMap.get(sid) || `User ${sid}`,
//       }));

//       const loadedData: EditFormData = {
//         name: project.name || "",
//         description: project.description || "",
//         rera_project_id: project.rera_project_id || "",
//         sales: salesArray,
//         notify_to_emails: Array.isArray(project.notify_to_emails)
//           ? project.notify_to_emails.join(",")
//           : project.notify_to_emails || "",
//         launched_on: project.launched_on || null,
//         expected_completion: project.expected_completion || null,
//         possession: project.possession || null,
//         is_active: project.is_active ?? true,
//         inventory: project.inventory ?? false,
//         search_address: project.search_address || "",
//         address: project.address || "",
//         street: project.street || "",
//         country: project.country || "",
//         state: project.state || "",
//         city: project.city || "",
//         zip: project.zip || "",
//         locality: project.locality || "",
//         latitude: project.latitude || "",
//         longitude: project.longitude || "",
//         enable_vr: project.enable_vr ?? false,
//         vr_upload: null,
//         vr_upload_url: project.vr_upload_url || null,
//         amenities:
//           typeof project.amenities === "object" ? project.amenities : {},
//         specifications: project.specifications || [],
//         brochures: project.brochures || [],
//         price_quotes: project.price_quotes || [],
//         india_property_code: project.india_property_code || "",
//         magicbricks_code: project.magicbricks_code || "",
//         status: project.status || "draft",
//         created_by: project.created_by || "",
//         completed_steps: Array.isArray(project.completed_steps)
//           ? project.completed_steps
//           : [],
//         brochure_uploads: [] as File[],
//         brochure_upload_urls: project.brochure_upload_urls || [],
//       };

//       setFormData(loadedData);
//       setLastSavedStep(6);
//       setProjectId(id);
//     } catch (error: any) {
//       console.error("Failed to load project:", error);
//       toast({
//         title: "Error",
//         description: "Could not load project",
//         variant: "destructive",
//       });
//     }
//   };

//   const updateFormData = (newData: Partial<EditFormData>) => {
//     setFormData((prev) => ({
//       ...prev,
//       ...newData,
//       sales: newData.sales ?? prev.sales,
//       amenities: newData.amenities
//         ? { ...prev.amenities, ...newData.amenities }
//         : prev.amenities,
//       specifications: newData.specifications ?? prev.specifications,
//       brochures: newData.brochures ?? prev.brochures,
//       price_quotes: newData.price_quotes ?? prev.price_quotes,
//       brochure_upload_urls:
//         newData.brochure_upload_urls ?? prev.brochure_upload_urls,
//     }));
//   };

//   const saveStepData = async (step: number, data: Partial<EditFormData>) => {
//     if (!projectId) throw new Error("No project ID");

//     try {
//       const updated = { ...formData, ...data };
//       const hasFiles =
//         updated.vr_upload instanceof File ||
//         (updated.brochure_uploads?.length ?? 0) > 0;

//       let response;
//       if (hasFiles) {
//         const fd = new FormData();
//         if (updated.vr_upload instanceof File)
//           fd.append("vr_upload", updated.vr_upload);
//         updated.brochure_uploads?.forEach((f) =>
//           fd.append("brochure_uploads", f)
//         );

//         Object.keys(updated).forEach((k) => {
//           if (
//             !["vr_upload", "brochure_uploads", "brochure_upload_urls"].includes(
//               k
//             )
//           ) {
//             const v = updated[k as keyof EditFormData];
//             fd.append(
//               k,
//               v === null || v === undefined
//                 ? ""
//                 : typeof v === "object"
//                 ? JSON.stringify(v)
//                 : String(v)
//             );
//           }
//         });

//         response = await axiosInstance.put(`/projects/${projectId}`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       } else {
//         response = await axiosInstance.put(`/projects/${projectId}`, {
//           ...updated,
//           sales: updated.sales.map((s) => s.value).join(","),
//           completed_steps: Array.from(
//             new Set([...updated.completed_steps, step])
//           ),
//         });
//       }

//       updateFormData(updated);
//       setLastSavedStep(Math.max(step, lastSavedStep));
//       toast({ title: "Saved", description: "Changes saved" });
//       return response.data.id || projectId;
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.response?.data?.error || "Save failed",
//         variant: "destructive",
//       });
//       throw err;
//     }
//   };

//   return (
//     <EditFormContext.Provider
//       value={{
//         formData,
//         projectId,
//         setProjectId,
//         updateFormData,
//         saveStepData,
//         fetchInitialData,
//         lastSavedStep,
//         setLastSavedStep,
//         salesOptions,
//       }}
//     >
//       {children}
//     </EditFormContext.Provider>
//   );
// };

// export const useEditForm = () => {
//   const ctx = useContext(EditFormContext);
//   if (!ctx) throw new Error("useEditForm must be used within EditFormProvider");
//   return ctx;
// };

// Redux-backed edit form context (active implementation)

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateEditFormData,
  setEditFormData,
  setEditProjectId,
  setEditLastSavedStep,
  setEditSalesOptions,
  selectEditProjectForm,
} from "@/store/slices/editProjectFormSlice";
import type {
  EditProjectFormData,
  OptionType,
} from "@/store/types/editProjectForm";
import {
  buildProjectMultipartBody,
  projectFormHasFiles,
} from "@/utils/projectFormMultipart";
import {
  clearPendingProjectLogo,
  projectLogoKey,
} from "@/utils/projectPendingFiles";
import { sanitizeEditFormForRedux, buildStepApiPayload } from "@/utils/sanitizeProjectFormForRedux";

export type { OptionType };

export const EditFormContext = createContext<{
  formData: EditProjectFormData;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  updateFormData: (newData: Partial<EditProjectFormData>) => void;
  saveStepData: (
    step: number,
    data: Partial<EditProjectFormData>,
  ) => Promise<string | null>;
  fetchInitialData: (projectId: string) => Promise<void>;
  lastSavedStep: number;
  setLastSavedStep: (step: number) => void;
  salesOptions: OptionType[];
} | null>(null);

export const EditFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { formData, projectId, lastSavedStep, salesOptions } =
    useAppSelector(selectEditProjectForm);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/users");
      const users = res.data.data || res.data;
      if (Array.isArray(users)) {
        const options = users.map(
          (u: { id: string; name?: string; email?: string }) => ({
            value: u.id,
            label: u.name || u.email || u.id,
          }),
        );
        dispatch(setEditSalesOptions(options));
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchInitialData = async (id: string) => {
    try {
      const [projectRes, usersRes] = await Promise.all([
        axiosInstance.get(`/projects/${id}`),
        axiosInstance.get("/users"),
      ]);

      const project = projectRes.data;
      const allUsers = usersRes.data.data || usersRes.data;

      const userMap = new Map<string, string>();
      allUsers.forEach((u: { id: string; name: string; role?: string }) => {
        if (["admin", "channel_partner"].includes(u.role?.toLowerCase() ?? "")) {
          userMap.set(u.id, `${u.name} (${u.role || "User"})`);
        }
      });

      const salesIds = (project.sales || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const salesArray = salesIds.map((sid: string) => ({
        value: sid,
        label: userMap.get(sid) || `User ${sid}`,
      }));

      const loadedData: EditProjectFormData = {
        name: project.name || "",
        description: project.description || "",
        rera_project_id: project.rera_project_id || "",
        sales: salesArray,
        notify_to_emails: Array.isArray(project.notify_to_emails)
          ? project.notify_to_emails.join(",")
          : project.notify_to_emails || "",
        launched_on: project.launched_on || null,
        expected_completion: project.expected_completion || null,
        possession: project.possession || null,
        is_active: project.is_active ?? true,
        inventory: project.inventory ?? false,
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
        enable_vr: project.enable_vr ?? false,
        vr_upload: null,
        vr_upload_url: project.vr_upload_url || null,
        amenities:
          typeof project.amenities === "object" ? project.amenities : {},
        specifications: project.specifications || [],
        brochures: project.brochures || [],
        price_quotes: project.price_quotes || [],
        india_property_code: project.india_property_code || "",
        magicbricks_code: project.magicbricks_code || "",
        status: project.status || "draft",
        created_by: project.created_by || "",
        completed_steps: Array.isArray(project.completed_steps)
          ? project.completed_steps
          : [],
        brochure_uploads: [],
        brochure_upload_urls: project.brochure_upload_urls || [],
        project_logo_url: project.project_logo_url || null,
        gallery_images: project.gallery_images || [],
        gallery_videos: project.gallery_videos || [],
        gallery_video_groups: project.gallery_video_groups || [],
        gallery_image_uploads: [],
        gallery_image_categories: [],
        gallery_video_uploads: [],
        gallery_images_removed: [],
        gallery_videos_removed: [],
        gallery_video_urls: [],
        marketing_brochure_uploads: [],
        marketing_brochure_urls: project.marketing_brochure_urls || [],
        marketing_brochures_removed: [],
        rera_document_uploads: [],
        rera_document_urls: project.rera_document_urls || [],
        rera_documents_removed: [],
        portal_selection: project.portal_selection || "",
        portal_reference_key: project.portal_reference_key || "",
        portal_sync_status: project.portal_sync_status || "",
        office_address_line1: project.office_address_line1 || "",
        office_address_line2: project.office_address_line2 || "",
      };

      dispatch(setEditFormData(loadedData));
      dispatch(setEditLastSavedStep(6));
      dispatch(setEditProjectId(id));
    } catch (error: unknown) {
      console.error("Failed to load project:", error);
      // toast({
        // title: "Error",
        // description: "Could not load project",
        // variant: "destructive",
      // });
    }
  };

  const updateFormDataHandler = (newData: Partial<EditProjectFormData>) => {
    dispatch(updateEditFormData(newData));
  };

  const setProjectId = (id: string | null) => {
    dispatch(setEditProjectId(id));
  };

  const setLastSavedStep = (step: number) => {
    dispatch(setEditLastSavedStep(step));
  };

  const saveStepData = async (
    step: number,
    data: Partial<EditProjectFormData>,
  ) => {
    if (!projectId) throw new Error("No project ID");

    try {
      const updated = {
        ...formData,
        ...data,
        completed_steps: Array.from(
          new Set([...formData.completed_steps, step]),
        ),
      };
      const logoKey = projectLogoKey(projectId);
      const salesPayload = Array.isArray(updated.sales)
        ? updated.sales.map((s) => (typeof s === "string" ? s : s.value)).join(",")
        : String(updated.sales ?? "");

      const apiPayload = {
        ...buildStepApiPayload(step, updated as Record<string, unknown>),
        sales: salesPayload,
      };

      let response;
      if (projectFormHasFiles(updated as Record<string, unknown>, { logoKey })) {
        const fd = buildProjectMultipartBody(
          {
            ...buildStepApiPayload(step, updated as Record<string, unknown>, {
              forMultipart: true,
            }),
            sales: salesPayload,
          },
          { logoKey },
        );
        response = await axiosInstance.put(`/projects/${projectId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        clearPendingProjectLogo(logoKey);
      } else {
        response = await axiosInstance.put(`/projects/${projectId}`, apiPayload);
      }

      const responseProject = response.data?.data;
      const reduxPatch = sanitizeEditFormForRedux(updated);

      if (responseProject) {
        Object.assign(reduxPatch, {
          project_logo_url: responseProject.project_logo_url,
          gallery_images: responseProject.gallery_images,
          gallery_videos: responseProject.gallery_videos,
          gallery_video_groups: responseProject.gallery_video_groups,
          marketing_brochure_urls: responseProject.marketing_brochure_urls,
          rera_document_urls: responseProject.rera_document_urls,
          gallery_image_uploads: [],
          gallery_video_uploads: [],
          marketing_brochure_uploads: [],
          rera_document_uploads: [],
          gallery_images_removed: [],
          gallery_videos_removed: [],
          marketing_brochures_removed: [],
          rera_documents_removed: [],
          gallery_video_urls: [],
        });
      }

      dispatch(updateEditFormData(reduxPatch));
      dispatch(setEditLastSavedStep(Math.max(step, lastSavedStep)));
      // toast({ title: "Saved", description: "Changes saved successfully" });
      return response.data.id || projectId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      // toast({
        // title: "Error",
        // description: error.response?.data?.error || "Save failed",
        // variant: "destructive",
      // });
      throw err;
    }
  };

  return (
    <EditFormContext.Provider
      value={{
        formData,
        projectId,
        setProjectId,
        updateFormData: updateFormDataHandler,
        saveStepData,
        fetchInitialData,
        lastSavedStep,
        setLastSavedStep,
        salesOptions,
      }}
    >
      {children}
    </EditFormContext.Provider>
  );
};

export const useEditForm = () => {
  const ctx = useContext(EditFormContext);
  if (!ctx) throw new Error("useEditForm must be used within EditFormProvider");
  return ctx;
};
