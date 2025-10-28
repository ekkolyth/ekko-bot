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
import { useGuilds } from '@/hooks/use-guilds';
import { useVoiceChannels } from '@/hooks/use-voice-channels';
import { useHasDiscord } from '@/hooks/use-has-discord';
import { useAddToQueue } from '@/hooks/use-add-to-queue';

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
    const [selectedGuildId, setSelectedGuildId] = useState<string>('');
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [message, setMessage] = useState('');

    // Use TanStack Query hooks
    const { data: guilds = [], isLoading: guildsLoading, error: guildsError } = useGuilds();
    const {
      data: voiceChannels = [],
      isLoading: channelsLoading,
      error: channelsError,
    } = useVoiceChannels(selectedGuildId);
    const addToQueue = useAddToQueue();

    const form = useForm({
      defaultValues: {
        URL: '',
      },
      onSubmit: async ({ value }) => {
        handleSubmit(value.URL);
      },
    });

    // Reset channel when guild changes
    useEffect(() => {
      setSelectedChannelId('');
    }, [selectedGuildId]);

    const handleSubmit = async (url: string) => {
      setMessage('');

      if (!selectedGuildId || !selectedChannelId) {
        setMessage('❌ Please select a guild and voice channel');
        return;
      }

      try {
        await addToQueue.mutateAsync({
          guild_id: selectedGuildId,
          voice_channel_id: selectedChannelId,
          url,
        });

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
        <div className='space-y-2'>
          <Label htmlFor='guild'>Guild</Label>
          {guildsError && (
            <p className='text-sm text-red-500'>Failed to load guilds. Please reconnect Discord.</p>
          )}
          <Select
            value={selectedGuildId}
            onValueChange={setSelectedGuildId}
            disabled={guildsLoading}
          >
            <SelectTrigger id='guild'>
              <SelectValue placeholder={guildsLoading ? 'Loading guilds...' : 'Select a guild'} />
            </SelectTrigger>
            <SelectContent>
              {guilds.map((guild) => (
                <SelectItem
                  key={guild.id}
                  value={guild.id}
                >
                  {guild.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='channel'>Voice Channel</Label>
          {channelsError && <p className='text-sm text-red-500'>Failed to load channels.</p>}
          <Select
            value={selectedChannelId}
            onValueChange={setSelectedChannelId}
            disabled={!selectedGuildId || channelsLoading || voiceChannels.length === 0}
          >
            <SelectTrigger id='channel'>
              <SelectValue
                placeholder={
                  !selectedGuildId
                    ? 'Select a guild first'
                    : channelsLoading
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
          disabled={!selectedGuildId || !selectedChannelId || addToQueue.isPending}
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
    </div>
  );
}
