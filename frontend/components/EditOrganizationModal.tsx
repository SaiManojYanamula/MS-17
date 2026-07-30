'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const OPTIONAL_FEATURES = [
  { key: 'EXPENSES', label: 'Expenses' },
  { key: 'NOTICES', label: 'Notices' },
  { key: 'REQUESTS', label: 'Requests' },
  { key: 'SEATING', label: 'Seating / QR Booking' },
  { key: 'REPORTS', label: 'Reports' },
  { key: 'ATTENDANCE', label: 'Attendance' },
];

export default function EditOrganizationModal({
  org,
  onClose,
  onSuccess,
}: {
  org: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(org.name ?? '');
  const [plan, setPlan] = useState(org.plan ?? 'BASIC');
  const [status, setStatus] = useState(org.status ?? 'ACTIVE');
  const [whatsappAccessEnabled, setWhatsappAccessEnabled] = useState(!!org.whatsappAccessEnabled);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(
    typeof org.enabledFeatures === 'string' ? org.enabledFeatures.split(',') : OPTIONAL_FEATURES.map((f) => f.key),
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleFeature = (key: string) => {
    setEnabledFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.updateOrganization(org.id, { name, plan, status, whatsappAccessEnabled, enabledFeatures });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not update organization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Manage Organization</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="BASIC">Basic</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm border border-black/10 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={whatsappAccessEnabled}
              onChange={(e) => setWhatsappAccessEnabled(e.target.checked)}
            />
            WhatsApp access enabled
          </label>
          <p className="text-[11px] text-gray-400 -mt-2">
            Each WhatsApp message costs the platform money — this org can only turn on WhatsApp
            notifications in their Settings once you enable it here. Usage per org is on the
            Organizations list.
          </p>

          <div className="border border-black/10 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Optional modules for this org</p>
            <div className="grid grid-cols-2 gap-y-1.5">
              {OPTIONAL_FEATURES.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabledFeatures.includes(f.key)}
                    onChange={() => toggleFeature(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
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
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
