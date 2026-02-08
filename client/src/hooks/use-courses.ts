import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertCourse, Course } from "@shared/types";

export function useCourses(params?: { search?: string; instructorId?: string; published?: boolean }) {
  const queryKey = params ? ['courses', params] : ['courses'];
  
  return useQuery({
    queryKey,
    queryFn: () => api.courses.list(params),
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertCourse) => api.courses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InsertCourse>) => 
      api.courses.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
      toast({ title: "Success", description: "Course updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => 
      api.courses.publish(id, published),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
      toast({ 
        title: "Success", 
        description: `Course ${data.published ? 'published' : 'unpublished'} successfully` 
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.courses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: "Success", description: "Course deleted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useCourseEnrollments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: () => api.courses.getEnrollments(courseId!),
    enabled: !!courseId,
  });
}
