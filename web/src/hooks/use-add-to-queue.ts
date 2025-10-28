import { useMutation } from '@tanstack/react-query';

interface AddToQueueParams {
  voice_channel_id: string;
  url: string;
}

export function useAddToQueue() {
  return useMutation({
    mutationFn: async (params: AddToQueueParams) => {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to add song to queue');
      }

      return data;
    },
  });
}
