'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import StatusPill from '@/components/StatusPill';
import AddMemberModal from '@/components/AddMemberModal';
import EditMemberModal from '@/components/EditMemberModal';
import ImportMembersModal from '@/components/ImportMembersModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { mockMembers, mockMemberCounts } from '@/lib/mockData';
import { formatDate, formatPlan, seatNumberOf } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'expired', label: 'Expired' },
];

export default function MembersPage() {
  const { hasRole } = useAuth();
  const canDelete = hasRole('TENANT_OWNER', 'BRANCH_MANAGER');
  const canImport = hasRole('TENANT_OWNER', 'BRANCH_MANAGER');
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState(mockMembers);
  const [counts, setCounts] = useState(mockMemberCounts);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [error, setError] = useState('');
  const highlightId = useSearchParams().get('highlight');

  const refetch = () => {
    api
      .members(filter === 'all' ? undefined : filter, search || undefined)
      .then((res) => {
        setMembers(res.members ?? mockMembers);
        setCounts(res.counts ?? mockMemberCounts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const t = setTimeout(refetch, 300); // debounce search-as-you-type
    return () => clearTimeout(t);
  }, [filter, search]);

  const exportCsv = () => {
    downloadCsv(
      `members-${filter}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Goal', key: 'goalTag' },
        { header: 'Plan', key: 'plan' },
        { header: 'Batch', key: 'batch' },
        { header: 'Seat', key: 'seatNumber' },
        { header: 'Status', key: 'status' },
        { header: 'Joined', key: 'joinedAt' },
        { header: 'Expires', key: 'expiresAt' },
      ],
      members.map((m: any) => ({ ...m, seatNumber: seatNumberOf(m.seat) })),
    );
  };

  const deleteMember = async (m: any) => {
    if (!window.confirm(`Delete ${m.name}? This also removes their payment history and frees their seat.`)) {
      return;
    }
    setError('');
    try {
      await api.deleteMember(m.id);
      refetch();
    } catch (err: any) {
      setError(err.message || "Couldn't delete member — try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Members</h1>
          <p className="text-sm text-gray-500">{counts.all} active members across 3 batches</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar value={search} onChange={setSearch} />
          <button
            onClick={exportCsv}
            className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0"
          >
            Export CSV
          </button>
          {canImport && (
            <button
              onClick={() => setShowImport(true)}
              className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0"
            >
              Import Students
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shadow-sm shadow-accent/20 shrink-0"
          >
            + Add Member
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-black/10 mb-6 text-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              filter === t.key ? 'border-b-2 border-accent text-accent font-medium' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filter === t.key ? 'bg-accent/10 text-accent' : 'bg-black/5 text-gray-500'
              }`}
            >
              {counts[t.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m: any) => (
          <div
            key={m.id}
            className={`group bg-card rounded-2xl p-4 border transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${
              m.id === highlightId ? 'ring-2 ring-accent border-transparent' : 'border-black/5'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/70 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                  {m.name.split(' ').map((p: string) => p[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.goalTag}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingMember(m)}
                  title="Edit"
                  className="w-7 h-7 rounded-full hover:bg-accent/10 hover:text-accent text-xs"
                >
                  ✎
                </button>
                {canDelete && (
                  <button
                    onClick={() => deleteMember(m)}
                    title="Delete"
                    className="w-7 h-7 rounded-full hover:bg-expiring/10 text-expiring text-xs"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Seat</span>
                <span className="font-medium">#{seatNumberOf(m.seat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone</span>
                <span className="font-medium">{m.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plan</span>
                <span className="font-medium">{formatPlan(m.plan)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expires</span>
                <span className="font-medium">{formatDate(m.expiresAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <StatusPill status={m.status} />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-black/5 mt-1">
                <span className="text-gray-400">Portal</span>
                {m.user ? (
                  <span className="text-[10px] bg-free/15 text-free font-medium rounded-full px-2 py-0.5">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-black/5 text-gray-400 font-medium rounded-full px-2 py-0.5">
                    {m.phone ? 'Pending' : 'No phone'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-gray-400 col-span-3 text-center py-8">No members match.</p>
        )}
      </div>

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
      {showImport && <ImportMembersModal onClose={() => setShowImport(false)} onSuccess={refetch} />}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
