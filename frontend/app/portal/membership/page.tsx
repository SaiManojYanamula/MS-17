'use client';

import { useEffect, useState } from 'react';
import StatusPill from '@/components/StatusPill';
import IdCardModal from '@/components/IdCardModal';
import { api } from '@/lib/api';
import { formatDate, formatPlan, seatNumberOf, planProgress } from '@/lib/format';

export default function MembershipPage() {
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState('');
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    api.myMember().then(setMember).catch((err) => setError(err.message || 'Could not load your membership'));
  }, []);

  if (error) return <p className="text-sm text-expiring">{error}</p>;
  if (!member) return <p className="text-sm text-gray-400">Loading…</p>;

  const progress = planProgress(member.plan, member.expiresAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-semibold">My Membership</h1>
          <p className="text-sm text-gray-500">{member.displayId || '—'}</p>
        </div>
        <button
          onClick={() => setShowIdCard(true)}
          className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
        >
          Download ID Card
        </button>
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <h2 className="font-serif font-semibold mb-4">Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Branch</span>
            <span className="font-medium">{member.branch?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="font-medium">{formatPlan(member.plan)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Batch</span>
            <span className="font-medium">{member.batch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Seat</span>
            <span className="font-medium">#{seatNumberOf(member.seat)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Joined</span>
            <span className="font-medium">{formatDate(member.joinedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Expires</span>
            <span className="font-medium">{formatDate(member.expiresAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status</span>
            <StatusPill status={member.status} />
          </div>
          {member.aadharUrl && (
            <div className="flex justify-between items-center pt-2 border-t border-black/5">
              <span className="text-gray-400">Aadhar Card</span>
              <a
                href={member.aadharUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent underline"
              >
                View
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Plan progress</span>
          <span>
            {progress.daysUsed} / {progress.totalDays} days used
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/5 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      {showIdCard && <IdCardModal member={member} onClose={() => setShowIdCard(false)} />}
    </div>
  );
}
