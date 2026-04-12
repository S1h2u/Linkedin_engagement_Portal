'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setStatus('Signing in...');
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.error ?? data?.detail ?? 'Login failed.';
        throw new Error(message);
      }

      const data = await response.json().catch(() => ({}));
      const accessToken = data?.access_token as string | undefined;
      let scheme = (data?.scheme as string | undefined) ?? '';
      if (!scheme) {
        const looksLikeJwt =
          typeof accessToken === 'string' && accessToken.split('.').length === 3;
        scheme = looksLikeJwt ? 'Bearer' : 'Token';
      }
      const expiresAt = data?.expires_at as string | undefined;

      if (!accessToken) {
        throw new Error('No access token received from server.');
      }

      localStorage.setItem('mp_access', accessToken);
      localStorage.setItem('mp_scheme', scheme);

      let maxAge = 60 * 60;
      if (expiresAt) {
        const expiry = new Date(expiresAt).getTime();
        if (!Number.isNaN(expiry)) {
          maxAge = Math.max(60, Math.floor((expiry - Date.now()) / 1000));
        }
      }

      document.cookie = `mp_access=${accessToken}; path=/; max-age=${maxAge}`;
      document.cookie = `mp_scheme=${scheme}; path=/; max-age=${maxAge}`;

      setStatus('Validating news access...');
      const validate = await fetch('/api/market-pulse', {
        headers: { Authorization: `${scheme} ${accessToken}` },
        credentials: 'include',
      });

      if (!validate.ok) {
        const body = await validate.text();
        throw new Error(
          `Signed in, but news access failed (status ${validate.status}). ${body}`
        );
      }

      setStatus('Success. Redirecting...');
      window.location.href = '/';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f14] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,_rgba(14,116,144,0.2),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.2),_rgba(2,6,23,0.75))]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-8 shadow-2xl shadow-black/40">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Market Pulse</p>
            <h1 className="font-display mt-3 text-4xl leading-tight">
              Sign in to unlock the live news feed.
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Use your MSME backend credentials. Once signed in, we will automatically
              attach your token to load Market Pulse cards.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
              <li className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">Secure token</li>
              <li className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">Auto refresh</li>
              <li className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">No CORS issues</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-black/40">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                />
              </div>

              {error && <p className="text-red-300 text-sm">{error}</p>}
              {status && <p className="text-cyan-200 text-xs">{status}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500/90 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <a
              href="/"
              className="mt-4 inline-flex text-xs text-slate-400 hover:text-slate-200"
            >
              Back to Market Pulse
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
