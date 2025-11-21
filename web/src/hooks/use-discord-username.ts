import { useQuery } from '@tanstack/react-query';

export function useDiscordUsername() {
  return useQuery({
    queryKey: ['discord-username'],
    queryFn: async () => {
      const response = await fetch('/api/identity');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.discordTag as string | null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });
}

