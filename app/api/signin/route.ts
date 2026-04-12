import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ONE_HOUR = 60 * 60;

function getMaxAge(expiresAt?: string | null) {
  if (!expiresAt) return ONE_HOUR;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return ONE_HOUR;
  const diffSeconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  return diffSeconds || ONE_HOUR;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.MARKET_PULSE_BASE_URL ?? 'http://115.124.97.148:8081';
  const endpoint = new URL('/api/signin/', baseUrl).toString();

  const envScheme = process.env.MARKET_PULSE_AUTH_SCHEME;

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Signin failed', status: upstream.status, body: text },
      { status: upstream.status }
    );
  }

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'Unexpected response from auth server.' },
      { status: 502 }
    );
  }

  const accessToken = data?.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token received from auth server.' },
      { status: 502 }
    );
  }

  const looksLikeJwt =
    typeof accessToken === 'string' && accessToken.split('.').length === 3;
  const scheme = envScheme ?? (looksLikeJwt ? 'Bearer' : 'Token');

  const response = NextResponse.json(
    {
      status: true,
      name: data?.name ?? null,
      expires_at: data?.expires_at ?? null,
      access_token: accessToken,
      scheme,
    },
    { status: 200 }
  );

  response.cookies.set({
    name: 'mp_access',
    value: accessToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: getMaxAge(data?.expires_at ?? null),
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
