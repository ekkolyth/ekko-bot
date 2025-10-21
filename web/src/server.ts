// src/server.ts
import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server'

// RFC-safe split in case getSetCookie() isn't available in your runtime
function splitSetCookieHeader(headerValue: string): string[] {
  // Split on commas that start a new cookie: ", <token>="
  // (commas inside attributes like Expires are preserved)
  return headerValue.split(/,(?=\s*[^;=]+?=)/g).map(s => s.trim()).filter(Boolean)
}

const handler = defineHandlerCallback(async (ctx) => {
  const res = await defaultStreamHandler(ctx)

  // Collect cookies from the returned Response
  const h = res.headers
  const direct = h.get('set-cookie') // may contain multiple, comma-joined

  // Prefer the Fetch API helper if available (Node 22+/Undici, CF Workers)
  // @ts-ignore - not in older TS lib DOM
  const list: string[] | undefined = h.getSetCookie?.()

  if (list?.length) {
    // Rebuild headers with one Set-Cookie per cookie
    const newHeaders = new Headers(res.headers)
    newHeaders.delete('set-cookie')
    for (const c of list) newHeaders.append('set-cookie', c)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: newHeaders })
  }

  if (direct && direct.includes(',')) {
    const parts = splitSetCookieHeader(direct)
    const newHeaders = new Headers(res.headers)
    newHeaders.delete('set-cookie')
    for (const c of parts) newHeaders.append('set-cookie', c)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: newHeaders })
  }

  return res
})

const fetch = createStartHandler(handler)
export default { fetch }
