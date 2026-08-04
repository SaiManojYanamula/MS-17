'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/api';
import { formatDate, formatPlan } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_KEY_NUMBERS = {
  totalMembersAllTime: 0,
  avgMembershipMonths: 0,
  renewalRate: 0,
  mostPopularBatch: '-',
  mostCommonGoal: '-',
};

// Validated categorical palette (see dataviz skill) — fixed slot order, do not reorder or cycle.
const planColors: Record<string, string> = {
  Monthly: '#2a78d6', // blue
  Quarterly: '#008300', // green
  'Daily Pass': '#e87ba4', // magenta
  Others: '#eda100', // yellow
};

const CHART_ACCENT = '#0d9488';
const CHART_HIGHLIGHT = '#0f172a';
const CHART_MUTED = '#898781';

function BarTooltip({ active, payload, label, valuePrefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-black/10 shadow-lg px-3 py-2 text-xs">
      <div className="text-gray-400 mb-0.5">{label}</div>
      <div className="font-medium">
        {valuePrefix}
        {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString('en-IN') : payload[0].value}
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white rounded-lg border border-black/10 shadow-lg px-3 py-2 text-xs">
      <div className="font-medium">{p.name}</div>
      <div className="text-gray-400">{p.value}%</div>
    </div>
  );
}

export default function ReportsPage() {
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [planDist, setPlanDist] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [keyNumbers, setKeyNumbers] = useState(EMPTY_KEY_NUMBERS);

  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate, setToDate] = useState(today());
  const [joinedMembers, setJoinedMembers] = useState<any[]>([]);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [joinedError, setJoinedError] = useState('');

  useEffect(() => {
    api.occupancyTrend(8).then(setOccupancy).catch(() => {});
    api.planDistribution().then(setPlanDist).catch(() => {});
    api.revenueTrend(6).then(setRevenue).catch(() => {});
    api.keyNumbers().then(setKeyNumbers).catch(() => {});
  }, []);

  const fetchJoined = () => {
    if (!fromDate || !toDate) return;
    setJoinedError('');
    setJoinedLoading(true);
    api
      .membersJoinedInRange(fromDate, toDate)
      .then((res) => setJoinedMembers(res.members ?? []))
      .catch((err: any) => setJoinedError(err.message || 'Could not load'))
      .finally(() => setJoinedLoading(false));
  };

  useEffect(() => {
    fetchJoined();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportJoinedCsv = () => {
    downloadCsv(
      `students-joined-${fromDate}-to-${toDate}.csv`,
      [
        { header: 'Student ID', key: 'displayId' },
        { header: 'Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Goal', key: 'goalTag' },
        { header: 'Plan', key: 'plan' },
        { header: 'Batch', key: 'batch' },
        { header: 'Joined', key: 'joinedAt' },
        { header: 'Expires', key: 'expiresAt' },
      ],
      joinedMembers,
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500">Occupancy, revenue, and membership trends</p>
        </div>
        <TopBar />
      </div>
{/* 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Occupancy Trend — Last 8 Weeks</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: CHART_MUTED }}
                />
                <Tooltip
                  content={<BarTooltip valuePrefix="" />}
                  cursor={{ fill: 'rgba(13,148,136,0.06)' }}
                  formatter={(v: number) => `${v}%`}
                />
                <Bar dataKey="occupiedPct" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Plan Distribution</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDist}
                    dataKey="pct"
                    nameKey="plan"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {planDist.map((p: any, i: number) => (
                      <Cell key={i} fill={planColors[p.plan] || CHART_MUTED} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              {planDist.map((p: any) => (
                <div key={p.plan} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: planColors[p.plan] || CHART_MUTED }}
                  />
                  {p.plan} <span className="font-medium">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-black/5">
          <h2 className="font-serif font-semibold mb-4">Revenue — Last 6 Months</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: CHART_MUTED }}
                />
                <Tooltip
                  content={<BarTooltip valuePrefix="₹" />}
                  cursor={{ fill: 'rgba(13,148,136,0.06)' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {revenue.map((r: any, i: number) => (
                    <Cell key={i} fill={i === revenue.length - 1 ? CHART_HIGHLIGHT : CHART_ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* <div className="bg-card rounded-xl p-5 border border-black/5">
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
        </div> */}
      </div>

      <div className="bg-card rounded-xl p-5 border border-black/5 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif font-semibold mb-3">Students Joined — Custom Range</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-black/10 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-black/10 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={fetchJoined}
                disabled={joinedLoading}
                className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {joinedLoading ? 'Loading…' : 'Search'}
              </button>
            </div>
          </div>
          <button
            onClick={exportJoinedCsv}
            disabled={joinedMembers.length === 0}
            className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0 disabled:opacity-40"
          >
            Download CSV
          </button>
        </div>

        {joinedError && <p className="text-xs text-expiring mb-3">{joinedError}</p>}
        <p className="text-xs text-gray-500 mb-3">
          {joinedMembers.length} student{joinedMembers.length === 1 ? '' : 's'} joined in this period
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
                <th className="pb-2 font-normal">STUDENT ID</th>
                <th className="pb-2 font-normal">NAME</th>
                <th className="pb-2 font-normal">PHONE</th>
                <th className="pb-2 font-normal">PLAN</th>
                <th className="pb-2 font-normal">BATCH</th>
                <th className="pb-2 font-normal">JOINED</th>
                <th className="pb-2 font-normal">EXPIRES</th>
              </tr>
            </thead>
            <tbody>
              {joinedMembers.map((m: any) => (
                <tr key={m.id} className="border-t border-black/5">
                  <td className="py-2.5 text-gray-500">{m.displayId || '—'}</td>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.phone || '—'}</td>
                  <td>{formatPlan(m.plan)}</td>
                  <td>{m.batch}</td>
                  <td>{formatDate(m.joinedAt)}</td>
                  <td>{formatDate(m.expiresAt)}</td>
                </tr>
              ))}
              {joinedMembers.length === 0 && !joinedLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No students joined in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
