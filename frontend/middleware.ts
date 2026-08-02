import { NextRequest, NextResponse } from 'next/server';

// Every tenant gets `<slug>.studyhallpro.com` pointing at this same app (one
// wildcard DNS record + one wildcard Railway domain, no per-client deploy).
// Login/dashboard/portal already resolve the tenant from the JWT, not the
// URL, so they work unchanged on any subdomain — only the bare root "/"
// needs rewriting, from the generic dashboard-redirect to that tenant's
// public booking page.
const APEX = 'studyhallpro.com';
const RESERVED_SUBDOMAINS = new Set(['www', 'dev', 'api', 'api-dev', 'app', 'admin']);

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0];

  if (!host.endsWith(`.${APEX}`)) return NextResponse.next();

  const subdomain = host.slice(0, -(`.${APEX}`.length));
  if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL(`/apply/${subdomain}`, req.url));
}

export const config = {
  matcher: '/',
};
