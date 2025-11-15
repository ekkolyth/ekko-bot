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

interface UpdateCommandPayload {
  id: string;
  name: string;
  response: string;
}

interface DeleteCommandPayload {
  id: string;
}

async function fetchCommands() {
  const response = await fetch('/api/commands');
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.detail || data?.error || 'Failed to load commands';
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
        const message = data?.message || data?.detail || data?.error || 'Failed to save command';
        throw new Error(message);
      }

      return data as CustomCommand;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useUpdateCommand() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCommandPayload) => {
      const response = await fetch(`/api/commands/${payload.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: payload.name, response: payload.response }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.detail || data?.error || 'Failed to update command';
        throw new Error(message);
      }

      return data as CustomCommand;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useDeleteCommand() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteCommandPayload) => {
      const response = await fetch(`/api/commands/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.detail || data?.error || 'Failed to delete command';
        throw new Error(message);
      }

      return id;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}
