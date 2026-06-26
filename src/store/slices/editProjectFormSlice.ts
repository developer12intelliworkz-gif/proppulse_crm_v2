import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EditProjectFormData,
  initialEditProjectFormData,
  OptionType,
} from "@/store/types/editProjectForm";

interface EditProjectFormState {
  formData: EditProjectFormData;
  projectId: string | null;
  lastSavedStep: number;
  salesOptions: OptionType[];
}

const initialState: EditProjectFormState = {
  formData: initialEditProjectFormData,
  projectId: null,
  lastSavedStep: 0,
  salesOptions: [],
};

const editProjectFormSlice = createSlice({
  name: "editProjectForm",
  initialState,
  reducers: {
    updateEditFormData(
      state,
      action: PayloadAction<Partial<EditProjectFormData>>,
    ) {
      const newData = action.payload;
      state.formData = {
        ...state.formData,
        ...newData,
        sales: newData.sales ?? state.formData.sales,
        amenities: newData.amenities
          ? { ...state.formData.amenities, ...newData.amenities }
          : state.formData.amenities,
        specifications: newData.specifications ?? state.formData.specifications,
        brochures: newData.brochures ?? state.formData.brochures,
        price_quotes: newData.price_quotes ?? state.formData.price_quotes,
        brochure_upload_urls:
          newData.brochure_upload_urls ?? state.formData.brochure_upload_urls,
        office_address_line1:
          newData.office_address_line1 ?? state.formData.office_address_line1,
        office_address_line2:
          newData.office_address_line2 ?? state.formData.office_address_line2,
      };
    },
    setEditFormData(state, action: PayloadAction<EditProjectFormData>) {
      state.formData = action.payload;
    },
    setEditProjectId(state, action: PayloadAction<string | null>) {
      state.projectId = action.payload;
    },
    setEditLastSavedStep(state, action: PayloadAction<number>) {
      state.lastSavedStep = action.payload;
    },
    setEditSalesOptions(state, action: PayloadAction<OptionType[]>) {
      state.salesOptions = action.payload;
    },
    resetEditProjectForm(state) {
      state.formData = initialEditProjectFormData;
      state.projectId = null;
      state.lastSavedStep = 0;
    },
  },
});

export const {
  updateEditFormData,
  setEditFormData,
  setEditProjectId,
  setEditLastSavedStep,
  setEditSalesOptions,
  resetEditProjectForm,
} = editProjectFormSlice.actions;

export const selectEditProjectForm = (state: {
  editProjectForm: EditProjectFormState;
}) => state.editProjectForm;

export default editProjectFormSlice.reducer;
