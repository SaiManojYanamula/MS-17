'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

// YYYY-MM-DD in local time — Date#toISOString() shifts to UTC first, which
// can land on the wrong day for users east of UTC (e.g. India).
function toDateInputValue(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
}

export default function NoticesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF');
  const [notices, setNotices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refetch = () => {
    api.notices().then(setNotices).catch(() => setError('Could not load notices'));
  };

  useEffect(() => {
    refetch();
  }, []);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if ((startDate && !endDate) || (endDate && !startDate)) {
      setError('Pick both a From and a To date — or leave both blank for a non-dated notice.');
      return;
    }
    setSubmitting(true);
    try {
      await api.postNotice({
        title,
        body,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTitle('');
      setBody('');
      setStartDate('');
      setEndDate('');
      setShowAdd(false);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Could not post notice');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.deleteNotice(id);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Could not delete notice');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Notices</h1>
          <p className="text-sm text-gray-500">Updates and announcements</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            {showAdd ? 'Cancel' : '+ Post Notice'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      {showAdd && (
        <form onSubmit={post} className="bg-card rounded-xl p-5 border border-black/5 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Holiday/closure dates (optional — e.g. for a holiday notice)
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  const today = toDateInputValue(new Date());
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="text-xs border border-black/10 rounded-full px-3 py-1 hover:bg-black/5"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
                  setStartDate(tomorrow);
                  setEndDate(tomorrow);
                }}
                className="text-xs border border-black/10 rounded-full px-3 py-1 hover:bg-black/5"
              >
                Tomorrow
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                min={startDate || undefined}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post Notice'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {notices.map((n: any) => (
          <div key={n.id} className="bg-card rounded-xl p-4 border border-black/5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{n.title}</div>
                <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                {n.startDate && (
                  <p className="text-xs text-accent font-medium mt-2">
                    📅 {formatDate(n.startDate)}
                    {n.endDate && n.endDate !== n.startDate ? ` – ${formatDate(n.endDate)}` : ''}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
              </div>
              {canManage && (
                <button
                  onClick={() => remove(n.id)}
                  className="text-xs text-expiring shrink-0 ml-3"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No notices yet.</p>
        )}
      </div>
    </div>
  );
}
