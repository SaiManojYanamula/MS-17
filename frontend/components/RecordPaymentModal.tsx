'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPlan } from '@/lib/format';

export default function RecordPaymentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [cycles, setCycles] = useState('1');
  const [method, setMethod] = useState('UPI');
  const [label, setLabel] = useState('');
  const [labelTouched, setLabelTouched] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feeByPlan, setFeeByPlan] = useState<Record<string, number | null | undefined>>({});

  useEffect(() => {
    api.members().then((res) => setMembers(res.members ?? [])).catch(() => {});
    api
      .myTenant()
      .then((res) =>
        setFeeByPlan({
          MONTHLY: res.tenant?.monthlyFee,
          QUARTERLY: res.tenant?.quarterlyFee,
          YEARLY: res.tenant?.yearlyFee,
          DAILY_PASS: res.tenant?.dailyPassFee,
        }),
      )
      .catch(() => {});
  }, []);

  const selectedMember = members.find((m) => m.id === memberId);
  const fee = selectedMember ? feeByPlan[selectedMember.plan] : null;

  // Months (or plan cycles) times the plan's fee auto-fills Amount — still
  // editable by hand for a partial/odd payment, in which case the "≈ X
  // cycles" hint below just reflects whatever Amount actually is.
  useEffect(() => {
    if (!fee || !cycles) return;
    setAmount(String(Math.round(Number(cycles) * fee)));
  }, [cycles, fee]);

  // Roughly how many calendar days one plan cycle spans — used only to turn
  // "you paid 1.08x the fee" into an intuitive day count, not for anything
  // that touches the member's actual expiry math (that stays exact, done
  // server-side via addMonthsClamped).
  const PLAN_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 91, YEARLY: 365, DAILY_PASS: 1 };

  const cyclesCovered = fee && Number(amount) > 0 ? Number(amount) / fee : null;
  const daysCovered =
    cyclesCovered != null && selectedMember ? Math.round(cyclesCovered * (PLAN_DAYS[selectedMember.plan] ?? 30)) : null;

  // Auto-fills from the selected member's plan so staff isn't forced to
  // type a label for every payment — still editable for anything unusual
  // (a late fee, an advance, etc.), and stops auto-updating the moment
  // they've typed something of their own so it never clobbers that.
  useEffect(() => {
    if (labelTouched) return;
    const member = members.find((m) => m.id === memberId);
    if (member) setLabel(`${formatPlan(member.plan)} - Renewal`);
  }, [memberId, members, labelTouched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createPayment({ memberId, amount: Number(amount), method, label, status: 'PAID', screenshot });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Record Payment</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {fee != null && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {selectedMember?.plan === 'MONTHLY' ? 'Months' : 'Plan cycles'} being paid for
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={cycles}
                onChange={(e) => setCycles(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {formatPlan(selectedMember?.plan)} fee is ₹{fee} — Amount below auto-fills, edit it directly for a
                partial payment.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label</label>
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelTouched(true);
              }}
              required
              placeholder="e.g. Monthly Renewal"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">Auto-fills from the member's plan — edit if needed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              {daysCovered != null && (
                <p className="text-[11px] text-gray-400 mt-1">
                  ≈ {daysCovered} day{daysCovered === 1 ? '' : 's'} of validity
                  {cyclesCovered != null && cyclesCovered.toFixed(2) !== '1.00' ? ` (${cyclesCovered.toFixed(2)}x the fee)` : ''}
                </p>
              )}
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Screenshot (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-accent/10 file:text-accent file:rounded-md file:px-3 file:py-1.5 file:text-xs"
            />
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
              {submitting ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
