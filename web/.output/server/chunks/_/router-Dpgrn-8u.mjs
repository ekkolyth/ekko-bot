import { createRouter, createRootRoute, createFileRoute, lazyRouteComponent, HeadContent, Scripts, Link } from '@tanstack/react-router';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { useState } from 'react';
import { Menu, X, Home, SquareFunction, Network, StickyNote, ChevronDown, ChevronRight } from 'lucide-react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createAuthClient } from 'better-auth/react';
import { lastLoginMethodClient } from 'better-auth/client/plugins';
import { c as createServerFn, j as json, a as createServerRpc } from '../virtual/entry.mjs';
import fs from 'node:fs';
import postgres from 'postgres';
import { betterAuth } from 'better-auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { lastLoginMethod, haveIBeenPwned } from 'better-auth/plugins';
import { reactStartCookies } from 'better-auth/react-start';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'dotenv';
import 'node:async_hooks';
import '@tanstack/react-router/ssr/server';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupedExpanded, setGroupedExpanded] = useState({});
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("header", { className: "p-4 flex items-center bg-gray-800 text-white shadow-lg", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsOpen(true),
          className: "p-2 hover:bg-gray-700 rounded-lg transition-colors",
          "aria-label": "Open menu",
          children: /* @__PURE__ */ jsx(Menu, { size: 24 })
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "ml-4 text-xl font-semibold", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: "/tanstack-word-logo-white.svg",
          alt: "TanStack Logo",
          className: "h-10"
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: `fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-700", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "Navigation" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsOpen(false),
                className: "p-2 hover:bg-gray-800 rounded-lg transition-colors",
                "aria-label": "Close menu",
                children: /* @__PURE__ */ jsx(X, { size: 24 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "flex-1 p-4 overflow-y-auto", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/",
                onClick: () => setIsOpen(false),
                className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                activeProps: {
                  className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                },
                children: [
                  /* @__PURE__ */ jsx(Home, { size: 20 }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Home" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/demo/start/server-funcs",
                onClick: () => setIsOpen(false),
                className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                activeProps: {
                  className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                },
                children: [
                  /* @__PURE__ */ jsx(SquareFunction, { size: 20 }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Start - Server Functions" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/demo/start/api-request",
                onClick: () => setIsOpen(false),
                className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                activeProps: {
                  className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                },
                children: [
                  /* @__PURE__ */ jsx(Network, { size: 20 }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Start - API Request" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-row justify-between", children: [
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/demo/start/ssr",
                  onClick: () => setIsOpen(false),
                  className: "flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                  activeProps: {
                    className: "flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                  },
                  children: [
                    /* @__PURE__ */ jsx(StickyNote, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Start - SSR Demos" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "p-2 hover:bg-gray-800 rounded-lg transition-colors",
                  onClick: () => setGroupedExpanded((prev) => ({
                    ...prev,
                    StartSSRDemo: !prev.StartSSRDemo
                  })),
                  children: groupedExpanded.StartSSRDemo ? /* @__PURE__ */ jsx(ChevronDown, { size: 20 }) : /* @__PURE__ */ jsx(ChevronRight, { size: 20 })
                }
              )
            ] }),
            groupedExpanded.StartSSRDemo && /* @__PURE__ */ jsxs("div", { className: "flex flex-col ml-4", children: [
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/demo/start/ssr/spa-mode",
                  onClick: () => setIsOpen(false),
                  className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                  activeProps: {
                    className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                  },
                  children: [
                    /* @__PURE__ */ jsx(StickyNote, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "SPA Mode" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/demo/start/ssr/full-ssr",
                  onClick: () => setIsOpen(false),
                  className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                  activeProps: {
                    className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                  },
                  children: [
                    /* @__PURE__ */ jsx(StickyNote, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Full SSR" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/demo/start/ssr/data-only",
                  onClick: () => setIsOpen(false),
                  className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2",
                  activeProps: {
                    className: "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2"
                  },
                  children: [
                    /* @__PURE__ */ jsx(StickyNote, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Data Only" })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60 * 5,
      // 5 minutes
      retry: 1
    }
  }
});
function Providers({ children }) {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children });
}
const appCss = "/assets/styles-B8tkHirR.css";
const Route$c = createRootRoute({
  head: () => ({
    meta: [{
      charSet: "utf-8"
    }, {
      name: "viewport",
      content: "width=device-width, initial-scale=1"
    }, {
      title: "Ekkobot"
    }],
    links: [{
      rel: "stylesheet",
      href: appCss
    }]
  }),
  shellComponent: RootDocument
});
function RootDocument({
  children
}) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsxs(Providers, { children: [
        /* @__PURE__ */ jsx(Header, {}),
        children
      ] }),
      /* @__PURE__ */ jsx(TanStackDevtools, { config: {
        position: "bottom-right"
      }, plugins: [{
        name: "Tanstack Router",
        render: /* @__PURE__ */ jsx(TanStackRouterDevtoolsPanel, {})
      }] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$7 = () => import('./index-xSoY6ENZ.mjs');
const Route$b = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import('./sign-in-C2OxrdI4.mjs');
const Route$a = createFileRoute("/auth/sign-in")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const baseURL$1 = void 0;
const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: baseURL$1,
  plugins: [
    lastLoginMethodClient()
  ]
});
const baseURL = process.env.BOT_API_URL;
const Route$9 = createFileRoute("/api/queue/")({
  server: {
    handlers: {
      POST: async ({
        request
      }) => {
        if (!baseURL) {
          console.log("Server Error: BOT_API_URL not set");
          return json({
            error: "Server Error: BOT_API_URL not set"
          }, {
            status: 500
          });
        }
        const session = await authClient.getSession();
        if (!session) {
          return json({
            error: "Unauthorized"
          }, {
            status: 401
          });
        }
        const requestBody = await request.json().catch(() => null);
        if (!requestBody) {
          return json({
            error: "Invalid Response"
          }, {
            status: 400
          });
        }
        const apiURL = new URL(Route$9.path, baseURL).toString();
        const controller = new AbortController();
        const timeout = 10 * 60 * 1e3;
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
          const requestResponse = await fetch(apiURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timer);
          if (!requestResponse.ok) {
            const err = await requestResponse.text().catch(() => "");
            return json({
              error: "Bot API failed",
              detail: err
            }, {
              status: 502
            });
          }
          const success = await requestResponse.json().catch(() => null);
          return json({
            ok: true,
            success
          });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return json({
              error: "Request timed out"
            }, {
              status: 504
            });
          }
          return json({
            error: "Unexpected error",
            detail: String(err)
          }, {
            status: 500
          });
        } finally {
          clearTimeout(timer);
        }
      }
    }
  }
});
const Route$8 = createFileRoute("/api/healthz/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch(`${baseURL}/api/healthz`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (!response.ok) {
            const text = await response.text();
            return json({
              ok: false,
              error: "Upstream API error",
              detail: text
            }, {
              status: 502
            });
          }
          const data = await response.json();
          return json(data, {
            status: 200
          });
        } catch (error) {
          return json({
            ok: false,
            error: "Failed to contact Go API",
            detail: String(error)
          }, {
            status: 500
          });
        }
      }
    }
  }
});
const $$splitComponentImporter$5 = () => import('./start.server-funcs-D6mgIWLJ.mjs');
const TODOS_FILE = "todos.json";
async function readTodos() {
  return JSON.parse(await fs.promises.readFile(TODOS_FILE, "utf-8").catch(() => JSON.stringify([{
    id: 1,
    name: "Get groceries"
  }, {
    id: 2,
    name: "Buy a new phone"
  }], null, 2)));
}
const getTodos_createServerFn_handler = createServerRpc("c9d51a5243700889c80f82ed57a4ce74b25f188e5ebd534c9c64965dc44e8e8d", (opts, signal) => {
  return getTodos.__executeServer(opts, signal);
});
const getTodos = createServerFn({
  method: "GET"
}).handler(getTodos_createServerFn_handler, async () => await readTodos());
const Route$7 = createFileRoute("/demo/start/server-funcs")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component"),
  loader: async () => await getTodos()
});
const $$splitComponentImporter$4 = () => import('./start.api-request-DhPN1_Dc.mjs');
const Route$6 = createFileRoute("/demo/start/api-request")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const Route$5 = createFileRoute("/demo/api/names")({
  server: {
    handlers: {
      GET: () => json(["Alice", "Bob", "Charlie"])
    }
  }
});
const connection = postgres(process.env.BETTER_AUTH_DB_URL);
const db = drizzle(connection);
const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  plugins: [
    lastLoginMethod(),
    haveIBeenPwned({
      customPasswordCompromisedMessage: "Password has been Pwned! Please choose a more secure password For more details, visit https://haveibeenpwned.com/"
    }),
    reactStartCookies()
  ],
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: "http://localhost:1339"
});
const Route$4 = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({
        request
      }) => {
        return auth.handler(request);
      },
      POST: ({
        request
      }) => {
        return auth.handler(request);
      }
    }
  }
});
const $$splitComponentImporter$3 = () => import('./start.ssr.index-BmCCCK3g.mjs');
const Route$3 = createFileRoute("/demo/start/ssr/")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import('./start.ssr.spa-mode-BLOW-WGU.mjs');
const Route$2 = createFileRoute("/demo/start/ssr/spa-mode")({
  ssr: false,
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const getPunkSongs_createServerFn_handler = createServerRpc("f74da881407a186b78a7af058df21dafb0126eb11e5a4d54fd322e8feb5038f1", (opts, signal) => {
  return getPunkSongs.__executeServer(opts, signal);
});
const getPunkSongs = createServerFn({
  method: "GET"
}).handler(getPunkSongs_createServerFn_handler, async () => [{
  id: 1,
  name: "Teenage Dirtbag",
  artist: "Wheatus"
}, {
  id: 2,
  name: "Smells Like Teen Spirit",
  artist: "Nirvana"
}, {
  id: 3,
  name: "The Middle",
  artist: "Jimmy Eat World"
}, {
  id: 4,
  name: "My Own Worst Enemy",
  artist: "Lit"
}, {
  id: 5,
  name: "Fat Lip",
  artist: "Sum 41"
}, {
  id: 6,
  name: "All the Small Things",
  artist: "blink-182"
}, {
  id: 7,
  name: "Beverly Hills",
  artist: "Weezer"
}]);
const $$splitComponentImporter$1 = () => import('./start.ssr.full-ssr-BCP3VOSv.mjs');
const Route$1 = createFileRoute("/demo/start/ssr/full-ssr")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  loader: async () => await getPunkSongs()
});
const $$splitComponentImporter = () => import('./start.ssr.data-only-Dqa5TJ5b.mjs');
const Route = createFileRoute("/demo/start/ssr/data-only")({
  ssr: "data-only",
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  loader: async () => await getPunkSongs()
});
const IndexRoute = Route$b.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const AuthSignInRoute = Route$a.update({
  id: "/auth/sign-in",
  path: "/auth/sign-in",
  getParentRoute: () => Route$c
});
const ApiQueueIndexRoute = Route$9.update({
  id: "/api/queue/",
  path: "/api/queue/",
  getParentRoute: () => Route$c
});
const ApiHealthzIndexRoute = Route$8.update({
  id: "/api/healthz/",
  path: "/api/healthz/",
  getParentRoute: () => Route$c
});
const DemoStartServerFuncsRoute = Route$7.update({
  id: "/demo/start/server-funcs",
  path: "/demo/start/server-funcs",
  getParentRoute: () => Route$c
});
const DemoStartApiRequestRoute = Route$6.update({
  id: "/demo/start/api-request",
  path: "/demo/start/api-request",
  getParentRoute: () => Route$c
});
const DemoApiNamesRoute = Route$5.update({
  id: "/demo/api/names",
  path: "/demo/api/names",
  getParentRoute: () => Route$c
});
const ApiAuthSplatRoute = Route$4.update({
  id: "/api/auth/$",
  path: "/api/auth/$",
  getParentRoute: () => Route$c
});
const DemoStartSsrIndexRoute = Route$3.update({
  id: "/demo/start/ssr/",
  path: "/demo/start/ssr/",
  getParentRoute: () => Route$c
});
const DemoStartSsrSpaModeRoute = Route$2.update({
  id: "/demo/start/ssr/spa-mode",
  path: "/demo/start/ssr/spa-mode",
  getParentRoute: () => Route$c
});
const DemoStartSsrFullSsrRoute = Route$1.update({
  id: "/demo/start/ssr/full-ssr",
  path: "/demo/start/ssr/full-ssr",
  getParentRoute: () => Route$c
});
const DemoStartSsrDataOnlyRoute = Route.update({
  id: "/demo/start/ssr/data-only",
  path: "/demo/start/ssr/data-only",
  getParentRoute: () => Route$c
});
const rootRouteChildren = {
  IndexRoute,
  AuthSignInRoute,
  ApiAuthSplatRoute,
  DemoApiNamesRoute,
  DemoStartApiRequestRoute,
  DemoStartServerFuncsRoute,
  ApiHealthzIndexRoute,
  ApiQueueIndexRoute,
  DemoStartSsrDataOnlyRoute,
  DemoStartSsrFullSsrRoute,
  DemoStartSsrSpaModeRoute,
  DemoStartSsrIndexRoute
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));

export { Route$7 as R, authClient as a, Route$1 as b, Route as c, getPunkSongs as g, router as r };
//# sourceMappingURL=router-Dpgrn-8u.mjs.map
