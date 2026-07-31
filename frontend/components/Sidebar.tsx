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
  BellIcon,
  RequestIcon,
  LogoutIcon,
} from './icons';

const overviewLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/applications', label: 'Applications', icon: InboxIcon, badgeKey: 'pending' },
  { href: '/members', label: 'Members', icon: UsersIcon },
  { href: '/seating', label: 'Seating', icon: SeatingIcon, feature: 'SEATING' },
  { href: '/payments', label: 'Payments', icon: PaymentsIcon },
  { href: '/expenses', label: 'Expenses', icon: ExpensesIcon, feature: 'EXPENSES' },
  { href: '/portal/notices', label: 'Notices', icon: BellIcon, feature: 'NOTICES' },
  { href: '/portal/requests', label: 'Requests', icon: RequestIcon, badgeKey: 'requests', feature: 'REQUESTS' },
  { href: '/reports', label: 'Reports', icon: ReportsIcon, feature: 'REPORTS' },
];

const systemLinks = [{ href: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['TENANT_OWNER'] }];

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout, branches, activeBranchId, switchBranch, enabledFeatures, tenantName } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [openRequestCount, setOpenRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.applications('PENDING').then((apps) => setPendingCount(apps.length ?? 0)).catch(() => {});
    api
      .allRequests()
      .then((reqs) => setOpenRequestCount((reqs ?? []).filter((r: any) => r.status === 'OPEN').length))
      .catch(() => {});
  }, [user]);

  const badgeCounts: Record<string, number> = { pending: pendingCount, requests: openRequestCount };

  const renderLink = (link: (typeof overviewLinks)[number]) => {
    const active = pathname === link.href;
    const Icon = link.icon;
    const count = link.badgeKey ? badgeCounts[link.badgeKey] ?? 0 : 0;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onClose}
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
        {count > 0 && (
          <span className="text-xs rounded-full px-1.5 py-0.5 bg-accent/15 text-accent">
            {count}
          </span>
        )}
      </Link>
    );
  };

  const visibleOverviewLinks = overviewLinks.filter(
    (l) => !l.feature || !enabledFeatures || enabledFeatures.includes(l.feature),
  );
  const visibleSystemLinks = systemLinks.filter((l) => !l.roles || (user && l.roles.includes(user.role)));

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}
      <aside
        className={`w-60 bg-white text-gray-700 border-r border-black/5 flex flex-col h-screen fixed md:sticky top-0 left-0 z-40 px-3 py-5 transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-accent" />
        <div className="min-w-0">
          <div className="font-serif font-semibold leading-tight text-gray-900 truncate">
            {tenantName ?? 'Loading…'}
          </div>
          <div className="text-[10px] text-gray-400 tracking-wide">ADMIN CONSOLE</div>
        </div>
      </div>

      <div className="text-[10px] tracking-widest text-gray-400 px-2 mb-2">OVERVIEW</div>
      {visibleOverviewLinks.map(renderLink)}

      {visibleSystemLinks.length > 0 && (
        <>
          <div className="text-[10px] tracking-widest text-gray-400 px-2 mt-6 mb-2">SYSTEM</div>
          {visibleSystemLinks.map(renderLink)}
        </>
      )}

      <div className="mt-auto pt-4 border-t border-black/10 px-2">
        {branches.length > 1 && (
          <div className="mb-3">
            <div className="text-[10px] tracking-widest text-gray-400 mb-1">BRANCH</div>
            <select
              value={activeBranchId ?? ''}
              onChange={(e) => switchBranch(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <p className="text-center text-[10px] text-gray-300 mt-2">Powered by StudyHallPro</p>
      </div>
      </aside>
    </>
  );
}
