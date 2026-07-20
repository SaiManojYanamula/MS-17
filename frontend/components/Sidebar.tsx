'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  DashboardIcon,
  InboxIcon,
  UsersIcon,
  SeatingIcon,
  PaymentsIcon,
  ExpensesIcon,
  ReportsIcon,
  SettingsIcon,
  LogoutIcon,
} from './icons';

const overviewLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/applications', label: 'Applications', icon: InboxIcon, badgeKey: 'pending' },
  { href: '/members', label: 'Members', icon: UsersIcon },
  { href: '/seating', label: 'Seating', icon: SeatingIcon },
  { href: '/payments', label: 'Payments', icon: PaymentsIcon },
  { href: '/expenses', label: 'Expenses', icon: ExpensesIcon },
  { href: '/reports', label: 'Reports', icon: ReportsIcon },
];

const systemLinks = [{ href: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['TENANT_OWNER'] }];

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
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm mb-1 border-l-2 transition-colors ${
          active
            ? 'bg-accent/10 text-accent font-medium border-accent'
            : 'text-gray-600 border-transparent hover:bg-black/5 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon />
          {link.label}
        </span>
        {link.badgeKey && pendingCount > 0 && (
          <span className="text-xs rounded-full px-1.5 py-0.5 bg-accent/15 text-accent">
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
    <aside className="w-60 bg-white text-gray-700 border-r border-black/5 flex flex-col h-screen sticky top-0 px-3 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-accent" />
        <div>
          <div className="font-serif font-semibold leading-tight text-gray-900">Akshara</div>
          <div className="text-[10px] text-gray-400 tracking-wide">ADMIN CONSOLE</div>
        </div>
      </div>

      <div className="text-[10px] tracking-widest text-gray-400 px-2 mb-2">OVERVIEW</div>
      {overviewLinks.map(renderLink)}

      {visibleSystemLinks.length > 0 && (
        <>
          <div className="text-[10px] tracking-widest text-gray-400 px-2 mt-6 mb-2">SYSTEM</div>
          {visibleSystemLinks.map(renderLink)}
        </>
      )}

      <div className="mt-auto pt-4 border-t border-black/10 px-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="text-sm flex-1 min-w-0">
            <div className="font-medium leading-tight truncate text-gray-900">{user?.name}</div>
            <div className="text-[10px] text-gray-400">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-expiring/10 hover:text-expiring"
        >
          <LogoutIcon /> Log out
        </button>
      </div>
    </aside>
  );
}
