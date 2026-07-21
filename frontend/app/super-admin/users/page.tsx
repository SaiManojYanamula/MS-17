'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AddUserModal from '@/components/AddUserModal';
import { api } from '@/lib/api';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const refetch = () => {
    api.platformUsers().then(setUsers).catch(() => setError('Could not load users'));
    api.organizations().then(setOrgs).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const visible = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleActive = async (u: any) => {
    setError('');
    try {
      await api.updatePlatformUser(u.id, { isActive: !u.isActive });
      refetch();
    } catch (err: any) {
      setError(err.message || "Couldn't update user");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Users</h1>
          <p className="text-sm text-gray-500">{users.length} accounts across all organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar placeholder="Search users..." value={search} onChange={setSearch} />
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + New User
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">NAME</th>
              <th className="font-normal">EMAIL</th>
              <th className="font-normal">ORGANIZATION</th>
              <th className="font-normal">ROLE</th>
              <th className="font-normal">STATUS</th>
              <th className="font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-b border-black/5 last:border-0">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="text-gray-500">{u.email}</td>
                <td>{u.tenant?.name ?? '—'}</td>
                <td>{u.role.replace('_', ' ')}</td>
                <td>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      u.isActive ? 'bg-free/20 text-free' : 'bg-expiring/20 text-expiring'
                    }`}
                  >
                    {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td className="p-4">
                  {u.role !== 'SUPER_ADMIN' && (
                    <button onClick={() => toggleActive(u)} className="text-xs text-accent font-medium">
                      {u.isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddUserModal organizations={orgs} onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
