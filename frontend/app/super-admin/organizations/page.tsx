'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AddOrganizationModal from '@/components/AddOrganizationModal';
import EditOrganizationModal from '@/components/EditOrganizationModal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [error, setError] = useState('');

  const refetch = () => {
    api.organizations().then(setOrgs).catch(() => setError('Could not load organizations'));
  };

  useEffect(() => {
    refetch();
  }, []);

  const visible = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Organizations</h1>
          <p className="text-sm text-gray-500">{orgs.length} study halls on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar placeholder="Search organizations..." value={search} onChange={setSearch} />
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg"
          >
            + New Organization
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">ORGANIZATION</th>
              <th className="font-normal">PLAN</th>
              <th className="font-normal">STATUS</th>
              <th className="font-normal">BRANCHES</th>
              <th className="font-normal">USERS</th>
              <th className="font-normal">MEMBERS</th>
              <th className="font-normal">CREATED</th>
              <th className="font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id} className="border-b border-black/5 last:border-0">
                <td className="p-4">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-gray-400">{o.slug}</div>
                </td>
                <td>{o.plan}</td>
                <td>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      o.status === 'SUSPENDED' ? 'bg-expiring/20 text-expiring' : 'bg-free/20 text-free'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td>{o.branches?.length ?? 0}</td>
                <td>{o._count?.users ?? 0}</td>
                <td>{o._count?.members ?? 0}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td className="p-4">
                  <button
                    onClick={() => setEditingOrg(o)}
                    className="text-xs text-accent font-medium"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  No organizations match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddOrganizationModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
      {editingOrg && (
        <EditOrganizationModal org={editingOrg} onClose={() => setEditingOrg(null)} onSuccess={refetch} />
      )}
    </div>
  );
}
