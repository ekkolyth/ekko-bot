import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: '/dashboard',
      },
      {
        onSuccess: async () => {
          // Check if Discord is connected
          const response = await fetch('/api/auth/has-discord');

          if (response.ok) {
            const data = await response.json();

            if (data.hasDiscord) {
              navigate({ to: '/dashboard' });
            } else {
              navigate({ to: '/auth/connect' });
            }
          } else {
            navigate({ to: '/auth/connect' });
          }
        },
        onError: (ctx) => {
          setErrorMessage(ctx.error?.message ?? 'Sign-in failed. Please try again.');
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleDiscordLogin = async () => {
    await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/auth/verify',
    });
  };

  return (
    <div className='bg-muted/20 flex min-h-screen'>
      {/* Left side - Image */}
      <div className='relative hidden lg:flex lg:w-1/2 opacity-50'>
        <div className='relative h-full w-full'>
          <img
            src='/login.jpg'
            alt='Ekko Bot'
            className='object-cover h-full w-full'
          />
          <div className='absolute inset-0 bg-black/20' />

          {/* Logo */}
          <div className='absolute top-8 left-8 flex items-center gap-2 text-white'>
            <Link to='/' className='flex flex-row items-center gap-2'>
              <div className='flex h-6 w-6 items-center justify-center rounded-sm bg-white'>
                <div className='bg-primary h-2 w-2 rounded-full' />
              </div>
              <span className='text-xl font-semibold'>Ekko Bot</span>
            </Link>
          </div>

          {/* Testimonial */}
          <div className='absolute right-8 bottom-8 left-8 text-white'>
            <blockquote className='mb-4 text-2xl font-medium'>
              Day? Throwing? Crazy.
            </blockquote>
            <div>
              <div className='font-medium'>Literally Everyone</div>
              <div className='text-sm opacity-90'>Trust.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className='flex w-full items-center justify-center p-8 lg:w-1/2'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile logo */}
          <div className='mb-8 flex items-center justify-center gap-2 lg:hidden'>
            <div className='bg-primary flex h-6 w-6 items-center justify-center rounded-sm'>
              <div className='bg-primary-foreground h-2 w-2 rounded-full' />
            </div>
            <span className='text-xl font-semibold'>Ekko Bot</span>
          </div>

          <div className='space-y-2 text-center'>
            <h1 className='text-foreground text-2xl font-bold'>Welcome back!</h1>
            <p className='text-muted-foreground'>
              Please Sign In to continue to your Dashboard.
            </p>
          </div>

          {errorMessage && (
            <Alert variant='destructive'>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            className='space-y-6'
          >
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-foreground text-sm font-medium'
              >
                Email
              </Label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full'
                required
                disabled={isSubmitting}
              />
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-foreground text-sm font-medium'
              >
                Password
              </Label>
              <Input
                id='password'
                type='password'
                autoComplete='current-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full'
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type='submit'
              className='w-full py-3'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='border-border w-full border-t' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-background text-muted-foreground px-2'>OR</span>
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              className='w-full py-3 text-foreground'
              onClick={handleDiscordLogin}
              disabled={isSubmitting}
            >
              <svg
                className='mr-2 h-5 w-5'
                viewBox='0 0 24 24'
                fill='#5865F2'
              >
                <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z' />
              </svg>
              Sign In with Discord
            </Button>

            <p className='text-muted-foreground text-center text-sm'>
              Don&apos;t have an account?{' '}
              <Link
                to='/auth/sign-up'
                className='text-primary hover:text-primary/80 font-medium'
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
