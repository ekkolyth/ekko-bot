import { FormEvent, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCommands, useCreateCommand } from '@/hooks/use-commands';

export const Route = createFileRoute('/(authenticated)/commands/')({
  component: RouteComponent,
});

type StatusTone = 'success' | 'error' | null;

function RouteComponent() {
  const { data: commands, isLoading, isError, error } = useCommands();
  const createCommand = useCreateCommand();

  const [commandName, setCommandName] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusTone(null);

    const trimmedName = commandName.trim().replace(/^!+/, '');
    const trimmedResponse = commandResponse.trim();

    if (!trimmedName) {
      setStatusMessage('Enter a command name.');
      setStatusTone('error');
      return;
    }

    if (!trimmedResponse) {
      setStatusMessage('Describe what the bot should say.');
      setStatusTone('error');
      return;
    }

    try {
      await createCommand.mutateAsync({
        name: trimmedName,
        response: trimmedResponse,
      });
      setStatusTone('success');
      setStatusMessage(`Saved !${trimmedName}`);
      setCommandName('');
      setCommandResponse('');
    } catch (err: unknown) {
      setStatusTone('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to save command');
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Commands</h1>
        <p className="text-muted-foreground">
          Create simple text responses for the guild. Commands are triggered with an exclamation
          point, like <span className="font-mono text-foreground">!hello</span>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Add Command</h2>
            <p className="text-sm text-muted-foreground">
              Command names must be unique. Enter the name only&mdash;no leading exclamation point.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="command-name" className="text-sm font-medium text-foreground">
                Command name
              </label>
              <Input
                id="command-name"
                placeholder="hello"
                autoComplete="off"
                value={commandName}
                onChange={(event) => setCommandName(event.target.value)}
                disabled={createCommand.isPending}
              />
              <p className="text-xs text-muted-foreground">Users will type !{commandName || 'name'}.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="command-response" className="text-sm font-medium text-foreground">
                Response
              </label>
              <Textarea
                id="command-response"
                placeholder="Thanks for joining the channel!"
                rows={4}
                value={commandResponse}
                onChange={(event) => setCommandResponse(event.target.value)}
                disabled={createCommand.isPending}
              />
              <p className="text-xs text-muted-foreground">This message is sent verbatim in Discord.</p>
            </div>

            <Button type="submit" className="w-full" disabled={createCommand.isPending}>
              {createCommand.isPending ? 'Saving...' : 'Save command'}
            </Button>

            {statusMessage && (
              <p
                className={[
                  'rounded-md border px-3 py-2 text-sm',
                  statusTone === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                    : 'border-destructive/40 bg-destructive/10 text-destructive',
                ].join(' ')}
              >
                {statusMessage}
              </p>
            )}
          </form>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Saved Commands</h2>
              <p className="text-sm text-muted-foreground">
                Commands are available immediately once saved.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading commands…</p>}

            {isError && (
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : 'Unable to load commands.'}
              </p>
            )}

            {!isLoading && !isError && (commands?.length ?? 0) === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No commands yet.</p>
                <p className="text-xs text-muted-foreground">
                  Add your first command with the form on the left.
                </p>
              </div>
            )}

            {!isLoading && !isError && (commands?.length ?? 0) > 0 && (
              <ul className="space-y-3">
                {commands?.map((command) => (
                  <li
                    key={command.id}
                    className="rounded-lg border border-border bg-muted/40 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">!{command.name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(command.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{command.response}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatTimestamp(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
}

