import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface WelcomeConfig {
  channel_id: string | null;
  message: string | null;
}

interface SaveWelcomeConfigPayload {
  channel_id: string;
  message: string;
}

async function fetchWelcomeConfig() {
  const response = await fetch('/api/welcome-config');
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.detail || data?.error || 'Failed to load welcome config';
    throw new Error(message);
  }

  return (data ?? { channel_id: null, message: null }) as WelcomeConfig;
}

export function useWelcomeConfig() {
  return useQuery({
    queryKey: ['welcome-config'],
    queryFn: fetchWelcomeConfig,
    staleTime: 0,
  });
}

export function useSaveWelcomeConfig() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveWelcomeConfigPayload) => {
      const response = await fetch('/api/welcome-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.detail || data?.error || 'Failed to save welcome config';
        throw new Error(message);
      }

      return data as WelcomeConfig;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['welcome-config'] });
    },
  });
}

