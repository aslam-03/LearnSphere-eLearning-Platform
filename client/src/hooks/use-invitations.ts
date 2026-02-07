// Invitations Hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useInvitations(courseId: string | undefined) {
  return useQuery({
    queryKey: ['invitations', courseId],
    queryFn: () => api.invitations.list(courseId!),
    enabled: !!courseId,
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ courseId, email }: { courseId: string; email: string }) =>
      api.invitations.send(courseId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', variables.courseId] });
      toast({ title: "Success", description: "Invitation sent successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
