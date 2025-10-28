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

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface VoiceChannel {
  id: string;
  name: string;
}

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  if (isPending) return <Spinner />;

  if (!isPending && !session) {
    navigate({ to: '/auth/sign-in' });
  }

  // Check if user has Discord ID
  const hasDiscordId = (session as any)?.user?.discordUserId;

  function InputURL() {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [selectedGuildId, setSelectedGuildId] = useState<string>('');
    const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [message, setMessage] = useState('');

    const form = useForm({
      defaultValues: {
        URL: '',
      },
      onSubmit: async ({ value }) => {
        handleSubmit(value.URL);
      },
    });

    // Fetch guilds on mount
    useEffect(() => {
      fetch('/api/guilds')
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.guilds) {
            setGuilds(data.guilds);
          }
        })
        .catch((err) => console.error('Failed to fetch guilds:', err));
    }, []);

    // Fetch voice channels when guild is selected
    useEffect(() => {
      if (!selectedGuildId) {
        setVoiceChannels([]);
        setSelectedChannelId('');
        return;
      }

      fetch(`/api/guilds/${selectedGuildId}/channels`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.channels) {
            setVoiceChannels(data.channels);
          }
        })
        .catch((err) => console.error('Failed to fetch channels:', err));
    }, [selectedGuildId]);

    const handleSubmit = async (url: string) => {
      setMessage('');

      if (!selectedGuildId || !selectedChannelId) {
        setMessage('❌ Please select a guild and voice channel');
        return;
      }

      try {
        const response = await fetch('/api/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guild_id: selectedGuildId,
            voice_channel_id: selectedChannelId,
            url,
          }),
        });
        const data = await response.json();

        if (data.ok) {
          setMessage('✅ Song added to queue!');
          form.reset();
        } else {
          setMessage(`❌ Error: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        setMessage(`❌ Error: ${error}`);
        console.error('Error', error);
      }
    };

    if (!hasDiscordId) {
      return (
        <div className='space-y-4'>
          <p className='text-red-500'>
            Please sign out and sign back in with Discord to use the music bot.
          </p>
        </div>
      );
    }

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
          <Select
            value={selectedGuildId}
            onValueChange={setSelectedGuildId}
          >
            <SelectTrigger id='guild'>
              <SelectValue placeholder='Select a guild' />
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
          <Select
            value={selectedChannelId}
            onValueChange={setSelectedChannelId}
            disabled={!selectedGuildId || voiceChannels.length === 0}
          >
            <SelectTrigger id='channel'>
              <SelectValue
                placeholder={
                  !selectedGuildId
                    ? 'Select a guild first'
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
          disabled={!selectedGuildId || !selectedChannelId}
        >
          Add to Queue
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
