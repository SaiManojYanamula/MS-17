'use client';

const statusColor: Record<string, string> = {
  PRESENT: 'bg-free text-white',
  ABSENT: 'bg-expiring text-white',
  HOLIDAY: 'bg-occupied text-white',
};

export default function AttendanceCalendar({
  records,
  year,
  month, // 0-indexed
}: {
  records: { date: string; status: string }[];
  year: number;
  month: number;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const statusByDay = new Map<number, string>();
  records.forEach((r) => {
    const d = new Date(r.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      statusByDay.set(d.getDate(), r.status);
    }
  });
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const presentCount = Array.from(statusByDay.values()).filter((s) => s === 'PRESENT').length;
  const markedCount = statusByDay.size;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-free inline-block" /> Present
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-expiring inline-block" /> Absent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-occupied inline-block" /> Holiday
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-black/5 inline-block" /> Upcoming
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {presentCount} / {markedCount} days
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const status = statusByDay.get(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          return (
            <div
              key={day}
              className={`aspect-square rounded flex items-center justify-center text-[10px] font-medium ${
                status ? statusColor[status] : 'bg-black/5 text-gray-400'
              } ${isToday ? 'ring-2 ring-accent ring-offset-1' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
