'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  DashboardIcon,
  IdCardIcon,
  PaymentsIcon,
  CalendarIcon,
  BellIcon,
  RequestIcon,
  PlansIcon,
  LogoutIcon,
} from './icons';

const links = [
  { href: '/portal', label: 'Dashboard', icon: DashboardIcon },
  { href: '/portal/membership', label: 'My Membership', icon: IdCardIcon },
  { href: '/portal/update-membership', label: 'Update Membership', icon: PlansIcon, feature: 'REQUESTS' },
  { href: '/portal/payments', label: 'Payments', icon: PaymentsIcon },
  { href: '/portal/attendance', label: 'Attendance', icon: CalendarIcon, feature: 'ATTENDANCE' },
  { href: '/portal/notices', label: 'Notices', icon: BellIcon, badgeKey: 'notices', feature: 'NOTICES' },
  { href: '/portal/requests', label: 'Raise a Request', icon: RequestIcon, feature: 'REQUESTS' },
];

export default function StudentSidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout, enabledFeatures, tenantName } = useAuth();
  const [recentNoticeCount, setRecentNoticeCount] = useState(0);

  const visibleLinks = links.filter(
    (l) => !l.feature || !enabledFeatures || enabledFeatures.includes(l.feature),
  );

  useEffect(() => {
    if (!user || (enabledFeatures && !enabledFeatures.includes('NOTICES'))) return;
    api
      .notices()
      .then((notices) => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = (notices ?? []).filter((n: any) => new Date(n.createdAt).getTime() >= weekAgo);
        setRecentNoticeCount(recent.length);
      })
      .catch(() => {});
  }, [user, enabledFeatures]);

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
          <div className="text-[10px] text-gray-400 tracking-wide">STUDENT PORTAL</div>
        </div>
      </div>

      <div className="text-[10px] tracking-widest text-gray-400 px-2 mb-2">OVERVIEW</div>
      {visibleLinks.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        const badgeCount = link.badgeKey === 'notices' ? recentNoticeCount : 0;
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
            {badgeCount > 0 && (
              <span className="text-xs rounded-full px-1.5 py-0.5 bg-accent/15 text-accent">
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-black/10 px-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="text-sm flex-1 min-w-0">
            <div className="font-medium leading-tight truncate text-gray-900">{user?.name}</div>
            <div className="text-[10px] text-gray-400">STUDENT</div>
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
