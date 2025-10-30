import { useQuery } from '@tanstack/react-query';

export interface QueueTrack {
  position: number;
  url: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  added_by: string;
  added_by_id: string;
}

export interface QueueData {
  voice_channel_id: string;
  tracks: QueueTrack[];
  is_playing: boolean;
  is_paused: boolean;
  volume: number;
}

export function useQueue(voiceChannelId: string | null) {
  return useQuery({
    queryKey: ['queue', voiceChannelId],
    queryFn: async () => {
      if (!voiceChannelId) {
        return null;
      }

      const response = await fetch(`/api/queue?voice_channel_id=${voiceChannelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      const data = await response.json();
      return data as QueueData;
    },
    enabled: !!voiceChannelId,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
    staleTime: 1000,
    retry: 1, // Only retry once to avoid excessive requests
  });
}

