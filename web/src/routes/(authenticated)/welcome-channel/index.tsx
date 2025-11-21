import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTextChannels } from '@/hooks/use-text-channels'
import { useSaveWelcomeConfig, useWelcomeConfig } from '@/hooks/use-welcome-config'
import { useDiscordUsername } from '@/hooks/use-discord-username'

const DEFAULT_MESSAGE = 'Welcome to the guild! Grab a seat and say hello.'
const DEFAULT_TITLE = 'Welcome to the server'

export const Route = createFileRoute('/(authenticated)/welcome-channel/')({
  component: RouteComponent,
})

function RouteComponent() {
  const title = 'Welcome Channel'
  const description = 'Announce new members with a friendly embedded message.'

  const { data: channels, isLoading: channelsLoading, isError: channelError, error: channelErr } =
    useTextChannels()
  const { data: welcomeConfig, isLoading: configLoading, isError: configError, error: configErr } =
    useWelcomeConfig()

  const saveConfig = useSaveWelcomeConfig()

  const initialized = useRef(false)
  const [isEditing, setIsEditing] = useState(true)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const form = useForm({
    defaultValues: {
      channel_id: '',
      message: DEFAULT_MESSAGE,
      embed_title: DEFAULT_TITLE,
    },
    onSubmit: async ({ value }) => {
      if (!value.channel_id) {
        toast.error('Pick a text channel.')
        return
      }
      const trimmedMessage = value.message.trim()
      if (!trimmedMessage) {
        toast.error('Write a welcome message.')
        return
      }

      try {
        await saveConfig.mutateAsync({
          channel_id: value.channel_id,
          message: trimmedMessage,
          embed_title: value.embed_title.trim() || '',
        })
        setIsEditing(false)
        setLastSavedAt(new Date())
        toast.success('Welcome message updated.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save welcome message.')
      }
    },
  })

  useEffect(() => {
    if (!welcomeConfig) {
      return
    }

    const hasExisting = Boolean(welcomeConfig.channel_id && welcomeConfig.message)
    form.setFieldValue('channel_id', welcomeConfig.channel_id ?? '')
    form.setFieldValue('message', welcomeConfig.message ?? DEFAULT_MESSAGE)
    form.setFieldValue('embed_title', welcomeConfig.embed_title ?? DEFAULT_TITLE)

    if (!initialized.current) {
      setIsEditing(!hasExisting)
      initialized.current = true
    }
  }, [welcomeConfig, form])

  const isLoading = channelsLoading || configLoading
  const formDisabled = isLoading || saveConfig.isPending

  const selectedChannelName = useMemo(() => {
    if (!channels) return ''
    const match = channels.find((channel) => channel.id === form.state.values.channel_id)
    return match?.name ?? ''
  }, [channels, form.state.values.channel_id])

  const previewText =
    form.state.values.message.trim().length > 0
      ? form.state.values.message.trim()
      : DEFAULT_MESSAGE

  const previewTitle =
    form.state.values.embed_title.trim().length > 0
      ? form.state.values.embed_title.trim()
      : DEFAULT_TITLE

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isEditing ? (
          <Card className="p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                form.handleSubmit()
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="welcome-channel">Announcement channel</Label>
                <form.Field name="channel_id">
                  {(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      disabled={formDisabled || (channels?.length ?? 0) === 0}
                    >
                      <SelectTrigger id="welcome-channel">
                        <SelectValue
                          placeholder={
                            isLoading ? 'Loading channels…' : 'Select a text channel for announcements'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {channels?.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
                {channelError && (
                  <p className="text-sm text-destructive">
                    {channelErr instanceof Error ? channelErr.message : 'Unable to load channels.'}
                  </p>
                )}
                {!channelError && (channels?.length ?? 0) === 0 && !isLoading && (
                  <p className="text-sm text-muted-foreground">
                    No text channels were found for this guild.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="embed-title">Embed Title</Label>
                <form.Field name="embed_title">
                  {(field) => (
                    <Field>
                      <Input
                        id="embed-title"
                        type="text"
                        placeholder={DEFAULT_TITLE}
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        disabled={formDisabled}
                      />
                    </Field>
                  )}
                </form.Field>
                <p className="text-xs text-muted-foreground">
                  Custom title for the welcome embed. Leave empty to use default.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome message</Label>
                <form.Field name="message">
                  {(field) => (
                    <Textarea
                      id="welcome-message"
                      rows={5}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={DEFAULT_MESSAGE}
                      disabled={formDisabled}
                    />
                  )}
                </form.Field>
                {configError && (
                  <p className="text-sm text-destructive">
                    {configErr instanceof Error ? configErr.message : 'Unable to load settings.'}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {form.state.values.message.trim().length}/512 characters — the bot will mention
                  each new member automatically.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {lastSavedAt && (
                  <p className="text-xs text-muted-foreground">
                    Saved {lastSavedAt.toLocaleTimeString()}
                  </p>
                )}
                <Button type="submit" className="w-full sm:w-auto" disabled={formDisabled}>
                  {saveConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    'Save welcome message'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card className="flex h-full flex-col justify-between p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Active welcome message</h2>
                <p className="text-sm text-muted-foreground">
                  This is what new members see right now.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Channel</p>
                  <p className="font-medium text-foreground">
                    {selectedChannelName ? `#${selectedChannelName}` : 'Unknown channel'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{previewTitle}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">{previewText}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              {lastSavedAt && (
                <p className="text-xs text-muted-foreground">
                  Last saved {lastSavedAt.toLocaleTimeString()}
                </p>
              )}
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit welcome message
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 space-y-4 border-dashed">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Preview</h2>
            <p className="text-sm text-muted-foreground">
              Embed shown in {selectedChannelName ? `#${selectedChannelName}` : 'your channel'} when
              someone new joins.
            </p>
          </div>
          <DiscordEmbedPreview message={previewText} title={previewTitle} />
        </Card>
      </div>
    </div>
  )
}

function DiscordEmbedPreview({ message, title }: { message: string; title: string }) {
  const { data: discordUsername } = useDiscordUsername()
  const currentUserName = discordUsername || 'new-member'

  return (
    <div className="rounded-lg border border-border/60 bg-[#232428] text-white shadow-inner">
      <div className="border-l-4 border-[#8b5cf6] bg-[#2b2d31] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Discord Embed</p>
        <p className="mt-2 text-lg font-semibold text-white">{title}</p>
        <div className="mt-3 aspect-square w-full max-w-[128px] overflow-hidden rounded-full bg-[#1e1f22] border border-white/10">
          <div className="flex h-full w-full items-center justify-center text-white/30 text-xs">
            Avatar
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/90">
          {message}
          {'\n\n'}
          <span className="font-semibold text-[#c084fc]">{currentUserName}</span>
        </p>
      </div>
    </div>
  )
}
