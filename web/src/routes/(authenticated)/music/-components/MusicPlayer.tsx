import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/hooks/use-queue';
import { useQueueActions } from '@/hooks/use-queue-actions';
import {
  Play,
  Pause,
  SkipForward,
  StopCircle,
  Trash2,
  Volume2,
  ListX,
  Link as LinkIcon
} from 'lucide-react';
import { useState } from 'react';
import { AddToQueue } from './AddToQueue';
import { RecentTracksModal } from './RecentTracksModal';

interface MusicPlayerProps {
  voiceChannelId: string;
  voiceChannelName: string;
}

export function MusicPlayer({ voiceChannelId, voiceChannelName }: MusicPlayerProps) {
  const { data: queue, isLoading } = useQueue(voiceChannelId);
  const actions = useQueueActions();
  const [actionMessage, setActionMessage] = useState('');
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);

  const handlePlay = async () => {
    try {
      await actions.play.mutateAsync({ voice_channel_id: voiceChannelId });
      setActionMessage('✅ Playing');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handlePause = async () => {
    try {
      await actions.pause.mutateAsync({ voice_channel_id: voiceChannelId });
      setActionMessage('✅ Paused');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleSkip = async () => {
    try {
      await actions.skip.mutateAsync({ voice_channel_id: voiceChannelId });
      setActionMessage('✅ Skipped');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleStop = async () => {
    try {
      await actions.stop.mutateAsync({ voice_channel_id: voiceChannelId });
      setActionMessage('✅ Stopped');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleClear = async () => {
    try {
      await actions.clear.mutateAsync({ voice_channel_id: voiceChannelId });
      setActionMessage('✅ Queue cleared');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleRemove = async (position: number) => {
    try {
      await actions.remove.mutateAsync({ voice_channel_id: voiceChannelId, position });
      setActionMessage('✅ Track removed');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (error) {
      setActionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  // Show loading only on initial load, not on refetches
  if (isLoading && !queue) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading player...</div>
        </CardContent>
      </Card>
    );
  }

  // Default to empty queue if no data
  const queueData = queue || {
    voice_channel_id: voiceChannelId,
    tracks: [],
    is_playing: false,
    is_paused: false,
    volume: 0.5,
  };

  const safeTracks = Array.isArray(queueData.tracks) ? queueData.tracks : [];
  const currentTrack = safeTracks[0];
  const upcomingTracks = safeTracks.slice(1);

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {queueData.is_playing && !queueData.is_paused ? (
                  <Play className="size-5 text-primary" />
                ) : (
                  <Pause className="size-5 text-muted-foreground" />
                )}
                {voiceChannelName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Volume2 className="size-4" />
                {Math.round((queueData.volume || 0) * 100)}% •{' '}
                {safeTracks.length === 0
                  ? 'Nothing playing'
                  : queueData.is_playing && !queueData.is_paused
                    ? 'Now Playing'
                    : 'Paused'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRecentOpen(true)}
              >
                Recent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddSongOpen(true)}
              >
                Add Song
              </Button>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-2 flex-wrap mt-4">
            {queueData.is_playing && !queueData.is_paused ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                disabled={actions.pause.isPending}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlay}
                disabled={actions.play.isPending || safeTracks.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleSkip}
              disabled={actions.skip.isPending || safeTracks.length === 0}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              disabled={actions.stop.isPending || safeTracks.length === 0}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={actions.clear.isPending || safeTracks.length === 0}
            >
              <ListX className="w-4 h-4 mr-2" />
              Clear Queue
            </Button>
          </div>

          {actionMessage && (
            <div className="mt-2 p-2 rounded-md bg-muted/50 text-sm">
              {actionMessage}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {safeTracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Queue is empty. Add some tracks to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current Track */}
              {currentTrack && (
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium">Now Playing</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(currentTrack.url, '_blank')}
                          className="h-6 w-6 p-0"
                          title="Open YouTube video"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-base font-semibold mb-1">
                        {currentTrack.title}
                      </div>
                      {currentTrack.artist && (
                        <div className="text-muted-foreground text-sm mb-1">
                          {currentTrack.artist}
                        </div>
                      )}
                      {currentTrack.added_by !== 'Unknown' && (
                        <div className="text-muted-foreground text-xs mt-2">
                          Added by {currentTrack.added_by}
                        </div>
                      )}
                      <div className="text-muted-foreground text-xs mt-1">
                        Use Skip to move to next track
                      </div>
                    </div>
                    {currentTrack.thumbnail && (
                      <img
                        src={currentTrack.thumbnail}
                        alt={currentTrack.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Tracks */}
              {upcomingTracks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm font-medium">
                    Up Next ({upcomingTracks.length} {upcomingTracks.length === 1 ? 'track' : 'tracks'})
                  </div>
                  {upcomingTracks.map((track) => (
                    <div
                      key={track.position}
                      className="bg-muted/30 rounded p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium mb-1">
                            {track.position}. {track.title}
                          </div>
                          {track.artist && (
                            <div className="text-muted-foreground text-xs mb-1">
                              {track.artist}
                            </div>
                          )}
                          {track.added_by !== 'Unknown' && (
                            <div className="text-muted-foreground text-xs">
                              Added by {track.added_by}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 items-start">
                          {track.thumbnail && (
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(track.url, '_blank')}
                            className="h-8 w-8 p-0"
                            title="Open YouTube video"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(track.position)}
                            disabled={actions.remove.isPending}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AddToQueue
        selectedChannelId={voiceChannelId}
        voiceChannelName={voiceChannelName}
        onSuccess={() => setIsAddSongOpen(false)}
        open={isAddSongOpen}
        onOpenChange={setIsAddSongOpen}
      />
      <RecentTracksModal
        voiceChannelId={voiceChannelId}
        voiceChannelName={voiceChannelName}
        open={isRecentOpen}
        onOpenChange={setIsRecentOpen}
      />
    </>
  );
}
