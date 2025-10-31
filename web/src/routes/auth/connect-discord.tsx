import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/auth/connect-discord')({
  component: ConnectDiscord,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    // If not logged in, redirect to sign-in
    if (!session) {
      throw redirect({ to: '/auth/sign-in' });
    }

    // Check if Discord is already connected
    const response = await fetch('/api/auth/has-discord');
    if (response.ok) {
      const data = await response.json();
      if (data.hasDiscord) {
        throw redirect({ to: '/dashboard' });
      }
    }
  },
});

function ConnectDiscord() {
  const handleConnectDiscord = async () => {
    await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/dashboard',
    });
  };

  return (
    <div className='flex w-full h-screen justify-center items-center'>
      <Card className='max-w-md p-6'>
        <CardHeader>Link your Discord account</CardHeader>
        <CardDescription className='mb-4'>
          To use the music bot, you need to link your Discord account.
        </CardDescription>
        <CardContent className='px-0'>
          <Button
            onClick={handleConnectDiscord}
            type='button'
            className='w-full discord-button'
          >
            Sign In with Discord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
