import { useQuery } from '@tanstack/react-query';

interface VoiceChannel {
  id: string;
  name: string;
}

export function useVoiceChannels() {
  return useQuery({
    queryKey: ['voice-channels'],
    queryFn: async () => {
      const response = await fetch(`/api/guilds/_/channels`);
      if (!response.ok) {
        throw new Error('Failed to fetch voice channels');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch voice channels');
      }
      return data.channels as VoiceChannel[];
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
