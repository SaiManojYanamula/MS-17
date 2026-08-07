'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { memberNameOf, formatDate } from '@/lib/format';

// Same rough days-per-cycle approximation used in RecordPaymentModal — only
// for suggesting a prorated refund amount, never for the member's actual
// expiry math (that's exact, server-side, via addMonthsClamped).
const PLAN_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 91, YEARLY: 365, DAILY_PASS: 1 };

export default function RefundModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const member = payment.member;
  const expiresAt = member?.expiresAt ? new Date(member.expiresAt) : null;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const totalPlanDays = member ? (PLAN_DAYS[member.plan] ?? 30) : 30;
  // Prorated for unused days left on the plan — full refund if we can't
  // tell (no expiry on record), never more than what was actually paid.
  const suggested = expiresAt
    ? Math.min(payment.amount, Math.max(0, Math.round((daysRemaining / totalPlanDays) * payment.amount)))
    : payment.amount;

  const [amount, setAmount] = useState(String(suggested));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = Number(amount);
    if (!value || value <= 0 || value > payment.amount) {
      setError(`Enter an amount between ₹1 and ₹${payment.amount}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.refundPayment(payment.id, value);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not process refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-1">Refund Payment</h2>
        <p className="text-xs text-gray-500 mb-4">
          {memberNameOf(member)} paid ₹{payment.amount} on {formatDate(payment.date || payment.createdAt)}
        </p>

        {expiresAt && (
          <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 mb-4 text-xs text-gray-600">
            Plan expires {formatDate(member.expiresAt)} — about {daysRemaining} day{daysRemaining === 1 ? '' : 's'}{' '}
            remaining of a ~{totalPlanDays}-day cycle. Suggested prorated refund:{' '}
            <span className="font-semibold">₹{suggested}</span>.
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Refund Amount (₹)</label>
            <input
              type="number"
              min="1"
              max={payment.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Max ₹{payment.amount} — edit for a full refund or a different partial amount.
            </p>
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
              {submitting ? 'Refunding…' : `Refund ₹${amount || 0}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
