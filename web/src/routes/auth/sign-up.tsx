import { createFileRoute, useSearch } from '@tanstack/react-router';
import { authClient } from '@/lib/auth/client';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: '/auth/connect-discord',
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          // Redirect to Discord connection page after signup
          navigate({ to: '/auth/connect-discord' });
        },
        onError: (ctx) => {
          setLoading(false);
          alert(ctx.error.message);
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
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Create your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <a
              href='/auth/sign-in'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              sign in to your existing account
            </a>
          </p>
          {search.message && (
            <div className='mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200'>
              <p className='text-sm text-yellow-800'>{search.message}</p>
            </div>
          )}
        </div>

        <form
          className='mt-8 space-y-6'
          onSubmit={handleSubmit}
        >
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label
                htmlFor='name'
                className='sr-only'
              >
                Full name
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Full name'
              />
            </div>
            <div>
              <label
                htmlFor='email'
                className='sr-only'
              >
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Email address'
              />
            </div>
            <div>
              <label
                htmlFor='password'
                className='sr-only'
              >
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Password'
                minLength={8}
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
