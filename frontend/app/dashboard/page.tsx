'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import AddMemberModal from '@/components/AddMemberModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatPlan } from '@/lib/format';
import {
  mockDashboard,
  mockPendingApplications,
  mockRecentActivity,
  mockRevenueTrend,
} from '@/lib/mockData';

const CHART_ACCENT = '#0d9488';
const CHART_HIGHLIGHT = '#0f172a';
const CHART_MUTED = '#898781';

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-black/10 shadow-lg px-3 py-2 text-xs">
      <div className="text-gray-400 mb-0.5">{label}</div>
      <div className="font-medium">₹{payload[0].value.toLocaleString('en-IN')}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(mockDashboard);
  const [pending, setPending] = useState(mockPendingApplications);
  const [activity, setActivity] = useState(mockRecentActivity);
  const [revenue] = useState(mockRevenueTrend);
  const [showAddMember, setShowAddMember] = useState(false);

  const refetch = () => {
    // Falls back to bundled demo data if the backend isn't running yet —
    // remove the catch fallback once the API is live.
    api.dashboardStats().then(setStats).catch(() => {});
    api.applications('PENDING').then(setPending).catch(() => {});
    api.recentActivity(5).then(setActivity).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Good morning{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-sm text-gray-500">Room status: Open</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar />
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + New Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👤" value={String(stats.activeMembers)} label="Active Members" />
        <StatCard
          icon="🪑"
          value={`${stats.seatsOccupied} / ${stats.seatsTotal}`}
          label="Seats Occupied"
          changePct={26}
        />
        <StatCard
          icon="📥"
          value={String(stats.pendingApplications)}
          label="Pending Applications"
          actionNeeded={stats.pendingApplications > 0}
        />
        <StatCard
          icon="₹"
          value={`₹${(stats.revenueThisMonth / 100000).toFixed(2)}L`}
          label="Revenue This Month"
          changePct={stats.revenueChangePct}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-black/5 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-semibold">Pending Applications</h2>
            <Link href="/applications" className="text-xs text-accent font-medium">
              VIEW ALL
            </Link>
          </div>
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-[10px] text-gray-400 tracking-wide">
                <th className="pb-2 font-normal">APPLICANT</th>
                <th className="pb-2 font-normal">PLAN</th>
                <th className="pb-2 font-normal">BATCH</th>
                <th className="pb-2 font-normal">APPLIED</th>
                <th className="pb-2 font-normal">STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.map((a: any) => (
                <tr key={a.id} className="border-t border-black/5">
                  <td className="py-2.5">
                    <div className="font-medium">{a.applicant}</div>
                    <div className="text-xs text-gray-400">{a.goalTag}</div>
                  </td>
                  <td>{formatPlan(a.plan)}</td>
                  <td>{a.batch}</td>
                  <td>{formatDate(a.appliedAt)}</td>
                  <td>
                    <span className="text-[10px] bg-accent/20 text-accent rounded-full px-2 py-0.5">
                      PENDING
                    </span>
                  </td>
                  <td className="flex gap-2 py-2.5">
                    <button className="w-6 h-6 rounded-full bg-free/20 text-free text-xs">✓</button>
                    <button className="w-6 h-6 rounded-full bg-expiring/20 text-expiring text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-semibold">Recent Activity</h2>
            <span className="text-xs text-accent font-medium">VIEW ALL</span>
          </div>
          <ul className="space-y-3">
            {activity.map((a: any, i: number) => (
              <li key={i} className="text-sm">
                <p>{a.text}</p>
                <p className="text-[10px] text-gray-400">{a.at}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif font-semibold">Revenue — Last 6 Months</h2>
        </div>
        <div className="text-xl font-serif font-semibold mb-3">
          ₹{stats.revenueThisMonth.toLocaleString('en-IN')}
          <span className="text-xs text-free ml-2 font-sans">+{stats.revenueChangePct}% vs last</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: CHART_MUTED }}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(13,148,136,0.06)' }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {revenue.map((r: any, i: number) => (
                  <Cell key={i} fill={i === revenue.length - 1 ? CHART_HIGHLIGHT : CHART_ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal onClose={() => setShowAddMember(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
