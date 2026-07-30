'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      router.push(loggedInUser.role === 'STUDENT' ? '/portal' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-accent/40 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/90" />
            <span className="font-serif font-semibold text-lg">Akshara</span>
          </div>

          <div>
            <h1 className="font-serif text-4xl leading-tight font-semibold mb-4 max-w-md">
              Run your study hall like a business, not a spreadsheet.
            </h1>
            <p className="text-white/70 text-sm max-w-sm">
              Seating, memberships, payments, and student self-booking — all in one place,
              built for coaching centers and study halls.
            </p>
          </div>

          <div className="flex items-center gap-8 text-xs text-white/60">
            <div>
              <div className="text-white text-xl font-serif font-semibold">Live</div>
              <div>Seat availability</div>
            </div>
            <div>
              <div className="text-white text-xl font-serif font-semibold">Instant</div>
              <div>Student booking</div>
            </div>
            <div>
              <div className="text-white text-xl font-serif font-semibold">Multi</div>
              <div>Branch support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-accent" />
            <div>
              <div className="font-serif font-semibold leading-tight">Akshara</div>
              <div className="text-[10px] text-gray-400 tracking-wide">ADMIN CONSOLE</div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-card border border-black/5">
            <h1 className="text-2xl font-serif font-semibold mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-6">
              Admin &amp; staff use their email — students sign in with their phone number
            </p>
            <form onSubmit={onSubmit}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border border-black/10 rounded-lg px-3.5 py-2.5 text-sm mb-4 transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3.5 py-2.5 text-sm mb-4 transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowForgot((v) => !v)}
                className="text-xs text-accent font-medium mb-4 -mt-2 block"
              >
                Forgot password?
              </button>
              {showForgot && (
                <p className="text-xs text-gray-500 bg-black/[0.03] rounded-lg px-3 py-2 mb-4">
                  Students: ask your study hall's admin/staff to reset it from the Members page.
                  Admin/staff: ask your study hall owner to reset it from Settings. Owners: contact
                  the platform admin.
                </p>
              )}
              {error && (
                <p className="text-xs text-expiring bg-expiring/5 border border-expiring/20 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium shadow-soft transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:hover:brightness-100"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
