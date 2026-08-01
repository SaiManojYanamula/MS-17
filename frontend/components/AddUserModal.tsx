'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

export default function AddUserModal({
  organizations,
  onClose,
  onSuccess,
}: {
  organizations: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tenantId, setTenantId] = useState(organizations[0]?.id ?? '');
  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TENANT_OWNER');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedOrg = organizations.find((o) => o.id === tenantId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tenantId) {
      setError('Select an organization');
      return;
    }
    setSubmitting(true);
    try {
      await api.createPlatformUser({
        tenantId,
        branchId: branchId || undefined,
        name,
        email,
        password,
        role,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">New User</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Organization</label>
            <select
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setBranchId('');
              }}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          {selectedOrg?.branches?.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Branch (optional)</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {selectedOrg.branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Temporary Password (min 6 characters)</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="TENANT_OWNER">Tenant Owner</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
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
              {submitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
