'use client';

import { useEffect, useState } from 'react';
import StatusPill from '@/components/StatusPill';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function PortalPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myMember()
      .then((member) => {
        const sorted = [...(member.payments ?? [])].sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setPayments(sorted);
      })
      .catch((err) => setError(err.message || 'Could not load payments'));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold">Payments</h1>
        <p className="text-sm text-gray-500">Your full payment history</p>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">DATE</th>
              <th className="font-normal">DESCRIPTION</th>
              <th className="font-normal">AMOUNT</th>
              <th className="font-normal">METHOD</th>
              <th className="font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="p-4">{formatDate(p.createdAt)}</td>
                <td>{p.label}</td>
                <td>₹{p.amount}</td>
                <td>
                  <span className="text-xs bg-black/5 rounded-full px-2 py-0.5">{p.method}</span>
                </td>
                <td>
                  <StatusPill status={p.status} />
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
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
