'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  DashboardIcon,
  BuildingIcon,
  BranchIcon,
  UsersIcon,
  ShieldIcon,
  PlansIcon,
  BackupIcon,
  LogoutIcon,
} from './icons';

const links = [
  { href: '/super-admin', label: 'Dashboard', icon: DashboardIcon },
  { href: '/super-admin/organizations', label: 'Organizations', icon: BuildingIcon },
  { href: '/super-admin/branches', label: 'Branches', icon: BranchIcon },
  { href: '/super-admin/users', label: 'Users', icon: UsersIcon },
  { href: '/super-admin/roles', label: 'Roles & Permissions', icon: ShieldIcon },
  { href: '/super-admin/subscriptions', label: 'Subscription & Plans', icon: PlansIcon },
  { href: '/super-admin/backups', label: 'Backups', icon: BackupIcon },
];

export default function SuperAdminSidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        <div>
          <div className="font-serif font-semibold leading-tight text-gray-900">StudyHallPro</div>
          <div className="text-[10px] text-gray-400 tracking-wide">SUPER ADMIN</div>
        </div>
      </div>

      <div className="text-[10px] tracking-widest text-gray-400 px-2 mb-2">PLATFORM</div>
      {links.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm mb-1 border-l-2 transition-colors ${
              active
                ? 'bg-accent/10 text-accent font-medium border-accent'
                : 'text-gray-600 border-transparent hover:bg-black/5 hover:text-gray-900'
            }`}
          >
            <Icon />
            {link.label}
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
            <div className="text-[10px] text-gray-400">SUPER ADMIN</div>
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
    </>
  );
}
