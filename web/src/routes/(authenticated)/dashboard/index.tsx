import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { useVoiceChannels } from '@/hooks/use-voice-channels';
import { useHasDiscord } from '@/hooks/use-has-discord';
import { useAddToQueue } from '@/hooks/use-add-to-queue';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Music2, ChevronRight } from 'lucide-react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate();
  const { data: hasDiscord, isPending: discordPending } = useHasDiscord();
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [addUrlMessage, setAddUrlMessage] = useState('');

  const {
    data: voiceChannels = [],
    isLoading: channelsLoading,
    error: channelsError,
  } = useVoiceChannels();
  const addToQueue = useAddToQueue();

  const form = useForm({
    defaultValues: {
      URL: '',
    },
    onSubmit: async ({ value }) => {
      handleSubmit(value.URL);
    },
  });

  // Check for session
  useEffect(() => {
    if (!sessionPending && !session) {
      navigate({ to: '/auth/sign-in' });
    }
  }, [sessionPending, session, navigate]);

  // Check if Discord is connected
  useEffect(() => {
    if (!discordPending && hasDiscord === false) {
      navigate({ to: '/auth/connect-discord' });
    }
  }, [discordPending, hasDiscord, navigate]);

  // Auto-select first channel when channels load
  useEffect(() => {
    if (!selectedChannelId && voiceChannels.length > 0) {
      setSelectedChannelId(voiceChannels[0].id);
    }
  }, [voiceChannels, selectedChannelId]);

  if (sessionPending || discordPending) return <Spinner />;

  if (!session || !hasDiscord) return null;

  const handleSubmit = async (url: string) => {
    setAddUrlMessage('');

    if (!selectedChannelId) {
      setAddUrlMessage('❌ Please select a voice channel');
      return;
    }

    try {
      await addToQueue.mutateAsync({ voice_channel_id: selectedChannelId, url });
      setAddUrlMessage('✅ Song added to queue!');
      form.reset();
      setTimeout(() => setAddUrlMessage(''), 3000);
    } catch (error) {
      setAddUrlMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setAddUrlMessage(''), 5000);
    }
  };

  const selectedChannel = voiceChannels.find(ch => ch.id === selectedChannelId);

  return (
    <div className='container max-w-7xl mx-auto p-4 md:p-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-white mb-2'>Welcome, {session?.user.name}!</h1>
        <p className='text-slate-400'>Control your music bot from here</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left Sidebar - Channel List & Add Song */}
        <div className='lg:col-span-4 space-y-4'>
          {/* Voice Channels Card */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Music2 className="w-5 h-5 text-purple-400" />
                Voice Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {channelsLoading ? (
                <div className="text-center py-4 text-slate-400">Loading channels...</div>
              ) : channelsError ? (
                <div className="text-center py-4 text-red-400">Failed to load channels</div>
              ) : voiceChannels.length === 0 ? (
                <div className="text-center py-4 text-slate-400">No voice channels available</div>
              ) : (
                <div className="space-y-1">
                  {voiceChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group",
                        selectedChannelId === channel.id
                          ? "bg-purple-500/20 border border-purple-500/50 text-white"
                          : "bg-slate-800/30 hover:bg-slate-800/50 border border-transparent text-slate-300"
                      )}
                    >
                      <span className="font-medium">{channel.name}</span>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        selectedChannelId === channel.id ? "text-purple-400" : "text-slate-500 group-hover:text-slate-400"
                      )} />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add to Queue Card */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Add to Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  form.handleSubmit();
                }}
                className='space-y-4'
              >
                <form.Field name='URL'>
                  {(field) => (
                    <Field>
                      <Label htmlFor='url' className="text-slate-300">YouTube URL</Label>
                      <Input
                        id='url'
                        type='url'
                        placeholder='https://www.youtube.com/watch?v=...'
                        aria-description='Input to Enter YouTube URL'
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        required
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </Field>
                  )}
                </form.Field>
                <Button
                  type='submit'
                  disabled={!selectedChannelId || addToQueue.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-500"
                >
                  {addToQueue.isPending ? 'Adding...' : 'Add to Queue'}
                </Button>

                {addUrlMessage && (
                  <div className='p-3 rounded-md bg-slate-800/50 text-sm text-slate-300'>
                    {addUrlMessage}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Music Player */}
        <div className='lg:col-span-8'>
          {selectedChannelId && selectedChannel ? (
            <MusicPlayer 
              voiceChannelId={selectedChannelId} 
              voiceChannelName={selectedChannel.name}
            />
          ) : (
            <Card className="bg-slate-900/80 border-slate-800">
              <CardContent className="py-16">
                <div className="text-center text-slate-400">
                  <Music2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg">Select a voice channel to view the player</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
