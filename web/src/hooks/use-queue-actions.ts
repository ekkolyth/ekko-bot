import { useMutation, useQueryClient } from '@tanstack/react-query';

interface QueueActionParams {
  voice_channel_id: string;
}

interface RemoveTrackParams extends QueueActionParams {
  position: number;
}

export function useQueueActions() {
  const queryClient = useQueryClient();

  const invalidateQueue = (voiceChannelId: string) => {
    queryClient.invalidateQueries({ queryKey: ['queue', voiceChannelId] });
  };

  const pause = useMutation({
    mutationFn: async (params: QueueActionParams) => {
      const response = await fetch('/api/queue/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pause');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateQueue(variables.voice_channel_id);
    },
  });

  const play = useMutation({
    mutationFn: async (params: QueueActionParams) => {
      const response = await fetch('/api/queue/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to play');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateQueue(variables.voice_channel_id);
    },
  });

  const skip = useMutation({
    mutationFn: async (params: QueueActionParams) => {
      const response = await fetch('/api/queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to skip');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateQueue(variables.voice_channel_id);
    },
  });

  const clear = useMutation({
    mutationFn: async (params: QueueActionParams) => {
      const response = await fetch('/api/queue/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear queue');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateQueue(variables.voice_channel_id);
    },
  });

  const remove = useMutation({
    mutationFn: async (params: RemoveTrackParams) => {
      const response = await fetch('/api/queue/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove track');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateQueue(variables.voice_channel_id);
    },
  });

  return {
    pause,
    play,
    skip,
    clear,
    remove,
  };
}

