'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

export default function ImportMembersModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: { row: number; reason: string }[] } | null>(null);

  const downloadTemplate = () => {
    downloadCsv(
      'student-import-template.csv',
      [
        { header: 'Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Plan', key: 'plan' },
        { header: 'Batch', key: 'batch' },
        { header: 'Goal', key: 'goal' },
        { header: 'Joined Date', key: 'joined' },
      ],
      [
        { name: 'Ravi Kumar', phone: '9876543210', plan: 'Monthly', batch: 'Morning', goal: 'UPSC Aspirant', joined: '2026-01-15' },
      ],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const res = await api.importMembers(file);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not import this file');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md border border-black/5">
        <h2 className="font-serif font-semibold text-lg mb-1">Import Students</h2>
        <p className="text-xs text-gray-500 mb-4">
          Bring in old/existing students from an Excel or CSV file — one row per student.
        </p>

        <button type="button" onClick={downloadTemplate} className="text-xs text-accent font-medium mb-4">
          Download template
        </button>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Excel/CSV file</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-black/5 file:rounded file:px-2 file:py-1 file:text-xs"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Columns needed: Name, Phone, Plan (Monthly/Quarterly/Yearly/Daily Pass), Batch. Goal and Joined
              Date are optional. Each student gets a portal login (phone number, default password 1234)
              same as adding one manually — no Aadhar upload needed for bulk import.
            </p>
          </div>

          {error && <p className="text-xs text-expiring">{error}</p>}

          {result && (
            <div className="text-xs bg-black/5 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
              <p className="font-medium">
                {result.created} student{result.created === 1 ? '' : 's'} imported
                {result.failed > 0 ? `, ${result.failed} row${result.failed === 1 ? '' : 's'} skipped` : ''}.
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-expiring">
                  Row {e.row}: {e.reason}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-black/10 text-sm py-2 rounded-lg"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={submitting || !file}
                className="flex-1 bg-sidebar text-white text-sm py-2 rounded-lg disabled:opacity-60"
              >
                {submitting ? 'Importing…' : 'Import'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
