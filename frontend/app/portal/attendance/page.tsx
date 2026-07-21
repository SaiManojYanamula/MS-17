'use client';

import { useEffect, useState } from 'react';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { api } from '@/lib/api';

export default function PortalAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    api.myAttendance().then(setRecords).catch((err) => setError(err.message || 'Could not load attendance'));
  }, []);

  const changeMonth = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Attendance</h1>
          <p className="text-sm text-gray-500">Your daily attendance record</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg border border-black/10 hover:bg-black/5">
            ‹
          </button>
          <span className="font-medium w-32 text-center">
            {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg border border-black/10 hover:bg-black/5">
            ›
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-expiring mb-3">{error}</p>}

      <div className="bg-card rounded-xl p-5 border border-black/5">
        <AttendanceCalendar records={records} year={cursor.getFullYear()} month={cursor.getMonth()} />
      </div>
    </div>
  );
}
