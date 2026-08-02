'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const categories = ['Rent', 'Electricity', 'Water Bill', 'Salaries', 'Maintenance', 'Supplies', 'Other'];

export default function EditExpenseModal({
  expense,
  onClose,
  onSuccess,
}: {
  expense: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initialIsKnownCategory = categories.includes(expense.category);
  const [category, setCategory] = useState(initialIsKnownCategory ? expense.category : 'Other');
  const [customCategory, setCustomCategory] = useState(initialIsKnownCategory ? '' : expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [note, setNote] = useState(expense.note || '');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (category === 'Other' && !customCategory.trim()) {
      setError('Type a category name');
      return;
    }
    setSubmitting(true);
    try {
      const finalCategory = category === 'Other' ? customCategory.trim() : category;
      await api.updateExpense(expense.id, {
        category: finalCategory,
        amount: Number(amount),
        note,
        receipt,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not update expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-4">Edit Expense</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {category === 'Other' && (
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type category name"
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount ₹</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. July electricity bill"
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {expense.receiptUrl ? 'Replace Receipt Photo (optional)' : 'Receipt Photo (optional)'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-accent/10 file:text-accent file:rounded-md file:px-3 file:py-1.5 file:text-xs"
            />
            {expense.receiptUrl && !receipt && (
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[11px] text-accent underline mt-1"
              >
                View current receipt
              </a>
            )}
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
