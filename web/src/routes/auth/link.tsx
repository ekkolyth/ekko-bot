import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { Spinner } from '@/components/ui/spinner';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/link')({
  component: VerifyDiscordLink,
});

function VerifyDiscordLink() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const verifyLink = async () => {
      // Retry logic to handle race conditions with DB updates
      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries && mounted) {
        // Force refresh the session to get latest data
        await authClient.getSession();

        // Wait for Discord link to propagate to database
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!mounted) return;

        // Check if Discord was successfully linked
        const response = await fetch('/api/auth/has-discord');

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();

          if (data.hasDiscord) {
            // Successfully linked, go to dashboard
            navigate({ to: '/dashboard', replace: true });
            return;
          }
        }

        retries++;
      }

      // After all retries, if still no Discord, go back to connect page
      if (mounted) {
        navigate({ to: '/auth/connect', replace: true });
      }
    };

    verifyLink();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className='flex w-full h-screen justify-center items-center'>
      <Spinner />
      <p className='ml-4'>Linking Discord account...</p>
    </div>
  );
}
