import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import { LocalLead, mapApiLeadToLocalLead } from "@/store/types/leads";
import { sortLeadsByNewestFirst } from "@/utils/sortLeads";
import { logout } from "@/store/slices/authSlice";
import type { User } from "@/store/types/auth";

export interface FetchLeadsArgs {
  forceFetch?: boolean;
  filterText?: string;
  selectedLeadType?: string;
}

interface LeadsState {
  leads: LocalLead[];
  filteredLeads: LocalLead[];
  isLoading: boolean;
  error: string | null;
  skipNextFetch: boolean;
}

const initialState: LeadsState = {
  leads: [],
  filteredLeads: [],
  isLoading: false,
  error: null,
  skipNextFetch: false,
};

function applyFilters(
  allLeads: LocalLead[],
  filterText: string,
  selectedLeadType: string,
): LocalLead[] {
  let filtered = allLeads;
  if (selectedLeadType !== "all") {
    filtered = filtered.filter((lead) => lead.lead_type === selectedLeadType);
  }
  if (filterText) {
    const q = filterText.toLowerCase();
    filtered = filtered.filter(
      (lead) =>
        lead.name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.assigned_to_name?.toLowerCase().includes(q),
    );
  }
  return filtered;
}

export const fetchLeads = createAsyncThunk(
  "leads/fetchLeads",
  async (
    {
      forceFetch = false,
      filterText = "",
      selectedLeadType = "all",
    }: FetchLeadsArgs,
    { getState, rejectWithValue, dispatch },
  ) => {
    const state = getState() as {
      auth: { token: string | null; user: User | null };
      leads: LeadsState;
    };
    const { token, user } = state.auth;

    if (!token || !user) {
      return rejectWithValue({ code: "AUTH", message: "Please log in." });
    }

    if (state.leads.leads.length > 0 && !forceFetch) {
      return {
        skipped: true as const,
        leads: state.leads.leads,
        filteredLeads: applyFilters(
          state.leads.leads,
          filterText,
          selectedLeadType,
        ),
      };
    }

    try {
      let allFetchedLeads: LocalLead[] = [];

      if (user.role?.toLowerCase() === "admin") {
        let page = 1;
        const limit = 1000;
        while (true) {
          const params: Record<string, string | number> = { page, limit };
          if (filterText) params.search = filterText;
          if (selectedLeadType !== "all") params.lead_type = selectedLeadType;

          const response = await axiosInstance.get("/leads", { params });
          const { data } = response.data;
          const mapped = (data || []).map((row: Record<string, unknown>) =>
            mapApiLeadToLocalLead(row),
          );
          allFetchedLeads = [...allFetchedLeads, ...mapped];
          if (!data || data.length < limit) break;
          page += 1;
        }
      } else {
        const response = await axiosInstance.get(
          `leads/user/${user.id}/projects-leads`,
        );
        const data = response.data || {};
        allFetchedLeads = Array.isArray(data.leads)
          ? data.leads.map((row: Record<string, unknown>) =>
              mapApiLeadToLocalLead(row),
            )
          : [];
      }

      const sortedLeads = sortLeadsByNewestFirst(allFetchedLeads);
      const filtered = applyFilters(
        sortedLeads,
        filterText,
        selectedLeadType,
      );

      return {
        skipped: false as const,
        leads: sortedLeads,
        filteredLeads: sortLeadsByNewestFirst(filtered),
      };
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { details?: string; error?: string; message?: string };
        };
        message?: string;
      };
      const message =
        err.response?.data?.details ||
        err.message ||
        "Failed to fetch leads";
      const status = err.response?.status;
      const authMessage =
        err.response?.data?.error ?? err.response?.data?.message ?? "";
      const isTokenError =
        status === 401 ||
        (status === 403 &&
          /invalid|expired|token|unauthorized/i.test(String(authMessage)));

      if (isTokenError) {
        dispatch(logout());
        return rejectWithValue({
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please sign in again.",
        });
      }

      return rejectWithValue({ code: "ERROR", message: `Failed to fetch leads: ${message}` });
    }
  },
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setFilteredLeads(state, action: PayloadAction<LocalLead[]>) {
      state.filteredLeads = action.payload;
    },
    updateLeadStatus(state, action: PayloadAction<{ id: number; status: string }>) {
      const { id, status } = action.payload;
      state.leads = state.leads.map((l) =>
        l.id === id ? { ...l, status } : l
      );
      state.filteredLeads = state.filteredLeads.map((l) =>
        l.id === id ? { ...l, status } : l
      );
    },
    clearLeads(state) {
      state.leads = [];
      state.filteredLeads = [];
      state.error = null;
      state.skipNextFetch = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!action.payload.skipped) {
          state.leads = action.payload.leads;
        }
        state.filteredLeads = action.payload.filteredLeads;
        state.error = null;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as
          | { code?: string; message?: string }
          | undefined;
        state.error = payload?.message || "Failed to fetch leads";
      })
      .addCase(logout, (state) => {
        state.leads = [];
        state.filteredLeads = [];
        state.error = null;
      });
  },
});

export const { setFilteredLeads, clearLeads, updateLeadStatus } = leadsSlice.actions;
export const selectLeadsState = (state: { leads: LeadsState }) => state.leads;

export default leadsSlice.reducer;
