'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function EditMemberModal({
  member,
  onClose,
  onSuccess,
}: {
  member: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(member.name ?? '');
  const [phone, setPhone] = useState(member.phone ?? '');
  const [goalTag, setGoalTag] = useState(member.goalTag ?? '');
  const [plan, setPlan] = useState(member.plan ?? 'MONTHLY');
  const [batch, setBatch] = useState(member.batch ?? 'Morning');
  const [expiresAt, setExpiresAt] = useState((member.expiresAt ?? '').slice(0, 10));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.updateMember(member.id, {
        name,
        phone: phone || undefined,
        goalTag: goalTag || undefined,
        plan,
        batch,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not update member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Edit Member</h2>
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {member.user
                ? 'Portal login already active for this member.'
                : 'Adding a phone number creates their portal login (default password 1234).'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Goal Tag</label>
            <input
              value={goalTag}
              onChange={(e) => setGoalTag(e.target.value)}
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
            <label className="block text-xs text-gray-500 mb-1">Expires On</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Status (Active / Expiring Soon / Expired) is calculated automatically from this date.
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
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
