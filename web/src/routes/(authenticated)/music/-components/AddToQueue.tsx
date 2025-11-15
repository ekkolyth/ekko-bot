import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useAddToQueue } from '@/hooks/use-add-to-queue';
import { Plus } from 'lucide-react';

interface AddToQueueProps {
  selectedChannelId: string | null;
  onSuccess?: () => void;
  voiceChannelName?: string;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddToQueue({ selectedChannelId, onSuccess, voiceChannelName, open, onOpenChange }: AddToQueueProps) {
  const [addUrlMessage, setAddUrlMessage] = useState('');
  const addToQueue = useAddToQueue();

  const form = useForm({
    defaultValues: { URL: '' },
    onSubmit: async ({ value }) => {
      setAddUrlMessage('');

      if (!selectedChannelId) {
        setAddUrlMessage('❌ Please select a voice channel');
        return;
      }

      try {
        await addToQueue.mutateAsync({ voice_channel_id: selectedChannelId, url: value.URL });
        setAddUrlMessage('✅ Song added to queue!');
        form.reset();
        setTimeout(() => setAddUrlMessage(''), 3000);
        onSuccess?.();
      } catch (error) {
        setAddUrlMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        setTimeout(() => setAddUrlMessage(''), 5000);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="size-5 text-primary" />
            {voiceChannelName ? `Add to ${voiceChannelName}` : 'Add to Queue'}
          </DialogTitle>
          <DialogDescription className="text-foreground/80">
            Paste a YouTube link to queue a track.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 pt-2"
        >
          <form.Field name="URL">
            {(field) => (
              <Field>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-description="Input to Enter YouTube URL"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  required
                />
              </Field>
            )}
          </form.Field>
          <Button
            type="submit"
            disabled={!selectedChannelId || addToQueue.isPending}
            className="w-full"
          >
            {addToQueue.isPending ? 'Adding...' : 'Add to Queue'}
          </Button>

          {addUrlMessage && (
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              {addUrlMessage}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
