// Gamification Hook
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.gamification.getBadges(),
    staleTime: Infinity, // Badges don't change
  });
}

export function useUserBadge(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-badge', userId],
    queryFn: () => api.gamification.getUserBadge(userId!),
    enabled: !!userId,
  });
}
