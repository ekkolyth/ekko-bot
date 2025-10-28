import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useState } from 'react';
import { Field, FieldLabel, FieldError, FieldGroup, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignIn,
});

function SignIn() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);

      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          callbackURL: '/dashboard',
        },
        {
          onRequest: () => {
            setIsSubmitting(true);
          },
          onSuccess: async () => {
            const session = await authClient.getSession();
            // Check if Discord is connected
            const accounts = (session as any)?.data?.user?.accounts || [];
            const hasDiscord = accounts.some((acc: any) => acc.providerId === 'discord');

            if (hasDiscord) {
              // Has Discord, go to dashboard
              window.location.href = '/dashboard';
            } else {
              // No Discord, need to connect
              window.location.href = '/auth/connect-discord';
            }
          },
          onError: (ctx) => {
            setErrorMessage(ctx.error?.message ?? 'Sign-in failed. Please try again.');
            setIsSubmitting(false);
          },
        }
      );
    },
  });

  const handleDiscordLogin = async () => {
    await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/auth/verify-discord', // verify Discord account exists
    });
  };

  return (
    <Card className='max-w-md p-6'>
      <CardHeader>Sign In</CardHeader>
      <CardDescription>
        Don't have an account? <Link to='/auth/sign-up'>Sign up</Link> instead.
      </CardDescription>
      <CardContent className='px-0'>
        <Button
          onClick={handleDiscordLogin}
          type='button'
          className='discord-button'
        >
          Sign In with Discord
        </Button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldSet>
            <FieldGroup className='space-y-2'>
              <form.Field
                name='email'
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor='email'>Email</FieldLabel>
                    <Input
                      id='email'
                      type='email'
                      placeholder='you@example.com'
                      autoComplete='email'
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      required
                      disabled={isSubmitting}
                      aria-invalid={errorMessage ? true : undefined}
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup className='space-y-2'>
              <form.Field
                name='password'
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      autoComplete='current-password'
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      required
                      disabled={isSubmitting}
                      aria-invalid={errorMessage ? true : undefined}
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            {errorMessage && <FieldError>{errorMessage}</FieldError>}

            <Button
              type='submit'
              disabled={isSubmitting}
              className='mt-2 w-full'
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  );
}
