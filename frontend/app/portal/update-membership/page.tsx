'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPlan, seatNumberOf } from '@/lib/format';

export default function UpdateMembershipPage() {
  const [member, setMember] = useState<any>(null);
  const [seats, setSeats] = useState<{ id: string; seatNumber: number; zone: { name: string } }[]>([]);
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [wantsSeatChange, setWantsSeatChange] = useState(false);
  const [requestedSeatNumber, setRequestedSeatNumber] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refetch = () => {
    api.myMember().then(setMember).catch(() => {});
    api.availableSeats().then(setSeats).catch(() => {});
    api.myRequests().then(setRequests).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!amount || Number(amount) <= 0) {
      setError('Enter how much you paid');
      return;
    }
    if (wantsSeatChange && !requestedSeatNumber) {
      setError('Pick a seat to move to');
      return;
    }
    setSubmitting(true);
    try {
      await api.createRenewalRequest({
        message,
        amount: Number(amount),
        screenshot: screenshot || undefined,
        requestedSeatNumber: wantsSeatChange ? Number(requestedSeatNumber) : undefined,
      });
      setAmount('');
      setScreenshot(null);
      setWantsSeatChange(false);
      setRequestedSeatNumber('');
      setMessage('');
      setSuccess(true);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Update Membership</h1>
        <p className="text-sm text-gray-500">Renew your membership, and optionally request a seat change — in one go</p>
      </div>

      {member && (
        <div className="bg-card rounded-xl p-5 border border-black/5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-gray-400 block text-xs">Plan</span>
            <span className="font-medium">{formatPlan(member.plan)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs">Current Seat</span>
            <span className="font-medium">#{seatNumberOf(member.seat)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs">Expires</span>
            <span className="font-medium">{formatDate(member.expiresAt)}</span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl p-5 border border-black/5 max-w-md">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount Paid (₹)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Screenshot (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              className="w-full text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-sm pt-1">
            <input
              type="checkbox"
              checked={wantsSeatChange}
              onChange={(e) => {
                setWantsSeatChange(e.target.checked);
                if (!e.target.checked) setRequestedSeatNumber('');
              }}
            />
            Also change my seat
          </label>

          {wantsSeatChange && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Move to seat</label>
              <select
                value={requestedSeatNumber}
                onChange={(e) => setRequestedSeatNumber(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a free seat…</option>
                {seats.map((s) => (
                  <option key={s.id} value={s.seatNumber}>
                    Seat {s.seatNumber} — {s.zone?.name}
                  </option>
                ))}
              </select>
              {seats.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">No free seats available right now.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          {error && <p className="text-xs text-expiring">{error}</p>}
          {success && (
            <p className="text-xs text-free">
              Submitted — staff will review and confirm. Your membership updates once they do.
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sidebar text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>

      {requests.length > 0 && (
        <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
                <th className="p-4 font-normal">DATE</th>
                <th className="font-normal">DETAILS</th>
                <th className="font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0">
                  <td className="p-4">{formatDate(r.createdAt)}</td>
                  <td className="text-gray-500">
                    {r.amount ? `₹${r.amount} paid` : r.message}
                    {r.requestedSeatNumber ? ` · Wants seat #${r.requestedSeatNumber}` : ''}
                  </td>
                  <td>
                    <span
                      className={`text-[10px] rounded-full px-2 py-0.5 ${
                        r.status === 'OPEN' ? 'bg-accent/20 text-accent' : 'bg-free/20 text-free'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
