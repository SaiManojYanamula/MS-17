'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function PortalHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-black/10 bg-card">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent" />
        <div>
          <div className="font-serif font-semibold leading-tight">Akshara</div>
          <div className="text-[10px] text-gray-400 tracking-wide">MY MEMBERSHIP</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{user?.name}</span>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="text-sm text-gray-500 hover:text-sidebar"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
