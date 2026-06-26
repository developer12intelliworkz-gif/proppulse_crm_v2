import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import leadsReducer from "@/store/slices/leadsSlice";
import socketReducer from "@/store/slices/socketSlice";
import projectFormReducer from "@/store/slices/projectFormSlice";
import editProjectFormReducer from "@/store/slices/editProjectFormSlice";
import inventoryReducer from "@/store/slices/inventorySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    socket: socketReducer,
    projectForm: projectFormReducer,
    editProjectForm: editProjectFormReducer,
    inventory: inventoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "projectForm/updateFormData",
          "editProjectForm/updateEditFormData",
          "projectForm/setFormData",
          "editProjectForm/setEditFormData",
        ],
        ignoredPaths: [
          "projectForm.formData.vr_upload",
          "projectForm.formData.brochure_uploads",
          "editProjectForm.formData.vr_upload",
          "editProjectForm.formData.brochure_uploads",
          "inventory.towers",
          "inventory.units",
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
