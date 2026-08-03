'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatPlan } from '@/lib/format';

export default function RenewMemberModal({
  member,
  onClose,
  onSuccess,
}: {
  member: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter how much they paid');
      return;
    }
    setSubmitting(true);
    try {
      await api.renewMember(member.id, Number(amount), method);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not renew membership');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-1">Renew Membership</h2>
        <p className="text-sm text-gray-500 mb-4">
          {member.name} — {formatPlan(member.plan)}
        </p>
        <p className="text-xs text-gray-400 bg-black/[0.03] rounded-lg px-3 py-2 mb-4">
          Records the payment and extends their membership by one {formatPlan(member.plan).toLowerCase()}{' '}
          cycle in one step — for a student who paid in person or by phone.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-expiring">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-black/10 text-sm py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-sidebar text-white text-sm py-2 rounded-lg disabled:opacity-60"
            >
              {submitting ? 'Renewing…' : 'Renew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
