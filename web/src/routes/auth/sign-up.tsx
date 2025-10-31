import { createFileRoute, useSearch, Link } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUp,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      message: (search.message as string) || undefined,
    };
  },
});

function SignUp() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth/sign-up' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: '/auth/connect',
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          navigate({ to: '/auth/connect' });
        },
        onError: (ctx) => {
          setLoading(false);
          setErrorMessage(ctx.error.message ?? 'Sign-up failed. Please try again.');
        },
      }
    );

    if (error) {
      console.error('Sign up failed:', error);
    }
    if (data) {
      console.log('Sign up successful:', data);
    }
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
            <div className='flex h-6 w-6 items-center justify-center rounded-sm bg-white'>
              <div className='bg-primary h-2 w-2 rounded-full' />
            </div>
            <span className='text-xl font-semibold'>Ekko Bot</span>
          </div>

          {/* Testimonial */}
          <div className='absolute right-8 bottom-8 left-8 text-white'>
            <blockquote className='mb-4 text-2xl font-medium'>
              &quot;Ekko Bot makes managing music in Discord seamless and fun.&quot;
            </blockquote>
            <div>
              <div className='font-medium'>Alex Jordan</div>
              <div className='text-sm opacity-90'>Community Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign up form */}
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
            <h1 className='text-foreground text-2xl font-bold'>Create your account</h1>
            <p className='text-muted-foreground'>
              Join Ekko Bot to manage your Discord music experience with ease.
            </p>
          </div>

          {search.message && (
            <Alert>
              <AlertDescription>{search.message}</AlertDescription>
            </Alert>
          )}

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
                htmlFor='name'
                className='text-foreground text-sm font-medium'
              >
                Full Name
              </Label>
              <Input
                id='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full'
                required
                disabled={loading}
              />
            </div>

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
                disabled={loading}
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
                autoComplete='new-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full'
                required
                minLength={8}
                disabled={loading}
              />
              <p className='text-muted-foreground text-xs'>Must be at least 8 characters</p>
            </div>

            <Button
              type='submit'
              className='w-full py-3'
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <p className='text-muted-foreground text-center text-sm'>
              Already have an account?{' '}
              <Link
                to='/auth/sign-in'
                className='text-primary hover:text-primary/80 font-medium'
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
