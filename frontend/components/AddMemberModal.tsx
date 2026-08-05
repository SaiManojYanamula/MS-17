'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function computeExpiry(plan: string, from: string): string {
  if (!from) return '';
  const d = new Date(from);
  if (plan === 'MONTHLY') d.setMonth(d.getMonth() + 1);
  else if (plan === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  else d.setDate(d.getDate() + 1); // DAILY_PASS
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AddMemberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goalTag, setGoalTag] = useState('');
  const [plan, setPlan] = useState('MONTHLY');
  const [batch, setBatch] = useState('Morning');
  const [joinedAt, setJoinedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [zones, setZones] = useState<any[]>([]);
  const [seatId, setSeatId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.seatMap().then(setZones).catch(() => {});
  }, []);

  const freeSeatsByZone = zones
    .map((z: any) => ({ name: z.name, seats: (z.seats ?? []).filter((s: any) => s.status === 'FREE') }))
    .filter((z) => z.seats.length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const member = await api.createMember({
        name,
        phone,
        goalTag: goalTag || undefined,
        plan,
        batch,
        joinedAt: new Date(joinedAt).toISOString(),
      });
      if (seatId) {
        await api.assignSeat(seatId, member.id);
      }
      if (Number(amount) > 0) {
        await api.createPayment({
          memberId: member.id,
          amount: Number(amount),
          method,
          label: `${plan} - Initial Payment`,
          status: 'PAID',
          screenshot,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Add Member</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 9876543210"
              pattern="[6-9]\d{9}"
              title="Enter a valid 10-digit Indian phone number"
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Doubles as their portal login — default password is <span className="font-medium">1234</span>.
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Goal Tag</label>
            <input
              value={goalTag}
              onChange={(e) => setGoalTag(e.target.value)}
              placeholder="e.g. UPSC Aspirant"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="DAILY_PASS">Daily Pass</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="Morning">Morning</option>
                <option value="Day">Day</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Seat</label>
            <select
              value={seatId}
              onChange={(e) => setSeatId(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">No seat yet — assign later from Seating</option>
              {freeSeatsByZone.map((z) => (
                <optgroup key={z.name} label={z.name}>
                  {z.seats.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      Seat {s.seatNumber}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount Paid (₹, optional)</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
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
          {Number(amount) > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Screenshot (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-accent/10 file:text-accent file:rounded-md file:px-3 file:py-1.5 file:text-xs"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Joining Date</label>
            <input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Expires on <span className="font-medium text-gray-600">{computeExpiry(plan, joinedAt) || '—'}</span> (auto-calculated from joining date + plan)
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
              {submitting ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}