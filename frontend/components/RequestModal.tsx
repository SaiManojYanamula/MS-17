'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const typeLabels: Record<string, string> = {
  RENEWAL: 'Renew Membership',
  SEAT_CHANGE: 'Request Seat Change',
  ISSUE: 'Report an Issue',
  OTHER: 'Other',
};

export default function RequestModal({
  initialType = 'OTHER',
  onClose,
  onSuccess,
}: {
  initialType?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState(initialType);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!message.trim()) {
      setError('Add a short message so staff know what you need');
      return;
    }
    setSubmitting(true);
    try {
      await api.createRequest({ type, message });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Raise a Request</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Tell staff what you need…"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm resize-none"
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
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
