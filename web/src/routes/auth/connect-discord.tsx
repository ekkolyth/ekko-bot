import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useEffect } from 'react';
import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/auth/connect-discord')({
  component: ConnectDiscord,
});

function ConnectDiscord() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  // Check if Discord is already connected
  useEffect(() => {
    if (!isPending && session?.user?.id) {
      fetch('/api/auth/has-discord')
        .then((res) => res.json())
        .then((data) => {
          if (data.hasDiscord) {
            // Already connected, go to dashboard
            navigate({ to: '/dashboard' });
          }
        });
    }
  }, [session, isPending, navigate]);

  // If not logged in, redirect to sign-in
  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/auth/sign-in' });
    }
  }, [session, isPending, navigate]);

  const handleConnectDiscord = async () => {
    await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/dashboard',
    });
  };

  if (isPending) {
    return (
      <div className='flex w-full h-screen justify-center items-center'>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className='flex w-full h-screen justify-center items-center'>
      <Card className='max-w-md p-6'>
        <CardHeader>Connect Your Discord Account</CardHeader>
        <CardDescription className='mb-4'>
          To use the music bot, you need to connect your Discord account.
        </CardDescription>
        <CardContent className='px-0'>
          <Button
            onClick={handleConnectDiscord}
            type='button'
            className='w-full discord-button'
          >
            Connect Discord Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
