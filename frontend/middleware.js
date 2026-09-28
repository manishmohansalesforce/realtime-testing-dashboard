/**
 * Proxy /api on the Vercel dashboard to the Render API.
 *
 * The browser must not call *.onrender.com itself. Cloudflare challenges some
 * clients (Firefox on this Mac). fetch() then fails with NetworkError, and the
 * challenge page cannot be embedded (X-Frame-Options: SAMEORIGIN), which is the
 * "Firefox Can't Open This Page" frame. Other machines that are not challenged
 * keep working.
 *
 * x-middleware-override-headers replaces the entire header set, so every header
 * that should reach Render is copied across. The browser User-Agent and
 * client hints are not forwarded.
 */

const UPSTREAM = 'https://salesforce-cpq-dashboard-api.onrender.com'
const DROP = new Set(['host', 'connection', 'transfer-encoding'])

export default function middleware(request) {
  const incoming = new URL(request.url)
  const headers = new Headers(request.headers)
  headers.set('user-agent', 'RealtimeTestingDashboard/1.0')

  const names = []
  const responseHeaders = new Headers()
  responseHeaders.set('x-middleware-rewrite', `${UPSTREAM}${incoming.pathname}${incoming.search}`)
  for (const [key, value] of headers.entries()) {
    if (DROP.has(key) || key.startsWith('sec-')) continue
    names.push(key)
    responseHeaders.set(`x-middleware-request-${key}`, value)
  }
  responseHeaders.set('x-middleware-override-headers', names.join(','))
  return new Response(null, { headers: responseHeaders })
}

export const config = {
  matcher: '/api/:path*',
}
