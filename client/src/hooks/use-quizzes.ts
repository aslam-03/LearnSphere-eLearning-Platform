// Quizzes Hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertQuiz, InsertQuestion } from "@shared/types";

export function useQuizzes(courseId: string | undefined) {
  return useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => api.quizzes.list(courseId!),
    enabled: !!courseId,
  });
}

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.quizzes.get(quizId!),
    enabled: !!quizId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ courseId, ...data }: InsertQuiz & { courseId: string }) => 
      api.quizzes.create(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast({ title: "Success", description: "Quiz created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, courseId, ...data }: { id: string; courseId?: string } & Partial<InsertQuiz>) =>
      api.quizzes.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.id] });
      if (variables.courseId) {
        queryClient.invalidateQueries({ queryKey: ['quizzes', variables.courseId] });
      }
      toast({ title: "Success", description: "Quiz updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; courseId: string }) => api.quizzes.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast({ title: "Success", description: "Quiz deleted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

// Question Mutations
export function useAddQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ quizId, ...data }: InsertQuestion & { quizId: string }) =>
      api.quizzes.addQuestion(quizId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      toast({ title: "Success", description: "Question added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quizId, ...data }: { id: string; quizId: string } & Partial<InsertQuestion>) =>
      api.quizzes.updateQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; quizId: string }) => api.quizzes.deleteQuestion(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
  });
}

// Quiz Attempts
export function useQuizAttempts(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: () => api.quizzes.getAttempts(quizId!),
    enabled: !!quizId,
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: { questionId: string; selectedOption: number }[] }) =>
      api.quizzes.submitAttempt(quizId, answers),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Points may have changed
      toast({ 
        title: "Quiz Completed!", 
        description: `You earned ${data.pointsEarned} points!` 
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
