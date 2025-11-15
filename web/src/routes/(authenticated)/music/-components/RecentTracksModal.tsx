import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus } from 'lucide-react';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { useAddToQueue } from '@/hooks/use-add-to-queue';

interface RecentTracksModalProps {
  voiceChannelId: string | null;
  voiceChannelName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecentTracksModal({ voiceChannelId, voiceChannelName, open, onOpenChange }: RecentTracksModalProps) {
  const addToQueue = useAddToQueue();
  const [statusMessage, setStatusMessage] = useState('');
  const { data, isLoading, isError, refetch, isFetching } = useRecentlyPlayed(voiceChannelId, {
    enabled: open,
  });

  const tracks = data?.tracks ?? [];

  const handleAddTrack = async (url: string) => {
    if (!voiceChannelId) {
      setStatusMessage('❌ Select a voice channel first');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    try {
      await addToQueue.mutateAsync({ voice_channel_id: voiceChannelId, url });
      setStatusMessage('✅ Added to queue');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error) {
      setStatusMessage(`❌ ${error instanceof Error ? error.message : 'Failed to add track'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const renderContent = () => {
    if (isLoading || isFetching) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <p>Unable to load recently played tracks.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      );
    }

    if (tracks.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No recent tracks yet. Add a few songs to see them here.
        </div>
      );
    }

    return (
      <ScrollArea className="h-full pr-3">
        <div className="divide-y divide-border">
          {tracks.map((track, index) => (
            <div key={`${track.url}-${index}`} className="flex items-center gap-3 py-3">
              {track.thumbnail ? (
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  No Img
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {track.artist ? `${track.artist} - ${track.title}` : track.title}
                </div>
                {track.added_by && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    Added by {track.added_by}
                  </div>
                )}
              </div>
              <div className="w-12 text-right text-sm text-muted-foreground">
                {formatDuration(track.duration)}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleAddTrack(track.url)}
                disabled={addToQueue.isPending}
                className="text-primary"
                title="Add to queue"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Recent Tracks</DialogTitle>
          <DialogDescription className="text-foreground/80">
            {voiceChannelName ? `History for ${voiceChannelName}` : 'History for current voice channel'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 h-[420px] flex flex-col">{renderContent()}</div>
        {statusMessage && (
          <div className="mt-3 rounded bg-muted/50 p-2 text-sm text-foreground">{statusMessage}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatDuration(seconds: number) {
  if (!seconds || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

