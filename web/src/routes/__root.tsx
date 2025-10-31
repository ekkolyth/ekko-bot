import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { Providers } from '../providers'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => {
    const betterAuthUrl = process.env.BETTER_AUTH_URL;
    
    if (!betterAuthUrl) {
      throw new Error(
        'BETTER_AUTH_URL environment variable is required but not set. ' +
        'Please set BETTER_AUTH_URL in your environment variables.'
      );
    }

    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: 'Ekkobot'
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
      scripts: [
        {
          type: 'application/json',
          id: 'better-auth-config',
          children: JSON.stringify({ betterAuthUrl }),
        },
      ],
    };
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className='dark'>
        <Providers>
          <Header />
          {children}
        </Providers>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
