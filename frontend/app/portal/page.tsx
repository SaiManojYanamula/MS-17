'use client';

import { useEffect, useState } from 'react';
import StatusPill from '@/components/StatusPill';
import { api } from '@/lib/api';
import { formatDate, formatPlan, seatNumberOf } from '@/lib/format';

export default function PortalPage() {
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myMember()
      .then(setMember)
      .catch((err) => setError(err.message || 'Could not load your membership'));
  }, []);

  if (error) {
    return <p className="text-sm text-expiring">{error}</p>;
  }

  if (!member) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{member.name}</h1>
        <p className="text-sm text-gray-500">{member.goalTag || 'Member'}</p>
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <h2 className="font-serif font-semibold mb-4">Membership</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="font-medium">{formatPlan(member.plan)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Batch</span>
            <span className="font-medium">{member.batch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Seat</span>
            <span className="font-medium">#{seatNumberOf(member.seat)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Expires</span>
            <span className="font-medium">{formatDate(member.expiresAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status</span>
            <StatusPill status={member.status} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-black/5 overflow-hidden">
        <h2 className="font-serif font-semibold p-5 pb-0">Payment History</h2>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">LABEL</th>
              <th className="font-normal">AMOUNT</th>
              <th className="font-normal">METHOD</th>
              <th className="font-normal">DATE</th>
              <th className="font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {(member.payments ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="p-4">{p.label}</td>
                <td>₹{p.amount}</td>
                <td>
                  <span className="text-xs bg-black/5 rounded-full px-2 py-0.5">{p.method}</span>
                </td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <StatusPill status={p.status} />
                </td>
              </tr>
            ))}
            {(!member.payments || member.payments.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
