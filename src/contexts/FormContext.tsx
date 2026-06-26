// import {
//   createContext,
//   useState,
//   useCallback,
//   useEffect,
//   ReactNode,
// } from "react";
// import { useToast } from "@/components/ui/use-toast";
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

// interface FormData {
//   name: string;
//   description: string;
//   rera_project_id: string;
//   sales: string;
//   notify_to_emails: string;
//   launched_on: string;
//   expected_completion: string;
//   possession: string;
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
//   vr_upload: File | null;
//   vr_upload_url: string | null;
//   amenities: { [key: string]: boolean };
//   specifications: Specification[];
//   brochures: Brochure[];
//   price_quotes: PriceQuote[];
//   india_property_code: string;
//   magicbricks_code: string;
//   status: string;
//   created_by: string;
//   completed_steps: number[];
//   brochure_uploads: File[]; // New: actual uploaded files
//   brochure_upload_urls: string[];
// }

// interface FormContextType {
//   formData: FormData;
//   projectId: string | null;
//   updateFormData: (newData: Partial<FormData>) => void;
//   resetForm: () => void;
//   saveStepData: (
//     step: number,
//     data: Partial<FormData>,
//     isFinal?: boolean
//   ) => Promise<string | null>;
//   lastSavedStep: number;
//   setLastSavedStep: (step: number) => void;
//   salesOptions: OptionType[];
// }

// interface User {
//   id: string;
//   name: string;
//   role?: string;
// }

// const initialFormData: FormData = {
//   name: "",
//   description: "",
//   rera_project_id: "",
//   sales: "",
//   notify_to_emails: "",
//   launched_on: "",
//   expected_completion: "",
//   possession: "",
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

// export const FormContext = createContext<FormContextType>({
//   formData: initialFormData,
//   projectId: null,
//   updateFormData: () => {},
//   resetForm: () => {},
//   saveStepData: async () => null,
//   lastSavedStep: 0,
//   setLastSavedStep: () => {},
//   salesOptions: [],
// });

// export const FormProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const { toast } = useToast();
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [projectId, setProjectId] = useState<string | null>(null);
//   const [lastSavedStep, setLastSavedStep] = useState(0);
//   const [salesOptions, setSalesOptions] = useState<OptionType[]>([]);

//   const getCurrentUserId = (): string => {
//     return "1c46541d-18ed-40fa-ad80-6c900111e816"; // Placeholder UUID
//   };

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
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch users.",
//         variant: "destructive",
//       });
//     }
//   }, [toast]);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   const updateFormData = (newData: Partial<FormData>) => {
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

//   // const saveStepData = async (
//   //   step: number,
//   //   data: Partial<FormData>,
//   //   isFinal: boolean = false
//   // ): Promise<string | null> => {
//   //   try {
//   //     // Merge formData with step-specific data
//   //     const updatedData = {
//   //       ...formData,
//   //       ...data,
//   //       status: isFinal ? "completed" : "draft",
//   //       completed_steps: Array.from(
//   //         new Set([...(formData.completed_steps || []), step])
//   //       ),
//   //     };

//   //     // Ensure notify_to_emails and sales are strings
//   //     updatedData.notify_to_emails = updatedData.notify_to_emails || "";
//   //     updatedData.sales = updatedData.sales || "";

//   //     // Set created_by for new projects
//   //     if (!projectId) {
//   //       updatedData.created_by = getCurrentUserId();
//   //     }

//   //     const url = `/projects${projectId ? `/${projectId}` : ""}`;
//   //     const method = projectId ? "put" : "post";
//   //     // console.log(`Initial formData before merge:`, formData);
//   //     // console.log(`Step data:`, data);
//   //     // console.log(`Merged updatedData before request:`, updatedData);

//   //     let response;
//   //     if (updatedData.vr_upload instanceof File) {
//   //       const formDataToSend = new FormData();
//   //       formDataToSend.append("vr_upload", updatedData.vr_upload);
//   //       Object.keys(updatedData).forEach((key) => {
//   //         if (key !== "vr_upload" && key !== "vr_upload_url") {
//   //           const value = updatedData[key];
//   //           if ((key === "notify_to_emails" || key === "sales") && !value) {
//   //             formDataToSend.append(key, "");
//   //             return;
//   //           }
//   //           if (value === null || value === undefined) {
//   //             formDataToSend.append(key, "");
//   //           } else if (Array.isArray(value) || typeof value === "object") {
//   //             formDataToSend.append(key, JSON.stringify(value));
//   //           } else {
//   //             formDataToSend.append(key, value.toString());
//   //           }
//   //         }
//   //       });
//   //       // console.log("FormData Contents:", Object.fromEntries(formDataToSend));
//   //       response = await axiosInstance({
//   //         method,
//   //         url,
//   //         data: formDataToSend,
//   //         headers: { "Content-Type": "multipart/form-data" },
//   //       });
//   //     } else {
//   //       // Ensure notify_to_emails and sales are strings in JSON payload
//   //       updatedData.notify_to_emails = updatedData.notify_to_emails || "";
//   //       updatedData.sales = updatedData.sales || "";
//   //       // console.log("JSON Payload:", updatedData);
//   //       response = await axiosInstance({
//   //         method,
//   //         url,
//   //         data: updatedData,
//   //       });
//   //     }

//   //     const result = response.data;
//   //     if (!projectId && result.id) {
//   //       setProjectId(result.id);
//   //     }
//   //     updateFormData(updatedData);
//   //     setLastSavedStep(step);
//   //     toast({
//   //       title: "Success",
//   //       description: isFinal
//   //         ? "Project stored successfully"
//   //         : `Step ${step} saved successfully`,
//   //     });
//   //     return result.id || null;
//   //   } catch (error: any) {
//   //     console.error(
//   //       "Error saving step data:",
//   //       error.response?.data || error.message
//   //     );
//   //     const message =
//   //       error.response?.data?.error || `Failed to save step ${step} data`;
//   //     toast({
//   //       title: "Error",
//   //       description: message,
//   //       variant: "destructive",
//   //     });
//   //     throw new Error(message);
//   //   }
//   // };

//   const saveStepData = async (
//     step: number,
//     data: Partial<FormData>,
//     isFinal: boolean = false
//   ): Promise<string | null> => {
//     try {
//       const updatedData = {
//         ...formData,
//         ...data,
//         status: isFinal ? "completed" : "draft",
//         completed_steps: Array.from(
//           new Set([...(formData.completed_steps || []), step])
//         ),
//       };

//       if (!projectId) {
//         updatedData.created_by = getCurrentUserId();
//       }

//       const url = `/projects${projectId ? `/${projectId}` : ""}`;
//       const method = projectId ? "put" : "post";

//       // Check for any file uploads
//       const hasVrFile = updatedData.vr_upload instanceof File;
//       const hasBrochureFiles =
//         updatedData.brochure_uploads && updatedData.brochure_uploads.length > 0;

//       if (hasVrFile || hasBrochureFiles) {
//         const formDataToSend = new FormData();

//         // VR File
//         if (hasVrFile) {
//           formDataToSend.append("vr_upload", updatedData.vr_upload!);
//         }

//         // Brochure Files (multiple)
//         if (hasBrochureFiles) {
//           updatedData.brochure_uploads!.forEach((file: File) => {
//             formDataToSend.append("brochure_uploads", file);
//           });
//         }

//         // All other fields (except files)
//         Object.keys(updatedData).forEach((key) => {
//           if (
//             key !== "vr_upload" &&
//             key !== "brochure_uploads" &&
//             key !== "brochure_upload_urls"
//           ) {
//             const value = updatedData[key];
//             if (value === null || value === undefined) {
//               formDataToSend.append(key, "");
//             } else if (Array.isArray(value) || typeof value === "object") {
//               formDataToSend.append(key, JSON.stringify(value));
//             } else {
//               formDataToSend.append(key, String(value));
//             }
//           }
//         });

//         const response = await axiosInstance({
//           method,
//           url,
//           data: formDataToSend,
//           headers: { "Content-Type": "multipart/form-data" },
//         });

//         const result = response.data;
//         if (!projectId && result.id) {
//           setProjectId(result.id);
//         }

//         updateFormData(updatedData);
//         setLastSavedStep(step);

//         toast({
//           title: "Success",
//           description: `Step ${step} saved successfully`,
//         });

//         return result.id || null;
//       } else {
//         // No files → send as JSON
//         const response = await axiosInstance({
//           method,
//           url,
//           data: updatedData,
//         });

//         const result = response.data;
//         if (!projectId && result.id) {
//           setProjectId(result.id);
//         }

//         updateFormData(updatedData);
//         setLastSavedStep(step);

//         toast({
//           title: "Success",
//           description: `Step ${step} saved successfully`,
//         });

//         return result.id || null;
//       }
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

//   return (
//     <FormContext.Provider
//       value={{
//         formData,
//         projectId,
//         updateFormData,
//         resetForm,
//         saveStepData,
//         lastSavedStep,
//         setLastSavedStep,
//         salesOptions,
//       }}
//     >
//       {children}
//     </FormContext.Provider>
//   );
// };

// src/contexts/FormContext.tsx — Redux-backed; FormContext kept for useContext() consumers.

import {
  createContext,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateFormData as updateFormDataAction,
  setProjectId as setProjectIdAction,
  setLastSavedStep as setLastSavedStepAction,
  setSalesOptions,
  resetProjectForm,
  selectProjectForm,
} from "@/store/slices/projectFormSlice";
import {
  initialProjectFormData,
  type ProjectFormData,
  type OptionType,
} from "@/store/types/projectForm";
import {
  buildProjectMultipartBody,
  projectFormHasFiles,
} from "@/utils/projectFormMultipart";
import {
  clearPendingProjectLogo,
  projectLogoKey,
} from "@/utils/projectPendingFiles";
import { sanitizeProjectFormForRedux, buildStepApiPayload } from "@/utils/sanitizeProjectFormForRedux";
import { useAuth } from "./AuthContext";

export type { OptionType };
export type FormData = ProjectFormData;

interface FormContextType {
  formData: FormData;
  projectId: string | null;
  updateFormData: (newData: Partial<FormData>) => void;
  resetForm: () => void;
  saveStepData: (
    step: number,
    data: Partial<FormData>,
    isFinal?: boolean,
  ) => Promise<string | null>;
  lastSavedStep: number;
  setLastSavedStep: (step: number) => void;
  salesOptions: OptionType[];
}

export const FormContext = createContext<FormContextType>({
  formData: initialProjectFormData,
  projectId: null,
  updateFormData: () => {},
  resetForm: () => {},
  saveStepData: async () => null,
  lastSavedStep: 0,
  setLastSavedStep: () => {},
  salesOptions: [],
});

export const FormProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { formData, projectId, lastSavedStep, salesOptions } =
    useAppSelector(selectProjectForm);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/users");
      const userData = response.data.data || response.data;
      if (Array.isArray(userData)) {
        const options = userData.map(
          (u: { id: string; name?: string; email?: string }) => ({
            value: u.id,
            label: u.name || u.email || u.id,
          }),
        );
        dispatch(setSalesOptions(options));
      }
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFormData = (newData: Partial<FormData>) => {
    dispatch(updateFormDataAction(newData));
  };

  const resetForm = () => {
    dispatch(resetProjectForm());
  };

  const setLastSavedStep = (step: number) => {
    dispatch(setLastSavedStepAction(step));
  };

  const saveStepData = async (
    step: number,
    data: Partial<FormData>,
    isFinal = false,
  ): Promise<string | null> => {
    try {
      const updatedData: FormData = {
        ...formData,
        ...data,
        status: isFinal ? "completed" : "draft",
        completed_steps: Array.from(
          new Set([...(formData.completed_steps || []), step]),
        ),
      };

      if (!projectId) {
        updatedData.created_by =
          user?.id ||
          (typeof data.created_by === "string" ? data.created_by : "") ||
          updatedData.created_by ||
          "";
      }

      const url = `/projects${projectId ? `/${projectId}` : ""}`;
      const method = projectId ? "put" : "post";

      const logoKey = projectLogoKey(projectId);
      let result: { id?: string; data?: ProjectFormData };

      const apiPayload = buildStepApiPayload(
        step,
        updatedData as Record<string, unknown>,
      );

      if (projectFormHasFiles(updatedData as Record<string, unknown>, { logoKey })) {
        const formDataToSend = buildProjectMultipartBody(
          buildStepApiPayload(step, updatedData as Record<string, unknown>, {
            forMultipart: true,
          }),
          { logoKey },
        );
        const response = await axiosInstance({
          method,
          url,
          data: formDataToSend,
          headers: { "Content-Type": "multipart/form-data" },
        });
        result = response.data;
        clearPendingProjectLogo(logoKey);
      } else {
        const response = await axiosInstance({
          method,
          url,
          data: apiPayload,
        });
        result = response.data;
      }

      const responseProject = result.data;
      const reduxPatch: Partial<ProjectFormData> = sanitizeProjectFormForRedux(updatedData);

      if (responseProject) {
        Object.assign(reduxPatch, {
          project_logo_url: responseProject.project_logo_url ?? updatedData.project_logo_url,
          gallery_images: responseProject.gallery_images ?? updatedData.gallery_images,
          gallery_videos: responseProject.gallery_videos ?? updatedData.gallery_videos,
          gallery_video_groups:
            responseProject.gallery_video_groups ??
            updatedData.gallery_video_groups,
          marketing_brochure_urls:
            responseProject.marketing_brochure_urls ?? updatedData.marketing_brochure_urls,
          rera_document_urls:
            responseProject.rera_document_urls ?? updatedData.rera_document_urls,
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

      if (!projectId && result.id) {
        dispatch(setProjectIdAction(result.id));
      }
      dispatch(updateFormDataAction(reduxPatch));
      dispatch(setLastSavedStepAction(step));

      // toast({
        // title: "Success",
        // description: `Step ${step} saved successfully`,
      // });

      return result.id || projectId || null;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Save error:", err.response?.data || error);
      // toast({
        // title: "Error",
        // description: err.response?.data?.error || "Failed to save",
        // variant: "destructive",
      // });
      throw error;
    }
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        projectId,
        updateFormData,
        resetForm,
        saveStepData,
        lastSavedStep,
        setLastSavedStep,
        salesOptions,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
