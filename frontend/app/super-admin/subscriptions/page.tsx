'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/api';

const plans = ['BASIC', 'STANDARD', 'PREMIUM'];
const statuses = ['ACTIVE', 'TRIAL', 'SUSPENDED'];

export default function SubscriptionsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const refetch = () => {
    api.organizations().then(setOrgs).catch(() => setError('Could not load organizations'));
  };

  useEffect(() => {
    refetch();
  }, []);

  const change = async (org: any, field: 'plan' | 'status', value: string) => {
    setError('');
    setSavingId(org.id);
    try {
      await api.updateOrganization(org.id, { [field]: value });
      refetch();
    } catch (err: any) {
      setError(err.message || "Couldn't update organization");
    } finally {
      setSavingId(null);
    }
  };

  const byPlan = (plan: string) => orgs.filter((o) => o.plan === plan).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Subscription & Plans</h1>
          <p className="text-sm text-gray-500">Plan and billing status per organization</p>
        </div>
        <TopBar />
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {plans.map((p) => (
          <div key={p} className="bg-card rounded-xl p-4 border border-black/5">
            <div className="text-2xl font-serif font-semibold">{byPlan(p)}</div>
            <div className="text-xs text-gray-500 mt-0.5">{p} plan organizations</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">ORGANIZATION</th>
              <th className="font-normal">PLAN</th>
              <th className="font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-black/5 last:border-0">
                <td className="p-4 font-medium">{o.name}</td>
                <td>
                  <select
                    value={o.plan}
                    disabled={savingId === o.id}
                    onChange={(e) => change(o, 'plan', e.target.value)}
                    className="border border-black/10 rounded-lg px-2 py-1 text-xs"
                  >
                    {plans.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={o.status}
                    disabled={savingId === o.id}
                    onChange={(e) => change(o, 'status', e.target.value)}
                    className="border border-black/10 rounded-lg px-2 py-1 text-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-400">
                  No organizations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
