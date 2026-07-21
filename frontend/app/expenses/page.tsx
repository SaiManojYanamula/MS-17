'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AddExpenseModal from '@/components/AddExpenseModal';
import { api, API_ORIGIN } from '@/lib/api';
import { formatDate } from '@/lib/format';

const categoryColors: Record<string, string> = {
  Rent: '#2a78d6',
  Electricity: '#d97706',
  Salaries: '#7c2d43',
  Maintenance: '#15803d',
  Supplies: '#0d9488',
  Other: '#334155',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ thisMonth: 0, allTime: 0, count: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const refetch = () => {
    api.expenses().then(setExpenses).catch(() => setError('Could not load expenses'));
    api.expensesSummary().then(setSummary).catch(() => {});
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Expenses</h1>
          <p className="text-sm text-gray-500">Rent, salaries, bills, and other operational costs</p>
        </div>
        <div className="flex items-center gap-3">
          <TopBar />
          <button
            onClick={() => setShowAdd(true)}
            className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0"
          >
            + Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="text-2xl font-serif font-semibold">₹{summary.thisMonth.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-0.5">This Month</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="text-2xl font-serif font-semibold">₹{summary.allTime.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-0.5">All Time</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-black/5">
          <div className="text-2xl font-serif font-semibold">{summary.count}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Entries</div>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">CATEGORY</th>
              <th className="font-normal">AMOUNT</th>
              <th className="font-normal">NOTE</th>
              <th className="font-normal">DATE</th>
              <th className="font-normal">RECEIPT</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="border-b border-black/5 last:border-0">
                <td className="p-4">
                  <span
                    className="text-xs rounded-full px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: `${categoryColors[e.category] || '#334155'}1a`,
                      color: categoryColors[e.category] || '#334155',
                    }}
                  >
                    {e.category}
                  </span>
                </td>
                <td className="font-medium">₹{e.amount.toLocaleString('en-IN')}</td>
                <td className="text-gray-500">{e.note || '—'}</td>
                <td>{formatDate(e.createdAt)}</td>
                <td>
                  {e.receiptUrl ? (
                    <a
                      href={`${API_ORIGIN}${e.receiptUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
