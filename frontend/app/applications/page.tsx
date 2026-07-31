'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import NewApplicationModal from '@/components/NewApplicationModal';
import { api, API_ORIGIN } from '@/lib/api';
import { formatDate, formatPlan } from '@/lib/format';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);

  const visible = applications.filter((a: any) =>
    a.applicant.toLowerCase().includes(search.toLowerCase()),
  );

  const refetch = () => {
    api.applications('PENDING').then(setApplications).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const approve = async (id: string) => {
    const snapshot = applications;
    setError('');
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.approveApplication(id);
    } catch {
      setApplications(snapshot);
      setError("Couldn't approve — try again.");
    }
  };

  const reject = async (id: string) => {
    const snapshot = applications;
    setError('');
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.rejectApplication(id);
    } catch {
      setApplications(snapshot);
      setError("Couldn't reject — try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Applications</h1>
          <p className="text-sm text-gray-500">{applications.length} pending enrollment requests</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar value={search} onChange={setSearch} />
          <button
            onClick={() => setShowNew(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + New Application
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">APPLICANT</th>
              <th className="font-normal">PLAN</th>
              <th className="font-normal">BATCH</th>
              <th className="font-normal">APPLIED</th>
              <th className="font-normal">AADHAR</th>
              <th className="font-normal">STATUS</th>
              <th className="font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a: any) => (
              <tr key={a.id} className="border-b border-black/5 last:border-0">
                <td className="p-4">
                  <div className="font-medium">{a.applicant}</div>
                  <div className="text-xs text-gray-400">{a.goalTag}</div>
                </td>
                <td>{formatPlan(a.plan)}</td>
                <td>{a.batch}</td>
                <td>{formatDate(a.appliedAt)}</td>
                <td>
                  {a.aadharUrl ? (
                    <a
                      href={`${API_ORIGIN}${a.aadharUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
                <td>
                  <span className="text-[10px] bg-accent/20 text-accent rounded-full px-2 py-0.5">PENDING</span>
                </td>
                <td className="flex gap-2 p-4">
                  <button
                    onClick={() => approve(a.id)}
                    className="w-7 h-7 rounded-full bg-free/20 text-free"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => reject(a.id)}
                    className="w-7 h-7 rounded-full bg-expiring/20 text-expiring"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  {applications.length === 0 ? 'No pending applications 🎉' : 'No applications match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewApplicationModal onClose={() => setShowNew(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
