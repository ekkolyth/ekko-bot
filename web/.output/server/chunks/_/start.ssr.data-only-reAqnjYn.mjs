import { jsx, jsxs } from 'react/jsx-runtime';
import { b as Route } from './router-DS8VtDbX.mjs';
import '@tanstack/react-router';
import '@tanstack/react-router-devtools';
import '@tanstack/react-devtools';
import 'react';
import 'lucide-react';
import '../virtual/entry.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'node:async_hooks';
import '@tanstack/react-router/ssr/server';
import 'better-auth';
import 'better-auth/adapters/drizzle';
import 'drizzle-orm/postgres-js';
import 'postgres';
import 'dotenv';
import 'better-auth/plugins';

function RouteComponent() {
  const punkSongs = Route.useLoaderData();
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white", style: {
    backgroundImage: "radial-gradient(50% 50% at 20% 60%, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)"
  }, children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-6 text-pink-400", children: "Data Only SSR - Punk Songs" }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: punkSongs.map((song) => /* @__PURE__ */ jsxs("li", { className: "bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm shadow-md", children: [
      /* @__PURE__ */ jsx("span", { className: "text-lg text-white font-medium", children: song.name }),
      /* @__PURE__ */ jsxs("span", { className: "text-white/60", children: [
        " - ",
        song.artist
      ] })
    ] }, song.id)) })
  ] }) });
}

export { RouteComponent as component };
//# sourceMappingURL=start.ssr.data-only-reAqnjYn.mjs.map
