import { useQuery } from '@tanstack/react-query';

interface VoiceChannel {
  id: string;
  name: string;
}

export function useVoiceChannels(guildId: string | null) {
  return useQuery({
    queryKey: ['voice-channels', guildId],
    queryFn: async () => {
      if (!guildId) return [];

      const response = await fetch(`/api/guilds/${guildId}/channels`);
      if (!response.ok) {
        throw new Error('Failed to fetch voice channels');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch voice channels');
      }
      return data.channels as VoiceChannel[];
    },
    enabled: !!guildId, // Only run if guildId is provided
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
