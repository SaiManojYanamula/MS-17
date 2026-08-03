'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import RequestModal from '@/components/RequestModal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

const typeLabels: Record<string, string> = {
  RENEWAL: 'Renew Membership',
  SEAT_CHANGE: 'Seat Change',
  ISSUE: 'Issue',
  OTHER: 'Other',
};

export default function RequestsPage() {
  const { hasRole } = useAuth();
  const isStaff = hasRole('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF');
  const [requests, setRequests] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const refetch = () => {
    const call = isStaff ? api.allRequests() : api.myRequests();
    call.then(setRequests).catch(() => setError('Could not load requests'));
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const resolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.resolveRequest(id);
      refetch();
    } catch (err: any) {
      setError(err.message || "Couldn't resolve request");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">{isStaff ? 'Requests' : 'Raise a Request'}</h1>
          <p className="text-sm text-gray-500">
            {isStaff ? 'Requests raised by students' : 'Renewals, seat changes, and issues'}
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + Raise a Request
          </button>
        )}
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              {isStaff && <th className="p-4 font-normal">STUDENT</th>}
              <th className={isStaff ? 'font-normal' : 'p-4 font-normal'}>TYPE</th>
              <th className="font-normal">MESSAGE</th>
              <th className="font-normal">DATE</th>
              <th className="font-normal">STATUS</th>
              {isStaff && <th className="font-normal" />}
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0">
                {isStaff && <td className="p-4 font-medium">{r.member?.name ?? '—'}</td>}
                <td className={isStaff ? '' : 'p-4'}>{typeLabels[r.type] ?? r.type}</td>
                <td className="text-gray-500 max-w-xs">
                  <div className="truncate">{r.message}</div>
                  {r.type === 'RENEWAL' && r.amount && (
                    <div className="text-[11px] mt-0.5">
                      <span className="text-gray-600 font-medium">₹{r.amount} paid</span>
                      {r.screenshotUrl && (
                        <a
                          href={r.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline ml-2"
                        >
                          View Screenshot
                        </a>
                      )}
                    </div>
                  )}
                  {r.type === 'SEAT_CHANGE' && r.requestedSeatNumber && (
                    <div className="text-[11px] mt-0.5 text-gray-600 font-medium">
                      Wants seat #{r.requestedSeatNumber}
                    </div>
                  )}
                </td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      r.status === 'OPEN' ? 'bg-accent/20 text-accent' : 'bg-free/20 text-free'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                {isStaff && (
                  <td className="p-4">
                    {r.status === 'OPEN' && (
                      <button
                        onClick={() => resolve(r.id)}
                        disabled={resolvingId === r.id}
                        title={
                          r.type === 'RENEWAL' && r.amount
                            ? 'Confirms the payment, extends membership by one plan cycle, and records it under Payments'
                            : r.type === 'SEAT_CHANGE' && r.requestedSeatNumber
                              ? `Moves the student to seat #${r.requestedSeatNumber} if it's still free`
                              : undefined
                        }
                        className="text-xs text-accent font-medium disabled:opacity-60"
                      >
                        {resolvingId === r.id ? 'Resolving…' : 'Resolve'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={isStaff ? 6 : 4} className="p-8 text-center text-gray-400">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <RequestModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
