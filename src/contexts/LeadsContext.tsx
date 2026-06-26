import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { store } from "@/store";
import {
  fetchLeads as fetchLeadsThunk,
  setFilteredLeads,
  selectLeadsState,
  updateLeadStatus,
} from "@/store/slices/leadsSlice";
import type { LocalLead } from "@/store/types/leads";

export type { LocalLead };

/** Leads state lives in Redux; this provider preserves the existing API. */
export const LeadsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export const useLeads = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const leadsState = useAppSelector(selectLeadsState);

  const fetchLeads = useCallback(
    async (
      forceFetch = false,
      filterText = "",
      selectedLeadType = "all",
    ) => {
      const result = await dispatch(
        fetchLeadsThunk({ forceFetch, filterText, selectedLeadType }),
      );

      if (fetchLeadsThunk.rejected.match(result)) {
        const payload = result.payload as
          | { code?: string; message?: string }
          | undefined;
        if (payload?.message) {
          // toast({
            // title: "Error",
            // description: payload.message,
            // variant: "destructive",
          // });
        }
        if (payload?.code === "SESSION_EXPIRED" || payload?.code === "AUTH") {
          navigate("/login", { replace: true });
        }
      }
    },
    [dispatch, navigate, toast],
  );

  const setFilteredLeadsFn = useCallback(
    (value: React.SetStateAction<LocalLead[]>) => {
      if (typeof value === "function") {
        const current = selectLeadsState(store.getState()).filteredLeads;
        dispatch(setFilteredLeads(value(current)));
      } else {
        dispatch(setFilteredLeads(value));
      }
    },
    [dispatch],
  );

  const updateLeadStatusFn = useCallback(
    (id: number, status: string) => {
      dispatch(updateLeadStatus({ id, status }));
    },
    [dispatch],
  );

  return {
    leads: leadsState.leads,
    filteredLeads: leadsState.filteredLeads,
    fetchLeads,
    setFilteredLeads: setFilteredLeadsFn,
    updateLeadStatus: updateLeadStatusFn,
    isLoading: leadsState.isLoading,
    error: leadsState.error,
  };
};
