import { useQuery } from '@tanstack/react-query';

export interface DiscordTextChannel {
  id: string;
  name: string;
}

async function fetchTextChannels() {
  const response = await fetch('/api/guilds/channels?type=text');
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.detail || data?.error || 'Failed to load channels';
    throw new Error(message);
  }

  return (data?.channels ?? []) as DiscordTextChannel[];
}

export function useTextChannels() {
  return useQuery({
    queryKey: ['text-channels'],
    queryFn: fetchTextChannels,
    staleTime: 60_000,
  });
}

