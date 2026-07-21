'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusPill from '@/components/StatusPill';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import RequestModal from '@/components/RequestModal';
import IdCardModal from '@/components/IdCardModal';
import { api } from '@/lib/api';
import { formatDate, formatPlan, planProgress, latestPaymentAmount } from '@/lib/format';

const quickActions = [
  { key: 'RENEWAL', icon: '↻', label: 'Renew Membership', desc: 'Extend your current plan' },
  { key: 'SEAT_CHANGE', icon: '▥', label: 'Request Seat Change', desc: 'Ask for a different seat or batch' },
  { key: 'ID_CARD', icon: '⧉', label: 'Download ID Card', desc: 'Your digital membership card' },
  { key: 'ISSUE', icon: '⚠', label: 'Report an Issue', desc: 'Seat, AC, wifi, or anything else' },
];

export default function PortalPage() {
  const [member, setMember] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [requestType, setRequestType] = useState<string | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    api.myMember().then(setMember).catch((err) => setError(err.message || 'Could not load your membership'));
    api.notices().then(setNotices).catch(() => {});
    api.myAttendance().then(setAttendance).catch(() => {});
  }, []);

  if (error) {
    return <p className="text-sm text-expiring">{error}</p>;
  }

  if (!member) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  const progress = planProgress(member.plan, member.expiresAt);
  const fee = latestPaymentAmount(member.payments);
  const recentPayments = [...(member.payments ?? [])]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const now = new Date();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{member.name}</h1>
        <p className="text-sm text-gray-500">{member.goalTag || 'Member'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-black/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-400">STUDENT ID</div>
              <div className="font-medium">{member.displayId || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">FEE (MONTHLY)</div>
              <div className="font-medium">{fee != null ? `₹${fee}` : '—'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Plan progress</span>
            <span>
              {progress.daysUsed} / {progress.totalDays} days used
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Notices</h2>
            <Link href="/portal/notices" className="text-xs text-accent font-medium">
              VIEW ALL
            </Link>
          </div>
          {notices.slice(0, 2).map((n: any) => (
            <div key={n.id} className="text-xs mb-2 last:mb-0">
              <p className="text-gray-700">{n.title}</p>
              <p className="text-gray-400">{formatDate(n.createdAt)}</p>
            </div>
          ))}
          {notices.length === 0 && <p className="text-xs text-gray-400">No notices yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-serif font-semibold">Payment History</h2>
            <Link href="/portal/payments" className="text-xs text-accent font-medium">
              4 RECENT
            </Link>
          </div>
          <table className="w-full text-sm mt-3 min-w-[420px]">
            <thead>
              <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
                <th className="p-4 font-normal">DATE</th>
                <th className="font-normal">DESCRIPTION</th>
                <th className="font-normal">AMOUNT</th>
                <th className="font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p: any) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="p-4">{formatDate(p.createdAt)}</td>
                  <td>{p.label}</td>
                  <td>₹{p.amount}</td>
                  <td>
                    <StatusPill status={p.status} />
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-semibold">Attendance — {now.toLocaleDateString('en-IN', { month: 'long' })}</h2>
          </div>
          <AttendanceCalendar records={attendance} year={now.getFullYear()} month={now.getMonth()} />
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <h2 className="font-serif font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.key}
              onClick={() => (a.key === 'ID_CARD' ? setShowIdCard(true) : setRequestType(a.key))}
              className="text-left border border-black/10 rounded-lg p-3 hover:border-accent/40 hover:bg-accent/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-2 text-sm">
                {a.icon}
              </div>
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-xs text-gray-400">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {requestType && (
        <RequestModal
          initialType={requestType}
          onClose={() => setRequestType(null)}
          onSuccess={() => {}}
        />
      )}
      {showIdCard && <IdCardModal member={member} onClose={() => setShowIdCard(false)} />}
    </div>
  );
}
