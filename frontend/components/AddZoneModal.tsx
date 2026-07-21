'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function AddZoneModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [startSeat, setStartSeat] = useState('');
  const [endSeat, setEndSeat] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const start = Number(startSeat);
    const end = Number(endSeat);
    if (!start || !end || start > end) {
      setError('Enter a valid seat range (start ≤ end)');
      return;
    }
    setSubmitting(true);
    try {
      await api.createZone({ name, startSeat: start, endSeat: end });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create zone');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Add Zone</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zone D - Balcony"
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Seat #</label>
              <input
                type="number"
                min="1"
                value={startSeat}
                onChange={(e) => setStartSeat(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Seat #</label>
              <input
                type="number"
                min="1"
                value={endSeat}
                onChange={(e) => setEndSeat(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Seat numbers must not overlap with any existing zone in this branch.
          </p>
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
              {submitting ? 'Creating…' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
