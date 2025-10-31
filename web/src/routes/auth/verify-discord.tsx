import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { Spinner } from '@/components/ui/spinner';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/verify-discord')({
  component: VerifyDiscord,
});

function VerifyDiscord() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const verifyAccount = async () => {
      const session = await authClient.getSession();

      if (!mounted) return;

      if (!session) {
        navigate({
          to: '/auth/sign-up',
          search: { message: 'No account found. Please create an account first.' },
        });
        return;
      }

      const userId = (session as any)?.data?.user?.id;

      if (!userId) {
        navigate({ to: '/dashboard' });
        return;
      }

      try {
        // Check if user has a password account
        const response = await fetch(`/api/auth/check-password-account?userId=${userId}`);

        if (!mounted) return;

        if (!response.ok) {
          console.error('Failed to check password account');
          navigate({ to: '/dashboard' });
          return;
        }

        const data = await response.json();

        // If no password account exists, this was auto-created from Discord - reject it
        if (!data.hasPasswordAccount) {
          // Delete the auto-created account and sign out in one call
          await fetch('/api/auth/delete-auto-created-account', {
            method: 'POST',
          });

          if (!mounted) return;

          // Force sign out by clearing the session
          await authClient.signOut();

          // Small delay to ensure signOut completes
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (!mounted) return;

          // Navigate to sign-up with replace to avoid back button issues
          navigate({
            to: '/auth/sign-up',
            search: {
              message: 'No account found. Please create an account first.',
            },
            replace: true,
          });
          return;
        }

        // Account exists with email/password - Discord login succeeded, go to dashboard
        if (mounted) {
          navigate({ to: '/dashboard' });
        }
      } catch (error) {
        console.error('Error verifying account:', error);
        if (mounted) {
          navigate({ to: '/dashboard' });
        }
      }
    };

    verifyAccount();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className='flex w-full h-screen justify-center items-center'>
      <Spinner />
      <p className='ml-4'>Verifying Discord account...</p>
    </div>
  );
}
