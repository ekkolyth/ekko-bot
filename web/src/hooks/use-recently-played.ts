import { useQuery } from '@tanstack/react-query';

export interface RecentlyPlayedTrack {
  url: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  added_by: string;
}

interface RecentlyPlayedResponse {
  voice_channel_id: string;
  tracks: RecentlyPlayedTrack[];
}

interface UseRecentlyPlayedOptions {
  enabled?: boolean;
}

export function useRecentlyPlayed(voiceChannelId: string | null, options?: UseRecentlyPlayedOptions) {
  return useQuery({
    queryKey: ['recently-played', voiceChannelId],
    enabled: Boolean(voiceChannelId) && (options?.enabled ?? true),
    staleTime: 30_000,
    queryFn: async (): Promise<RecentlyPlayedResponse> => {
      if (!voiceChannelId) {
        throw new Error('voiceChannelId is required');
      }

      const response = await fetch(
        `/api/recent?voice_channel_id=${encodeURIComponent(voiceChannelId)}`
      );
      const payload = (await response.json().catch(() => null)) as
        | RecentlyPlayedResponse
        | { error?: string }
        | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.error || 'Failed to load recently played tracks');
      }

      const data = payload as RecentlyPlayedResponse;
      if (!Array.isArray(data.tracks)) {
        data.tracks = [];
      }
      return data;
    },
  });
}

