// Reviews Hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertReview } from "@shared/types";

export function useReviews(courseId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => api.reviews.list(courseId!),
    enabled: !!courseId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ courseId, ...data }: InsertReview) =>
      api.reviews.create(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.courseId] });
      toast({ title: "Success", description: "Review submitted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, courseId, ...data }: { id: string; courseId: string } & Partial<InsertReview>) =>
      api.reviews.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.courseId] });
      toast({ title: "Success", description: "Review updated successfully" });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; courseId: string }) => api.reviews.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.courseId] });
      toast({ title: "Success", description: "Review deleted successfully" });
    },
  });
}
