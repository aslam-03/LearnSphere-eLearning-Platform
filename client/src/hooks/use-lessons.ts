import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertLesson } from "@shared/types";

export function useLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => api.lessons.list(courseId!),
    enabled: !!courseId,
  });
}

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.lessons.get(lessonId!),
    enabled: !!lessonId,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ courseId, ...data }: InsertLesson & { courseId: string }) => 
      api.lessons.create(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.courseId] });
      toast({ title: "Success", description: "Lesson added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, courseId, ...data }: { id: string; courseId: string } & Partial<InsertLesson>) => 
      api.lessons.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.id] });
      toast({ title: "Success", description: "Lesson updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; courseId: string }) => api.lessons.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.courseId] });
      toast({ title: "Success", description: "Lesson deleted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, lessonOrders }: { courseId: string; lessonOrders: { id: string; order: number }[] }) =>
      api.lessons.reorder(courseId, lessonOrders),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.courseId] });
    },
  });
}

export function useAddAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ lessonId, ...data }: { lessonId: string; type: 'file' | 'link'; name: string; url: string }) =>
      api.lessons.addAttachment(lessonId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
      toast({ title: "Success", description: "Attachment added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ attachmentId }: { attachmentId: string; lessonId: string }) =>
      api.lessons.deleteAttachment(attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
      toast({ title: "Success", description: "Attachment removed successfully" });
    },
  });
}
