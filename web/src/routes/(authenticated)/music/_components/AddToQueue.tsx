import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useAddToQueue } from '@/hooks/use-add-to-queue';
import { Plus } from 'lucide-react';

interface AddToQueueProps {
  selectedChannelId: string | null;
  onSuccess?: () => void;
}

export function AddToQueue({ selectedChannelId, onSuccess }: AddToQueueProps) {
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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          Add to Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="URL">
            {(field) => (
              <Field>
                <Label htmlFor="url">YouTube URL</Label>
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
      </CardContent>
    </Card>
  );
}
