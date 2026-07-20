'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.organizations().then(setOrgs).catch(() => setError('Could not load organizations'));
  }, []);

  const totalBranches = orgs.reduce((sum, o) => sum + (o.branches?.length ?? 0), 0);
  const totalUsers = orgs.reduce((sum, o) => sum + (o._count?.users ?? 0), 0);
  const totalMembers = orgs.reduce((sum, o) => sum + (o._count?.members ?? 0), 0);
  const suspended = orgs.filter((o) => o.status === 'SUSPENDED').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Platform Overview{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-sm text-gray-500">Every organization on the platform, at a glance</p>
        </div>
        <TopBar />
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="⌂" value={String(orgs.length)} label="Organizations" />
        <StatCard icon="▥" value={String(totalBranches)} label="Branches" />
        <StatCard icon="☺" value={String(totalUsers)} label="Staff Users" />
        <StatCard
          icon="⚠"
          value={String(suspended)}
          label="Suspended Organizations"
          actionNeeded={suspended > 0}
        />
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-semibold">Recent Organizations</h2>
          <Link href="/super-admin/organizations" className="text-xs text-accent font-medium">
            VIEW ALL
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide">
              <th className="pb-2 font-normal">ORGANIZATION</th>
              <th className="pb-2 font-normal">PLAN</th>
              <th className="pb-2 font-normal">STATUS</th>
              <th className="pb-2 font-normal">BRANCHES</th>
              <th className="pb-2 font-normal">MEMBERS</th>
            </tr>
          </thead>
          <tbody>
            {orgs.slice(0, 5).map((o) => (
              <tr key={o.id} className="border-t border-black/5">
                <td className="py-2.5 font-medium">{o.name}</td>
                <td>{o.plan}</td>
                <td>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      o.status === 'SUSPENDED' ? 'bg-expiring/20 text-expiring' : 'bg-free/20 text-free'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td>{o.branches?.length ?? 0}</td>
                <td>{o._count?.members ?? 0}</td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No organizations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
