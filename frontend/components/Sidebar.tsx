'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const overviewLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/applications', label: 'Applications', icon: '▤', badgeKey: 'pending' },
  { href: '/members', label: 'Members', icon: '☺' },
  { href: '/seating', label: 'Seating', icon: '▥' },
  { href: '/payments', label: 'Payments', icon: '▣' },
  { href: '/reports', label: 'Reports', icon: '▨' },
];

const systemLinks = [{ href: '/settings', label: 'Settings', icon: '⚙', roles: ['TENANT_OWNER'] }];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.applications('PENDING').then((apps) => setPendingCount(apps.length ?? 0)).catch(() => {});
  }, [user]);

  const renderLink = (link: (typeof overviewLinks)[number]) => {
    const active = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
          active ? 'bg-accent text-white font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="w-4 text-center">{link.icon}</span>
          {link.label}
        </span>
        {link.badgeKey && pendingCount > 0 && (
          <span
            className={`text-xs rounded-full px-1.5 py-0.5 ${
              active ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent'
            }`}
          >
            {pendingCount}
          </span>
        )}
      </Link>
    );
  };

  const visibleSystemLinks = systemLinks.filter((l) => !l.roles || (user && l.roles.includes(user.role)));

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="w-60 bg-navy text-white flex flex-col h-screen sticky top-0 px-3 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-accent" />
        <div>
          <div className="font-serif font-semibold leading-tight">Akshara</div>
          <div className="text-[10px] text-gray-400 tracking-wide">ADMIN CONSOLE</div>
        </div>
      </div>

      <div className="text-[10px] tracking-widest text-gray-500 px-2 mb-2">OVERVIEW</div>
      {overviewLinks.map(renderLink)}

      {visibleSystemLinks.length > 0 && (
        <>
          <div className="text-[10px] tracking-widest text-gray-500 px-2 mt-6 mb-2">SYSTEM</div>
          {visibleSystemLinks.map(renderLink)}
        </>
      )}

      <div className="mt-auto pt-4 border-t border-white/10 px-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="text-sm flex-1 min-w-0">
            <div className="font-medium leading-tight truncate">{user?.name}</div>
            <div className="text-[10px] text-gray-400">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <span className="w-4 text-center">⏻</span> Log out
        </button>
      </div>
    </aside>
  );
}
