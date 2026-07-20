'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/api';
import {
  mockOccupancyTrend,
  mockPlanDistribution,
  mockRevenueTrend,
  mockKeyNumbers,
} from '@/lib/mockData';

const planColors: Record<string, string> = {
  Monthly: '#7c2d43', // accent
  Quarterly: '#15803d', // free
  'Daily Pass': '#d97706', // occupied
  Others: '#241d1b', // charcoal
};

export default function ReportsPage() {
  const [occupancy, setOccupancy] = useState(mockOccupancyTrend);
  const [planDist, setPlanDist] = useState(mockPlanDistribution);
  const [revenue, setRevenue] = useState(mockRevenueTrend);
  const [keyNumbers, setKeyNumbers] = useState(mockKeyNumbers);

  useEffect(() => {
    api.occupancyTrend(8).then(setOccupancy).catch(() => {});
    api.planDistribution().then(setPlanDist).catch(() => {});
    api.revenueTrend(6).then(setRevenue).catch(() => {});
    api.keyNumbers().then(setKeyNumbers).catch(() => {});
  }, []);

  const maxOcc = Math.max(...occupancy.map((o: any) => o.occupiedPct));
  const maxRev = Math.max(...revenue.map((r: any) => r.total));

  // Simple conic-gradient donut built from cumulative percentages
  let cumulative = 0;
  const gradientStops = planDist
    .map((p: any) => {
      const start = cumulative;
      cumulative += p.pct;
      return `${planColors[p.plan] || '#999'} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500">Occupancy, revenue, and membership trends</p>
        </div>
        <TopBar />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Occupancy Trend — Last 8 Weeks</h2>
          <div className="flex items-end gap-2 h-32">
            {occupancy.map((o: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${(o.occupiedPct / maxOcc) * 100}px` }}
                />
                <span className="text-[10px] text-gray-400">{o.week}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Plan Distribution</h2>
          <div className="flex items-center gap-6">
            <div
              className="w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(${gradientStops})`,
                WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%)',
                mask: 'radial-gradient(circle, transparent 55%, black 56%)',
              }}
            />
            <div className="space-y-2 text-sm">
              {planDist.map((p: any) => (
                <div key={p.plan} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: planColors[p.plan] || '#999' }}
                  />
                  {p.plan} <span className="font-medium">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Revenue — Last 6 Months</h2>
          <div className="flex items-end gap-2 h-32">
            {revenue.map((r: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${i === revenue.length - 1 ? 'bg-navy' : 'bg-accent'}`}
                  style={{ height: `${(r.total / maxRev) * 100}px` }}
                />
                <span className="text-[10px] text-gray-400">{r.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Key Numbers</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Total members (all-time)</span>
              <span className="font-medium">{keyNumbers.totalMembersAllTime}</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Avg. membership length</span>
              <span className="font-medium">{keyNumbers.avgMembershipMonths} months</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Renewal rate</span>
              <span className="font-medium">{keyNumbers.renewalRate}%</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Most popular batch</span>
              <span className="font-medium">{keyNumbers.mostPopularBatch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Most common exam goal</span>
              <span className="font-medium">{keyNumbers.mostCommonGoal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
