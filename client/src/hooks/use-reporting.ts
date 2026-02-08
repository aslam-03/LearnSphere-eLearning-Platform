// Reporting Hook
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useReportingOverview() {
  return useQuery({
    queryKey: ['reporting-overview'],
    queryFn: () => api.reporting.getOverview(),
  });
}

export function useReportingDetails(courseId?: string) {
  return useQuery({
    queryKey: ['reporting-details', courseId],
    queryFn: () => api.reporting.getDetails(courseId),
  });
}
