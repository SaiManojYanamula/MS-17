'use client';

import { Fragment, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import StatusPill from '@/components/StatusPill';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, memberNameOf, seatNumberOf, istDayStart, istDayEnd } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';

const tabs = ['All Transactions', 'Paid', 'Pending', 'Refunded'];
const statusMap: Record<string, string | undefined> = {
  'All Transactions': undefined,
  Paid: 'PAID',
  Refunded: 'REFUNDED',
};

const EMPTY_SUMMARY = { collectedThisMonth: 0, pendingDues: 0, transactions: 0, avgTransaction: 0 };

export default function PaymentsPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('All Transactions');
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [showRecord, setShowRecord] = useState(false);
  const [error, setError] = useState('');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const refetch = () => {
    api.paymentsSummary().then(setSummary).catch(() => {});
    if (tab === 'Pending') {
      api.pendingMembers().then(setPendingMembers).catch(() => {});
    } else {
      api.payments(statusMap[tab]).then(setTransactions).catch(() => {});
    }
  };

  useEffect(() => {
    refetch();
  }, [tab]);

  const applyDateFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };
  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
  };
  const hasDateFilter = !!(appliedFromDate || appliedToDate);

  const exportCsv = () => {
    if (tab === 'Pending') {
      downloadCsv(
        `payments-pending-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          { header: 'Member', key: 'name' },
          { header: 'Phone', key: 'phone' },
          { header: 'Seat', key: 'seatNumber' },
          { header: 'Plan Fee', key: 'fee' },
          { header: 'Paid So Far', key: 'paid' },
          { header: 'Due', key: 'due' },
        ],
        pendingMembers.map((m: any) => ({ ...m, seatNumber: seatNumberOf(m.seat) })),
      );
      return;
    }
    downloadCsv(
      `payments-${tab.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Member', key: 'memberName' },
        { header: 'Seat', key: 'seatNumber' },
        { header: 'Plan Fee', key: 'fee' },
        { header: 'Amount', key: 'amount' },
        { header: 'Due', key: 'due' },
        { header: 'Method', key: 'method' },
        { header: 'Label', key: 'label' },
        { header: 'Status', key: 'status' },
        { header: 'Date', key: 'createdAt' },
      ],
      transactions.map((t: any) => ({
        ...t,
        memberName: memberNameOf(t.member),
        seatNumber: seatNumberOf(t.member?.seat),
      })),
    );
  };

  const filteredTransactions = transactions.filter((t: any) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matches =
        memberNameOf(t.member).toLowerCase().includes(q) || (t.member?.phone ?? '').includes(q);
      if (!matches) return false;
    }
    const at = new Date(t.date || t.createdAt).getTime();
    if (appliedFromDate && at < istDayStart(appliedFromDate)) return false;
    if (appliedToDate && at > istDayEnd(appliedToDate)) return false;
    return true;
  });
  // Due is a per-member "current cycle" figure, not a per-transaction one —
  // summing it across rows would double-count a member with two payments in
  // range, so the period total only covers what was actually collected.
  const periodPaid = filteredTransactions
    .filter((t: any) => t.status === 'PAID')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const filteredPendingMembers = pendingMembers.filter((m: any) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (m.name ?? '').toLowerCase().includes(q) || (m.phone ?? '').includes(q);
  });

  // Transactions arrive newest-first from the API, so grouping while
  // iterating in that order (via a Map, not a plain object — object keys
  // that look numeric get silently reordered) keeps months newest-first
  // with no extra sort needed.
  const monthGroups = new Map<string, any[]>();
  for (const t of filteredTransactions) {
    const d = new Date(t.date || t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthGroups.has(key)) monthGroups.set(key, []);
    monthGroups.get(key)!.push(t);
  }
  const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const refund = async (id: string) => {
    setError('');
    const snapshot = transactions;
    setTransactions((prev) => prev.map((t: any) => (t.id === id ? { ...t, status: 'REFUNDED' } : t)));
    setRefundingId(id);
    try {
      await api.refundPayment(id);
      api.paymentsSummary().then(setSummary).catch(() => {});
    } catch (err: any) {
      setTransactions(snapshot);
      setError(err.message || "Couldn't refund — try again.");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Payments</h1>
          <p className="text-sm text-gray-500">Collections, dues, and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar placeholder="Search name or phone..." value={search} onChange={setSearch} />
          <button
            onClick={exportCsv}
            className="border border-black/10 text-sm px-4 py-2 rounded-lg shrink-0"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowRecord(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center mb-3">$</div>
          <div className="text-2xl font-serif font-semibold">₹{summary.collectedThisMonth.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500">Collected This Month</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="w-8 h-8 rounded-lg bg-expiring/10 text-expiring flex items-center justify-center mb-3">⏱</div>
          <div className="text-2xl font-serif font-semibold">₹{summary.pendingDues.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500">Pending Dues</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center mb-3">✓</div>
          <div className="text-2xl font-serif font-semibold">{summary.transactions}</div>
          <div className="text-xs text-gray-500">Transactions</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">▤</div>
          <div className="text-2xl font-serif font-semibold">₹{summary.avgTransaction}</div>
          <div className="text-xs text-gray-500">Avg. Transaction</div>
        </div>
      </div>

      {tab !== 'Pending' && (
      <div className="bg-card rounded-xl p-4 border border-black/5 mb-6 flex flex-wrap items-end gap-3">
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
          onClick={applyDateFilter}
          disabled={!fromDate && !toDate}
          className="bg-sidebar text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
        >
          Apply
        </button>
        {hasDateFilter && (
          <button onClick={clearDateFilter} className="text-xs text-gray-400 underline">
            Clear
          </button>
        )}
        {hasDateFilter && (
          <div className="ml-auto text-right">
            <div className="text-xl font-serif font-semibold">₹{periodPaid.toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-500">
              collected from {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} in this period
            </div>
          </div>
        )}
      </div>
      )}

      <div className="flex gap-6 border-b border-black/10 mb-4 text-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 ${tab === t ? 'border-b-2 border-sidebar font-medium' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      {tab === 'Pending' ? (
      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-[11px] text-gray-600 font-semibold tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">MEMBER</th>
              <th className="font-normal">SEAT</th>
              <th className="font-normal">PLAN FEE</th>
              <th className="font-normal">PAID SO FAR</th>
              <th className="font-normal">DUE</th>
              <th className="font-normal" />
            </tr>
          </thead>
          <tbody>
            {filteredPendingMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Nobody owes anything right now 🎉
                </td>
              </tr>
            )}
            {filteredPendingMembers.map((m: any) => (
              <tr key={m.memberId} className="border-b border-black/5 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sidebar text-white flex items-center justify-center text-xs">
                      {(m.name ?? '').split(' ').map((p: string) => p[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.phone ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="text-gray-500">#{seatNumberOf(m.seat)}</td>
                <td className="text-gray-500">₹{m.fee}</td>
                <td className="text-gray-500">₹{m.paid}</td>
                <td className="text-expiring font-medium">₹{m.due}</td>
                <td className="p-4">
                  <button
                    onClick={() => setShowRecord(true)}
                    className="text-xs text-accent font-medium"
                  >
                    Record Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-[11px] text-gray-600 font-semibold tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">MEMBER</th>
              <th className="font-normal">SEAT</th>
              <th className="font-normal">PLAN FEE</th>
              <th className="font-normal">PAID (THIS)</th>
              <th className="font-normal">DUE (CYCLE)</th>
              <th className="font-normal">METHOD</th>
              <th className="font-normal">DATE</th>
              <th className="font-normal">STATUS</th>
              <th className="font-normal" />
            </tr>
          </thead>
          <tbody>
            {monthGroups.size === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400">
                  No transactions match.
                </td>
              </tr>
            )}
            {Array.from(monthGroups.entries()).map(([key, rows]) => {
              const monthCollected = rows
                .filter((t: any) => t.status === 'PAID')
                .reduce((sum: number, t: any) => sum + t.amount, 0);
              return (
                <Fragment key={key}>
                  <tr className="bg-black/[0.02] border-b border-black/5">
                    <td colSpan={9} className="px-4 py-2 text-xs font-medium text-gray-600">
                      {monthLabel(key)}
                      <span className="text-gray-400 font-normal ml-2">
                        ₹{monthCollected.toLocaleString('en-IN')} collected · {rows.length} transaction{rows.length === 1 ? '' : 's'}
                      </span>
                    </td>
                  </tr>
                  {rows.map((t: any) => (
                    <tr key={t.id} className="border-b border-black/5 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sidebar text-white flex items-center justify-center text-xs">
                            {memberNameOf(t.member).split(' ').map((p: string) => p[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{memberNameOf(t.member)}</div>
                            <div className="text-xs text-gray-400">{t.label}</div>
                            {t.member?.joinedAt && (
                              <div className="text-[11px] text-gray-300">Joined {formatDate(t.member.joinedAt)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-500">#{seatNumberOf(t.member?.seat)}</td>
                      <td className="text-gray-500">{t.fee != null ? `₹${t.fee}` : '—'}</td>
                      <td>
                        {t.status === 'REFUNDED' ? (
                          <>
                            <span className="line-through text-gray-400">₹{t.amount}</span>
                            <span className="block text-[11px] text-expiring">refunded — doesn't count</span>
                          </>
                        ) : (
                          `₹${t.amount}`
                        )}
                      </td>
                      <td>
                        {t.due != null ? (
                          t.due > 0 ? (
                            <span className="text-expiring font-medium">₹{t.due}</span>
                          ) : t.extra > 0 ? (
                            <span className="text-free">Fully Paid <span className="text-accent">(+₹{t.extra} extra)</span></span>
                          ) : (
                            <span className="text-free">Fully Paid</span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs bg-black/5 rounded-full px-2 py-0.5">{t.method}</span>
                        {t.screenshotUrl && (
                          <a
                            href={t.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[11px] text-accent underline mt-1"
                          >
                            View Screenshot
                          </a>
                        )}
                      </td>
                      <td>{formatDate(t.date || t.createdAt)}</td>
                      <td>
                        <StatusPill status={t.status} />
                      </td>
                      <td className="p-4">
                        {hasRole('TENANT_OWNER', 'BRANCH_MANAGER') && t.status === 'PAID' && (
                          <button
                            onClick={() => refund(t.id)}
                            disabled={refundingId === t.id}
                            className="text-xs text-expiring disabled:opacity-60"
                          >
                            {refundingId === t.id ? 'Refunding…' : 'Refund'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {showRecord && <RecordPaymentModal onClose={() => setShowRecord(false)} onSuccess={refetch} />}
    </div>
  );
}
