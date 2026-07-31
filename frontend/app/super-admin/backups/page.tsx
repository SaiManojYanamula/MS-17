'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const refetch = () => {
    api.backups().then(setBackups).catch((err) => setError(err.message || 'Could not load backups'));
  };

  useEffect(() => {
    refetch();
  }, []);

  const runBackup = async () => {
    setError('');
    setRunning(true);
    try {
      await api.runBackup();
      refetch();
    } catch (err: any) {
      setError(err.message || 'Backup failed');
    } finally {
      setRunning(false);
    }
  };

  const download = async (key: string) => {
    setError('');
    setDownloadingKey(key);
    try {
      const res = await api.backupDownloadUrl(key);
      window.open(res.url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Could not generate download link');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Backups</h1>
          <p className="text-sm text-gray-500">
            Full database backup, every day at 3 AM · kept for the last 14 backups
          </p>
        </div>
        <button
          onClick={runBackup}
          disabled={running}
          className="bg-sidebar text-white text-sm px-4 py-2 rounded-lg shrink-0 disabled:opacity-60"
        >
          {running ? 'Running…' : 'Backup Now'}
        </button>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl border border-black/5 overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-[10px] text-gray-400 tracking-wide border-b border-black/5">
              <th className="p-4 font-normal">BACKUP</th>
              <th className="font-normal">SIZE</th>
              <th className="font-normal">CREATED</th>
              <th className="font-normal">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.key} className="border-b border-black/5 last:border-0">
                <td className="p-4 font-medium">{b.key.replace('db-backups/', '')}</td>
                <td>{formatSize(b.sizeBytes)}</td>
                <td>{formatDate(b.lastModified)}</td>
                <td className="p-4">
                  <button
                    onClick={() => download(b.key)}
                    disabled={downloadingKey === b.key}
                    className="text-xs text-accent font-medium disabled:opacity-60"
                  >
                    {downloadingKey === b.key ? 'Generating link…' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No backups yet — click "Backup Now" to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 mt-3">
        Download links expire in 5 minutes and are only ever generated for a signed-in Super Admin —
        backups are never stored as a public link.
      </p>
    </div>
  );
}
