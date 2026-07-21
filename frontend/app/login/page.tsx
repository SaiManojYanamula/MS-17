'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
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
    <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
      <div className="bg-card rounded-xl p-8 w-full max-w-sm border border-black/5">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-accent" />
          <div>
            <div className="font-serif font-semibold leading-tight">Akshara</div>
            <div className="text-[10px] text-gray-400 tracking-wide">ADMIN CONSOLE</div>
          </div>
        </div>
        <h1 className="text-xl font-serif font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">
          Admin & staff use their email — students sign in with their phone number
        </p>
        <form onSubmit={onSubmit}>
          <label className="block text-xs text-gray-500 mb-1">Email or Phone Number</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
          />
          <label className="block text-xs text-gray-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-4"
          />
          {error && <p className="text-xs text-expiring mb-4">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
