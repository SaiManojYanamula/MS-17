'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

export default function AddOrganizationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [branchName, setBranchName] = useState('Main Branch');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createOrganization({ name, slug, branchName, ownerName, ownerEmail, ownerPassword });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create organization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">New Organization</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Organization Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug (used in URLs)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. akshara"
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">First Branch Name</label>
            <input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="pt-2 border-t border-black/5">
            <p className="text-xs text-gray-400 mb-2">Tenant Owner login for this organization</p>
            <label className="block text-xs text-gray-500 mb-1">Owner Name</label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <label className="block text-xs text-gray-500 mb-1">Owner Email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <label className="block text-xs text-gray-500 mb-1">Temporary Password (min 6 characters)</label>
            <PasswordInput
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
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
              {submitting ? 'Creating…' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
