import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/hooks/use-queue';
import { useQueueActions } from '@/hooks/use-queue-actions';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Trash2, 
  ExternalLink,
  Volume2,
  ListX,
  Link as LinkIcon
} from 'lucide-react';
import { useState } from 'react';

interface MusicPlayerProps {
  voiceChannelId: string;
  voiceChannelName: string;
}

export function MusicPlayer({ voiceChannelId, voiceChannelName }: MusicPlayerProps) {
  const { data: queue, isLoading } = useQueue(voiceChannelId);
  const actions = useQueueActions();
  const [actionMessage, setActionMessage] = useState('');

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
      <Card className="bg-slate-900/80 border-slate-800">
        <CardContent className="py-8">
          <div className="text-center text-slate-400">Loading player...</div>
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

  const currentTrack = queueData.tracks[0];
  const upcomingTracks = queueData.tracks.slice(1);

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              {queueData.is_playing && !queueData.is_paused ? (
                <Play className="w-6 h-6 text-purple-400" />
              ) : (
                <Pause className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-white">{voiceChannelName}</CardTitle>
              <CardDescription>
                {queueData.tracks.length === 0 
                  ? 'Nothing playing' 
                  : queueData.is_playing && !queueData.is_paused 
                    ? 'Now Playing' 
                    : 'Paused'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Volume2 className="w-5 h-5" />
            <span className="text-sm">{Math.round((queueData.volume || 0) * 100)}%</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {queueData.is_playing && !queueData.is_paused ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePause}
              disabled={actions.pause.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlay}
              disabled={actions.play.isPending || queueData.tracks.length === 0}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkip}
            disabled={actions.skip.isPending || queueData.tracks.length === 0}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={actions.clear.isPending || queueData.tracks.length === 0}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ListX className="w-4 h-4 mr-2" />
            Clear Queue
          </Button>
        </div>

        {actionMessage && (
          <div className="mt-2 p-2 rounded-md bg-slate-800/50 text-sm text-slate-300">
            {actionMessage}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {queueData.tracks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Queue is empty. Add some tracks to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current Track */}
            {currentTrack && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-white font-medium">Now Playing</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(currentTrack.url, '_blank')}
                        className="text-purple-400 hover:text-purple-300 h-6 w-6 p-0"
                        title="Open YouTube video"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-slate-200 text-base font-semibold mb-1">
                      {currentTrack.title}
                    </div>
                    {currentTrack.artist && (
                      <div className="text-slate-400 text-sm mb-1">
                        {currentTrack.artist}
                      </div>
                    )}
                    {currentTrack.added_by !== 'Unknown' && (
                      <div className="text-slate-500 text-xs mt-2">
                        Added by {currentTrack.added_by}
                      </div>
                    )}
                    <div className="text-slate-500 text-xs mt-1">
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
                <div className="text-slate-400 text-sm font-medium">
                  Up Next ({upcomingTracks.length} {upcomingTracks.length === 1 ? 'track' : 'tracks'})
                </div>
                {upcomingTracks.map((track) => (
                  <div
                    key={track.position}
                    className="bg-slate-800/30 rounded p-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-sm font-medium mb-1">
                          {track.position}. {track.title}
                        </div>
                        {track.artist && (
                          <div className="text-slate-400 text-xs mb-1">
                            {track.artist}
                          </div>
                        )}
                        {track.added_by !== 'Unknown' && (
                          <div className="text-slate-500 text-xs">
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
                          className="text-slate-400 hover:text-slate-300 h-8 w-8 p-0"
                          title="Open YouTube video"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(track.position)}
                          disabled={actions.remove.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
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
  );
}

