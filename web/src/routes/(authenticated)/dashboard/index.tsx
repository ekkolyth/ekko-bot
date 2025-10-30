import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useVoiceChannels } from '@/hooks/use-voice-channels';
import { useHasDiscord } from '@/hooks/use-has-discord';
import { useAddToQueue } from '@/hooks/use-add-to-queue';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Volume2 } from 'lucide-react';

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate();
  const { data: hasDiscord, isPending: discordPending } = useHasDiscord();

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

  if (sessionPending || discordPending) return <Spinner />;

  if (!session || !hasDiscord) return null;

  function InputURL() {
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [message, setMessage] = useState('');

    // Use TanStack Query hooks
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


    const handleSubmit = async (url: string) => {
      setMessage('');

      if (!selectedChannelId) {
        setMessage('❌ Please select a voice channel');
        return;
      }

      try {
        await addToQueue.mutateAsync({ voice_channel_id: selectedChannelId, url });

        setMessage('✅ Song added to queue!');
        form.reset();
      } catch (error) {
        setMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className='space-y-4'
      >
        {/* Single-tenant: no guild selection */}

        <div className='space-y-2'>
          <Label htmlFor='channel'>Voice Channel</Label>
          {channelsError && <p className='text-sm text-red-500'>Failed to load channels.</p>}
          <Select
            value={selectedChannelId}
            onValueChange={setSelectedChannelId}
            disabled={channelsLoading || voiceChannels.length === 0}
          >
            <SelectTrigger id='channel'>
              <SelectValue
                placeholder={
                  channelsLoading
                    ? 'Loading channels...'
                    : voiceChannels.length === 0
                      ? 'No voice channels available'
                      : 'Select a voice channel'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {voiceChannels.map((channel) => (
                <SelectItem
                  key={channel.id}
                  value={channel.id}
                >
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form.Field name='URL'>
          {(field) => (
            <Field>
              <Label htmlFor='url'>YouTube URL</Label>
              <Input
                id='url'
                type='url'
                placeholder='https://www.youtube.com/watch?v=...'
                aria-description='Input to Enter YouTube URL'
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                required
              />
            </Field>
          )}
        </form.Field>
        <Button
          className='mt-4'
          type='submit'
          disabled={!selectedChannelId || addToQueue.isPending}
        >
          {addToQueue.isPending ? 'Adding...' : 'Add to Queue'}
        </Button>

        {message && <div className='p-3 rounded-md bg-muted text-sm'>{message}</div>}
      </form>
    );
  }
  return (
    <div className='container p-8 space-y-4'>
      <h1 className='text-2xl font-bold'>Welcome, {session?.user.name}!</h1>
      <InputURL />
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Now Playing</CardTitle>
                <CardDescription>Music Bot Session</CardDescription>
              </div>
            </div>
            <Volume2 className="w-5 h-5 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
              <div className="text-white font-medium mb-1">Current Track</div>
              <div className="text-slate-400 text-sm">Example Song Title</div>
            </div>
            <div className="space-y-2">
              <div className="text-slate-400 text-sm font-medium">Queue (3 tracks)</div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-slate-800/30 rounded p-3 text-sm text-slate-300"
                >
                  {i}. Upcoming track #{i}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>




  );
}
