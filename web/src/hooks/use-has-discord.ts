import { useQuery } from '@tanstack/react-query';

export function useHasDiscord() {
  return useQuery({
    queryKey: ['has-discord'],
    queryFn: async () => {
      const response = await fetch('/api/auth/has-discord');
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.hasDiscord as boolean;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry on failure
  });
}
