import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useHasDiscord } from '@/hooks/use-has-discord';

export const Route = createFileRoute('/auth/verify-discord')({
  component: VerifyDiscord,
});

function VerifyDiscord() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate();
  const { data: hasDiscord, isPending: discordPending } = useHasDiscord();

  useEffect(() => {
    if (!sessionPending && !discordPending) {
      if (!session) {
        // Not logged in at all - redirect to sign up with message
        navigate({
          to: '/auth/sign-up',
          search: { message: 'No account found. Please create an account first.' },
        });
        return;
      }

      if (hasDiscord) {
        // Discord connected, go to dashboard
        navigate({ to: '/dashboard' });
      } else {
        // Discord login didn't create an account, sign out and redirect
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              navigate({
                to: '/auth/sign-up',
                search: {
                  message: 'No account found with that Discord login. Please sign up first.',
                },
              });
            },
          },
        });
      }
    }
  }, [session, sessionPending, hasDiscord, discordPending, navigate]);

  return (
    <div className='flex w-full h-screen justify-center items-center'>
      <Spinner />
      <p className='ml-4'>Verifying Discord account...</p>
    </div>
  );
}
