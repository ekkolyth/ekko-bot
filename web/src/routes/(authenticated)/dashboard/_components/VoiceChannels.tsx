import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Music2 } from 'lucide-react';
import { useVoiceChannels } from '@/hooks/use-voice-channels'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react';

interface VoiceChannelSelectProps {
  selectedChannelId: string | null;
  onSelect: (channelId: string | null) => void;
}

export function VoiceChannelSelect({ selectedChannelId, onSelect }: VoiceChannelSelectProps) {

  const {
    data: voiceChannels = [],
    isLoading: channelsLoading,
    error: channelsError,
  } = useVoiceChannels()

  return (
    <Card className='bg-card border-border'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="size-5 text-primary" />
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
            {voiceChannels.map((channel) => {
              const isActive = selectedChannelId === channel.id
              return (
                <Button
                  key={channel.id}
                  size='lg'
                  className="flex w-full items-center justify-between mb-2"
                  variant={isActive ? "active" : "outline"}
                  onClick={() => onSelect(isActive ? null : channel.id)}
                >
                  {channel.name}
                  <ChevronRight
                    className="
                      size-4 transition-transform
                    "
                  />
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
