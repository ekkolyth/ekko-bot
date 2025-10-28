import { useQuery } from '@tanstack/react-query';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export function useGuilds() {
  return useQuery({
    queryKey: ['guilds'],
    queryFn: async () => {
      const response = await fetch('/api/guilds');
      if (!response.ok) {
        throw new Error('Failed to fetch guilds');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch guilds');
      }
      return data.guilds as Guild[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
