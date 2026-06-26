import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ProjectFormData,
  initialProjectFormData,
  OptionType,
} from "@/store/types/projectForm";

interface ProjectFormState {
  formData: ProjectFormData;
  projectId: string | null;
  lastSavedStep: number;
  salesOptions: OptionType[];
}

const initialState: ProjectFormState = {
  formData: initialProjectFormData,
  projectId: null,
  lastSavedStep: 0,
  salesOptions: [],
};

const projectFormSlice = createSlice({
  name: "projectForm",
  initialState,
  reducers: {
    updateFormData(state, action: PayloadAction<Partial<ProjectFormData>>) {
      state.formData = { ...state.formData, ...action.payload };
    },
    setFormData(state, action: PayloadAction<ProjectFormData>) {
      state.formData = action.payload;
    },
    setProjectId(state, action: PayloadAction<string | null>) {
      state.projectId = action.payload;
    },
    setLastSavedStep(state, action: PayloadAction<number>) {
      state.lastSavedStep = action.payload;
    },
    setSalesOptions(state, action: PayloadAction<OptionType[]>) {
      state.salesOptions = action.payload;
    },
    resetProjectForm(state) {
      state.formData = initialProjectFormData;
      state.projectId = null;
      state.lastSavedStep = 0;
    },
  },
});

export const {
  updateFormData,
  setFormData,
  setProjectId,
  setLastSavedStep,
  setSalesOptions,
  resetProjectForm,
} = projectFormSlice.actions;

export const selectProjectForm = (state: { projectForm: ProjectFormState }) =>
  state.projectForm;

export default projectFormSlice.reducer;
