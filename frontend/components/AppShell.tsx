'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import PortalHeader from './PortalHeader';
import { useAuth } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isStudent = user?.role === 'STUDENT';
  const homeRoute = isStudent ? '/portal' : '/dashboard';
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/apply');

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace(homeRoute);
    } else if (user && isStudent && pathname !== '/portal') {
      router.replace('/portal');
    } else if (user && !isStudent && pathname === '/portal') {
      router.replace('/dashboard');
    }
  }, [loading, user, isStudent, homeRoute, pathname, router]);

  if (loading) return null;

  if (!user) {
    return <>{children}</>;
  }

  if (isStudent) {
    return (
      <div className="text-gray-900">
        <PortalHeader />
        <main className="max-w-2xl mx-auto p-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
