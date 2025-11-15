import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CustomCommand {
  id: string;
  name: string;
  response: string;
  created_at: string;
}

interface CreateCommandPayload {
  name: string;
  response: string;
}

async function fetchCommands() {
  const response = await fetch('/api/commands');
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.detail || data?.error || 'Failed to load commands';
    throw new Error(message);
  }

  return (data ?? []) as CustomCommand[];
}

export function useCommands() {
  return useQuery({
    queryKey: ['commands'],
    queryFn: fetchCommands,
    staleTime: 30_000,
  });
}

export function useCreateCommand() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCommandPayload) => {
      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message || data?.detail || data?.error || 'Failed to save command';
        throw new Error(message);
      }

      return data as CustomCommand;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}


