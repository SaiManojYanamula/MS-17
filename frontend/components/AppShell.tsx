'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import SuperAdminSidebar from './SuperAdminSidebar';
import StudentSidebar from './StudentSidebar';
import { MenuIcon } from './icons';
import { useAuth } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, tenantName } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isStudent = user?.role === 'STUDENT';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const homeRoute = isStudent ? '/portal' : isSuperAdmin ? '/super-admin' : '/dashboard';
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/apply');
  const inSuperAdminArea = pathname === '/super-admin' || pathname.startsWith('/super-admin/');
  const inPortalArea = pathname === '/portal' || pathname.startsWith('/portal/');
  // Notices and Requests are role-branched pages shared by staff and students —
  // everything else under /portal is student-exclusive.
  const isSharedPortalPage = pathname === '/portal/notices' || pathname === '/portal/requests';
  const inStudentOnlyArea = inPortalArea && !isSharedPortalPage;

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace(homeRoute);
    } else if (user && isStudent && !inPortalArea) {
      router.replace('/portal');
    } else if (user && isSuperAdmin && (inPortalArea || !inSuperAdminArea)) {
      router.replace('/super-admin');
    } else if (user && !isStudent && !isSuperAdmin && (inStudentOnlyArea || inSuperAdminArea)) {
      router.replace('/dashboard');
    }
  }, [loading, user, isStudent, isSuperAdmin, inSuperAdminArea, inPortalArea, inStudentOnlyArea, homeRoute, pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading) return null;

  // Public routes (login, the QR-code apply form) must never show admin
  // chrome — even if the visitor happens to still be logged in as staff in
  // the same browser (e.g. testing their own QR code from the dashboard).
  if (!user || isPublicRoute) {
    return <>{children}</>;
  }

  const brandName = isSuperAdmin ? 'StudyHallPro' : tenantName ?? 'Loading…';

  const MobileTopBar = (
    <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 bg-white border-b border-black/5 px-4 py-3">
      <button
        onClick={() => setMobileNavOpen(true)}
        className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center text-gray-600"
      >
        <MenuIcon />
      </button>
      <div className="w-6 h-6 rounded-full bg-accent shrink-0" />
      <span className="font-serif font-semibold text-sm truncate">{brandName}</span>
    </div>
  );

  if (isStudent) {
    return (
      <div className="flex flex-col md:flex-row text-gray-900">
        {MobileTopBar}
        <StudentSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="flex flex-col md:flex-row text-gray-900">
        {MobileTopBar}
        <SuperAdminSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row text-gray-900">
      {MobileTopBar}
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
