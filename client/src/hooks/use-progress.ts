import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => api.progress.getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, completed, courseId }: { lessonId: string; completed: boolean; courseId: string }) =>
      api.progress.updateLessonProgress(lessonId, completed),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
