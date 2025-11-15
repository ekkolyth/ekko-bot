import { FormEvent, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PenSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  type CustomCommand,
  useCommands,
  useCreateCommand,
  useDeleteCommand,
  useUpdateCommand,
} from '@/hooks/use-commands';

export const Route = createFileRoute('/(authenticated)/commands/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: commands, isLoading, isError, error } = useCommands();
  const createCommand = useCreateCommand();
  const updateCommand = useUpdateCommand();
  const deleteCommand = useDeleteCommand();

  const [commandName, setCommandName] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [pendingDeleteCommand, setPendingDeleteCommand] = useState<CustomCommand | null>(null);

  const isEditMode = dialogMode === 'edit';
  const isSaving = isEditMode ? updateCommand.isPending : createCommand.isPending;
  const dialogTitle = isEditMode ? 'Edit command' : 'New command';
  const dialogDescription = isEditMode
    ? 'Update the trigger or response.'
    : 'Define the trigger and what the bot should say.';
  const primaryButtonText = isEditMode ? 'Update command' : 'Save command';
  const savingLabel = isEditMode ? 'Updating...' : 'Saving...';

  const resetForm = () => {
    setCommandName('');
    setCommandResponse('');
    setActiveCommandId(null);
    setDialogMode('create');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (command: CustomCommand) => {
    setDialogMode('edit');
    setActiveCommandId(command.id);
    setCommandName(command.name);
    setCommandResponse(command.response);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = commandName.trim().replace(/^!+/, '');
    const trimmedResponse = commandResponse.trim();

    if (!trimmedName) {
      toast.error('Enter a command name.');
      return;
    }

    if (!trimmedResponse) {
      toast.error('Describe what the bot should say.');
      return;
    }

    try {
      if (isEditMode) {
        if (!activeCommandId) {
          toast.error('Missing command id.');
          return;
        }
        await updateCommand.mutateAsync({
          id: activeCommandId,
          name: trimmedName,
          response: trimmedResponse,
        });
        toast.success(`Updated !${trimmedName}`);
      } else {
        await createCommand.mutateAsync({
          name: trimmedName,
          response: trimmedResponse,
        });
        toast.success(`Saved !${trimmedName}`);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save command');
    }
  };

  const handleDeleteCommand = async () => {
    if (!pendingDeleteCommand) {
      return;
    }

    try {
      await deleteCommand.mutateAsync({ id: pendingDeleteCommand.id });
      toast.success(`Deleted !${pendingDeleteCommand.name}`);
      setPendingDeleteCommand(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete command');
    }
  };

  return (
    <div className='flex h-full flex-col gap-6 p-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-foreground'>Commands</h1>
          <p className='text-muted-foreground'>
            Create simple responses for the guild. Commands are triggered with an exclamation point,
            like <span className='font-mono text-foreground'>!hello</span>.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={handleDialogChange}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add command</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <label
                  htmlFor='command-name'
                  className='text-sm font-medium text-foreground'
                >
                  Command name
                </label>
                <Input
                  id='command-name'
                  placeholder='hello'
                  autoComplete='off'
                  value={commandName}
                  onChange={(event) => setCommandName(event.target.value)}
                  disabled={isSaving}
                />
                <p className='text-xs text-muted-foreground'>
                  Users will type !{commandName || 'name'}.
                </p>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='command-response'
                  className='text-sm font-medium text-foreground'
                >
                  Response
                </label>
                <Textarea
                  id='command-response'
                  placeholder='Thanks for joining the channel!'
                  rows={4}
                  value={commandResponse}
                  onChange={(event) => setCommandResponse(event.target.value)}
                  disabled={isSaving}
                />
                <p className='text-xs text-muted-foreground'>
                  This message is sent verbatim in Discord.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={isSaving}
                >
                  {isSaving ? savingLabel : primaryButtonText}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex-1 space-y-4'>
        <div className='space-y-1'>
          <h2 className='text-xl font-semibold text-foreground'>Saved commands</h2>
          <p className='text-sm text-muted-foreground'>
            Commands are available immediately once saved.
          </p>
        </div>

        <div className='flex-1 overflow-auto rounded-lg border border-border/60 bg-card/30'>
          <Table className='min-w-full'>
            <TableHeader>
              <TableRow>
                <TableHead className='w-48'>Command</TableHead>
                <TableHead>Response</TableHead>
                <TableHead className='w-56 text-right'>Added</TableHead>
                <TableHead className='w-32 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-10 text-center text-sm text-muted-foreground'
                  >
                    Loading commands…
                  </TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-10 text-center text-sm text-destructive'
                  >
                    {error instanceof Error ? error.message : 'Unable to load commands.'}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && (commands?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-12 text-center text-sm text-muted-foreground'
                  >
                    No commands yet. Add your first command to get started.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                (commands?.length ?? 0) > 0 &&
                commands?.map((command) => (
                  <TableRow key={command.id}>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className='font-mono'
                      >
                        !{command.name}
                      </Badge>
                    </TableCell>
                    <TableCell className='whitespace-normal text-sm text-foreground/90'>
                      {command.response}
                    </TableCell>
                    <TableCell className='text-right text-xs text-muted-foreground'>
                      {formatTimestamp(command.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-white hover:text-white/80 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
                              onClick={() => openEditDialog(command)}
                            >
                              <PenSquare className='h-4 w-4' />
                              <span className='sr-only'>Edit command</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-white hover:text-destructive hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
                              onClick={() => setPendingDeleteCommand(command)}
                              disabled={deleteCommand.isPending}
                            >
                              <Trash2 className='h-4 w-4' />
                              <span className='sr-only'>Delete command</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteCommand)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteCommand(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete command</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove !{pendingDeleteCommand?.name} permanently. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCommand.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={handleDeleteCommand}
              disabled={deleteCommand.isPending}
            >
              {deleteCommand.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
