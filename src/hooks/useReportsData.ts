// src/hooks/useReportsData.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance"; // ← Your authenticated instance

export type DateRange = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type ChartDataPoint = {
  name: string;
  value: number;
};

export type TableRow = {
  id: string;
  name: string;
  count: number;
  converted: number;
  conversionRate: number;
  bookingValue?: number;
};

export type ReportResponse = {
  chartData: ChartDataPoint[];
  tableData: TableRow[];
};

export const useReportsData = (
  endpoint: "by-source" | "by-project" | "by-agent" | "by-status" | "by-city",
  dateRange: DateRange,
  enabled: boolean = true
) => {
  return useQuery<ReportResponse>({
    queryKey: ["reports", endpoint, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await axiosInstance.get<ReportResponse>(
        `/reports/${endpoint}`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        }
      );
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
