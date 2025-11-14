import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth/client'
import { Card, CardContent } from '@/components/ui/card'
import { Music2 } from 'lucide-react'
import { useEffect } from 'react'
import { MusicPlayer } from './-components/MusicPlayer'
import { AddToQueue } from './-components/AddToQueue'
import { useVoiceChannels } from '@/hooks/use-voice-channels'
import { useHasDiscord } from '@/hooks/use-has-discord'
import { Empty } from '@/components/ui/empty'

export const Route = createFileRoute('/(authenticated)/music/')({
  component: Dashboard,
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session) {
      throw redirect({ to: '/auth/sign-in' })
    }

    if (typeof window !== 'undefined') {
      const response = await fetch('/api/auth/has-discord')
      if (response.ok) {
        const data = await response.json()
        if (!data.hasDiscord) {
          throw redirect({ to: '/auth/connect' })
        }
      }
    }
  },
})

function Dashboard() {
  const navigate = useNavigate()

  const { data: currentVoiceChannel, isLoading: channelLoading } = useVoiceChannels()
  const { data: hasDiscord, isLoading: hasDiscordLoading } = useHasDiscord()

  useEffect(() => {
    if (!hasDiscordLoading && hasDiscord === false) {
      navigate({ to: '/auth/connect', replace: true })
    }
  }, [hasDiscord, hasDiscordLoading, navigate])

  if (hasDiscordLoading || hasDiscord === false) {
    return (
      <div className="container max-w-7xl mx-auto p-4 md:p-8">
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center text-muted-foreground">
            Checking Discord link...
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeChannelId = currentVoiceChannel?.id ?? null
  const activeChannelName = currentVoiceChannel?.name ?? ''

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Channel List & Add Song */}
        <div className="lg:col-span-12 space-y-4">
          {channelLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Detecting voice channel...
              </CardContent>
            </Card>
          ) : !activeChannelId ? (
            <Empty className="border border-dashed">
              <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Join a voice channel</p>
              <p className="text-muted-foreground">
                Join a Discord voice channel to view and control the queue.
              </p>
            </Empty>
          ) : (
            <>
              <AddToQueue
                selectedChannelId={activeChannelId}
                voiceChannelName={activeChannelName}
              />
              <MusicPlayer
                voiceChannelId={activeChannelId}
                voiceChannelName={activeChannelName}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
