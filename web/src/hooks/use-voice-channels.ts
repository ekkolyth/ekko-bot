import { useQuery } from '@tanstack/react-query';

interface VoiceChannel {
  id: string;
  name: string;
}

export function useVoiceChannels() {
  return useQuery({
    queryKey: ['voice-channel-current'],
    queryFn: async () => {
      const response = await fetch(`/api/guilds/current/voice`);
      if (!response.ok) {
        throw new Error('Failed to detect current voice channel');
      }
      const data = await response.json();
      return (data.channel ?? null) as VoiceChannel | null;
    },
    staleTime: 0,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });
}
