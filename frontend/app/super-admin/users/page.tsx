'use client';

import { Fragment, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AddUserModal from '@/components/AddUserModal';
import PasswordInput from '@/components/PasswordInput';
import { api } from '@/lib/api';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);

  const refetch = () => {
    api.platformUsers().then(setUsers).catch(() => setError('Could not load users'));
    api.organizations().then(setOrgs).catch(() => {});
    api.passwordResetRequests().then(setResetRequests).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  const resolveRequest = async (id: string) => {
    try {
      await api.resolvePasswordResetRequest(id);
      setResetRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Could not resolve request');
    }
  };

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

  const submitReset = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    setResetMsg('');
    setResetting(true);
    try {
      await api.resetPlatformUserPassword(userId, newPassword);
      setResetMsg('Password reset — share it with them directly.');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Could not reset password');
    } finally {
      setResetting(false);
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

      {resetRequests.length > 0 && (
        <div className="bg-expiring/5 border border-expiring/20 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold mb-2">
            Password Reset Requests ({resetRequests.length})
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Find the matching account below, reset their password, and share it with them — then mark resolved.
          </p>
          <div className="space-y-2">
            {resetRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{r.email}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(r.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={() => resolveRequest(r.id)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  Mark Resolved
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <Fragment key={u.id}>
                <tr className="border-b border-black/5 last:border-0">
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
                  <td className="p-4 space-x-3">
                    {u.role !== 'SUPER_ADMIN' && (
                      <button onClick={() => toggleActive(u)} className="text-xs text-accent font-medium">
                        {u.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setResettingId(resettingId === u.id ? null : u.id);
                        setResetMsg('');
                        setNewPassword('');
                      }}
                      className="text-xs text-accent font-medium"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
                {resettingId === u.id && (
                  <tr className="border-b border-black/5 last:border-0">
                    <td colSpan={6} className="p-4 bg-black/[0.02]">
                      <form onSubmit={(e) => submitReset(e, u.id)} className="flex items-center gap-2 max-w-sm">
                        <PasswordInput
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          minLength={6}
                          required
                          className="flex-1 border border-black/10 rounded-lg px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={resetting}
                          className="bg-sidebar text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60 shrink-0"
                        >
                          {resetting ? 'Saving…' : 'Save'}
                        </button>
                      </form>
                      {resetMsg && <p className="text-xs text-free mt-1">{resetMsg}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
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
