'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AddBranchModal from '@/components/AddBranchModal';
import EditBranchModal from '@/components/EditBranchModal';
import { api } from '@/lib/api';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [error, setError] = useState('');

  const refetch = () => {
    api.superAdminBranches().then(setBranches).catch(() => setError('Could not load branches'));
    api.organizations().then(setOrgs).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const visible = branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Branches</h1>
          <p className="text-sm text-gray-500">{branches.length} branches across all organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar placeholder="Search branches..." value={search} onChange={setSearch} />
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg"
          >
            + New Branch
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">BRANCH</th>
              <th className="font-normal">ORGANIZATION</th>
              <th className="font-normal">ADDRESS</th>
              <th className="font-normal">MEMBERS</th>
              <th className="font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id} className="border-b border-black/5 last:border-0">
                <td className="p-4 font-medium">{b.name}</td>
                <td>{b.tenant?.name}</td>
                <td>{b.address || '—'}</td>
                <td>{b._count?.members ?? 0}</td>
                <td className="p-4">
                  <button
                    onClick={() => setEditingBranch(b)}
                    className="text-xs text-accent font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No branches match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddBranchModal organizations={orgs} onClose={() => setShowAdd(false)} onSuccess={refetch} />
      )}
      {editingBranch && (
        <EditBranchModal branch={editingBranch} onClose={() => setEditingBranch(null)} onSuccess={refetch} />
      )}
    </div>
  );
}
